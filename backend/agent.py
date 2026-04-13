import os
import re
import json
import time
import uuid
import logging
import torch
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple
from typing_extensions import TypedDict

import pdfplumber
import requests
from dotenv import load_dotenv
from langgraph.graph import StateGraph, START, END
from transformers import AutoTokenizer, AutoModelForCausalLM

load_dotenv()
logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# State
# ──────────────────────────────────────────────

class JobMatchingState(TypedDict):
    session_id: str
    resume_text: str
    resume_analysis: str          # human-readable prose
    resume_keywords: List[str]    # NEW: extracted skill keywords
    resume_score: float           # NEW: 0-100 overall resume quality score
    search_query: str
    enriched_query: str           # NEW: auto-enriched search query
    jobs: List[Dict]
    ranked_jobs: List[Dict]       # NEW: jobs sorted by keyword overlap
    location: str
    selected_job: Dict
    selected_job_id: str
    match_result: Dict[str, Any]
    cover_letter: str
    interview_tips: str
    ats_tips: str                 # NEW: ATS optimisation suggestions
    current_step: str
    step_timings: Dict[str, float]  # NEW: per-node wall-clock seconds
    error: str
    warnings: List[str]           # NEW: non-fatal issues accumulate here


# ──────────────────────────────────────────────
# Agent
# ──────────────────────────────────────────────

class JobMatchingAgent:
    """
    Enhanced job matching agent.

    Architecture
    ────────────
    • Local HuggingFace model for all LLM calls (_invoke / _invoke_json)
    • LangGraph workflow with conditional branching
    • Adzuna API for live job data (both India + US)
    • In-memory prompt cache keyed on SHA-256 of (prompt, max_new_tokens)
    """

    # ── init ──────────────────────────────────

    def __init__(self, model_path: str = "../model/merged_model"):
        logger.info("Loading model from %s …", model_path)
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info("Using device: %s", self.device)

        if self.device.type == "cuda":
            from transformers import BitsAndBytesConfig
            quant_config = BitsAndBytesConfig(load_in_4bit=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                quantization_config=quant_config,
                device_map="cuda",
            )
        else:
            # CPU fallback — float32 (float16 unsupported on most CPUs).
            self.model = AutoModelForCausalLM.from_pretrained(
                model_path,
                dtype=torch.float32,
            )
            self.model.to(self.device)

        self.model.eval()

        self.app_id  = os.getenv("ADZUNA_APP_ID")
        self.app_key = os.getenv("ADZUNA_APP_KEY")

        # Simple in-memory prompt cache  {cache_key: response_str}
        self._cache: Dict[str, str] = {}

        self.workflow = self._create_workflow()
        logger.info("JobMatchingAgent ready.")

    # ── inference core ────────────────────────

    def _cache_key(self, prompt: str, max_new_tokens: int) -> str:
        import hashlib
        return hashlib.sha256(f"{prompt}|{max_new_tokens}".encode()).hexdigest()

    def _invoke(
        self,
        prompt: str,
        max_new_tokens: int = 1024,
        temperature: float = 0.7,
        use_cache: bool = True,
        retries: int = 2,
    ) -> str:
        """
        Run inference on the local HuggingFace model.
        Includes prompt caching and automatic retry on CUDA/OOM errors.
        """
        key = self._cache_key(prompt, max_new_tokens)
        if use_cache and key in self._cache:
            logger.debug("Cache hit for prompt (len=%d)", len(prompt))
            return self._cache[key]

        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=4096,
        )
        input_ids = inputs["input_ids"].to(self.device)

        for attempt in range(retries + 1):
            try:
                with torch.no_grad():
                    output_ids = self.model.generate(
                        input_ids,
                        max_new_tokens=max_new_tokens,
                        do_sample=True,
                        temperature=temperature,
                        top_p=0.9,
                        repetition_penalty=1.1,
                        pad_token_id=self.tokenizer.eos_token_id,
                    )
                new_tokens = output_ids[0][input_ids.shape[-1]:]
                result = self.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
                if use_cache:
                    self._cache[key] = result
                return result
            except RuntimeError as exc:
                if attempt < retries:
                    logger.warning("Model error (attempt %d): %s — retrying", attempt + 1, exc)
                    time.sleep(1)
                else:
                    raise

    def _invoke_json(self, prompt: str, max_new_tokens: int = 512) -> Dict:
        """
        Ask the model to respond with JSON only.
        Wraps _invoke and robustly parses the result.
        Returns {} on parse failure (never raises).
        """
        json_prompt = (
            prompt
            + "\n\nRespond ONLY with valid JSON. No explanation, no markdown fences."
        )
        raw = self._invoke(json_prompt, max_new_tokens=max_new_tokens, temperature=0.2)

        # Strip accidental markdown fences
        raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()

        # Find first JSON object in the response
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        logger.warning("_invoke_json: could not parse JSON from model output")
        return {}

    def health_check(self) -> bool:
        """Quick model sanity-check for the /health endpoint."""
        try:
            result = self._invoke("Hello", max_new_tokens=8, use_cache=False)
            return bool(result)
        except Exception:
            return False

    # ── PDF extraction ────────────────────────

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """
        Extract text page-by-page, skipping corrupted pages gracefully.
        Falls back to a raw byte scan if pdfplumber yields nothing.
        """
        pages_text: List[str] = []
        try:
            with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
                for i, page in enumerate(pdf.pages):
                    try:
                        t = page.extract_text()
                        if t:
                            pages_text.append(t)
                    except Exception as page_err:
                        logger.warning("Skipping page %d: %s", i, page_err)
        except Exception as e:
            raise ValueError(f"Cannot open PDF: {e}") from e

        text = "\n\n".join(pages_text).strip()
        if not text:
            raise ValueError("No readable text found in PDF.")
        return text

    # ── skill keyword extraction ───────────────

    # Hand-curated keyword list covering the most common tech resume terms.
    _TECH_KEYWORDS = {
        "python", "java", "javascript", "typescript", "go", "golang", "rust",
        "c++", "c#", "ruby", "php", "swift", "kotlin", "scala", "r",
        "react", "angular", "vue", "next.js", "node.js", "django", "flask",
        "fastapi", "spring", "express", "rails",
        "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
        "cassandra", "dynamodb", "sqlite",
        "aws", "gcp", "azure", "docker", "kubernetes", "terraform",
        "ansible", "jenkins", "ci/cd", "github actions", "circleci",
        "machine learning", "deep learning", "nlp", "computer vision",
        "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy",
        "data engineering", "spark", "kafka", "airflow", "dbt",
        "rest", "graphql", "grpc", "microservices", "distributed systems",
        "agile", "scrum", "kanban", "tdd", "bdd",
        "linux", "bash", "git", "figma", "jira", "confluence",
    }

    def extract_keywords(self, text: str) -> List[str]:
        """Return tech keywords found in the text (lowercased, deduped, sorted)."""
        lower = text.lower()
        found = sorted({kw for kw in self._TECH_KEYWORDS if kw in lower})
        return found

    # ── smart query builder ───────────────────

    def _enrich_query(self, raw_query: str, keywords: List[str]) -> str:
        """
        Append the top-3 most relevant skills to the raw query so that
        Adzuna returns tighter results (e.g. "developer python react aws").
        Avoids duplicating terms already in the query.
        """
        lower_q = raw_query.lower()
        additions = [kw for kw in keywords[:5] if kw not in lower_q][:3]
        if additions:
            return f"{raw_query} {' '.join(additions)}"
        return raw_query

    # ── resume scorer ─────────────────────────

    def _score_resume(self, resume_text: str, keywords: List[str]) -> float:
        """
        Heuristic resume quality score (0-100):
          30 pts — keyword breadth  (≥15 keywords = full marks)
          30 pts — length/detail    (≥800 words = full marks)
          20 pts — quantified achievements (numbers in resume)
          20 pts — education signal (degree keywords present)
        """
        kw_score   = min(len(keywords) / 15.0, 1.0) * 30
        words      = len(resume_text.split())
        len_score  = min(words / 800.0, 1.0) * 30
        nums       = len(re.findall(r"\d+", resume_text))
        quant_score = min(nums / 20.0, 1.0) * 20
        edu_terms  = {"bachelor", "master", "phd", "b.tech", "m.tech", "degree", "university", "college"}
        edu_score  = 20.0 if any(t in resume_text.lower() for t in edu_terms) else 0.0
        return round(kw_score + len_score + quant_score + edu_score, 1)

    # ── job ranking ───────────────────────────

    def _rank_jobs(self, jobs: List[Dict], keywords: List[str]) -> List[Dict]:
        """
        Score each job by how many of the candidate's keywords appear in
        its description, then return the list sorted descending.
        Adds a 'relevance_score' field to each job dict.
        """
        kw_set = set(keywords)
        for job in jobs:
            desc = (job.get("description", "") + " " + job.get("full_description", "")).lower()
            overlap = sum(1 for kw in kw_set if kw in desc)
            job["relevance_score"] = overlap
        return sorted(jobs, key=lambda j: j["relevance_score"], reverse=True)

    # ── salary helpers ────────────────────────

    @staticmethod
    def _fmt_salary(job: Dict) -> str:
        if not job.get("salary_min") or not job.get("salary_max"):
            return "Not specified"
        cur = job.get("currency", "USD")
        lo, hi = int(job["salary_min"]), int(job["salary_max"])
        if cur == "INR":
            # Convert raw annual rupees to LPA display
            return f"₹{lo:,} – ₹{hi:,} p.a."
        return f"${lo:,} – ${hi:,} p.a."

    # ── workflow definition ───────────────────

    def _create_workflow(self) -> StateGraph:
        wf = StateGraph(JobMatchingState)

        wf.add_node("resume_analysis",          self._resume_analysis_node)
        wf.add_node("job_search",               self._job_search_node)
        wf.add_node("job_matching",             self._job_matching_node)
        wf.add_node("cover_letter_generation",  self._cover_letter_node)
        wf.add_node("interview_tips_generation", self._interview_tips_node)
        wf.add_node("ats_optimisation",         self._ats_tips_node)   # NEW

        wf.add_edge(START, "resume_analysis")
        wf.add_edge("resume_analysis", "job_search")
        wf.add_edge("job_search", "job_matching")
        wf.add_conditional_edges(
            "job_matching",
            self._route_after_match,
            {"generate": "cover_letter_generation", "end": END},
        )
        wf.add_edge("cover_letter_generation",   "interview_tips_generation")
        wf.add_edge("interview_tips_generation", "ats_optimisation")
        wf.add_edge("ats_optimisation",          END)

        return wf.compile()

    def _route_after_match(self, state: JobMatchingState) -> str:
        if state.get("match_result") and state.get("selected_job"):
            return "generate"
        return "end"

    # ── helpers ───────────────────────────────

    @staticmethod
    def _empty_state() -> JobMatchingState:
        return JobMatchingState(
            session_id="", resume_text="", resume_analysis="",
            resume_keywords=[], resume_score=0.0,
            search_query="", enriched_query="",
            jobs=[], ranked_jobs=[], location="",
            selected_job={}, selected_job_id="",
            match_result={}, cover_letter="", interview_tips="", ats_tips="",
            current_step="", step_timings={}, error="", warnings=[],
        )

    @staticmethod
    def _tick(state: JobMatchingState, node: str, t0: float) -> Dict[str, float]:
        timings = dict(state.get("step_timings") or {})
        timings[node] = round(time.time() - t0, 2)
        return timings

    @staticmethod
    def _add_warning(state: JobMatchingState, msg: str) -> List[str]:
        w = list(state.get("warnings") or [])
        w.append(msg)
        return w

    # ── node: resume analysis ─────────────────

    def _resume_analysis_node(self, state: JobMatchingState) -> Dict:
        t0 = time.time()
        node = "resume_analysis"

        if not state.get("resume_text"):
            return {**state, "current_step": node,
                    "error": "No resume text provided",
                    "step_timings": self._tick(state, node, t0)}

        resume_text = state["resume_text"]

        # --- keyword extraction (no LLM needed) ---
        keywords = self.extract_keywords(resume_text)
        resume_score = self._score_resume(resume_text, keywords)

        warnings = list(state.get("warnings") or [])
        if resume_score < 40:
            warnings.append(
                f"Resume quality score is low ({resume_score}/100). "
                "Consider adding more quantified achievements and technical skills."
            )

        prompt = f"""You are an expert technical recruiter. Analyze the resume below and produce a structured report.

RESUME:
{resume_text}

Write your analysis under these exact headings:

## Personal Information
Name, contact, location.

## Technical Skills
List all programming languages, frameworks, databases, cloud tools, and methodologies found. Be exhaustive.

## Experience Analysis
Total years of experience, seniority level (Junior / Mid / Senior / Lead / Principal), domain expertise, and top 3 achievements with measurable impact.

## Education & Certifications
Degrees, institutions, graduation years, professional certifications, and relevant online courses.

## Strengths
The candidate's top 5 strongest areas with a one-line justification each.

## Improvement Areas
The 3 most important gaps in skills, experience, or credentials, ordered by priority.

## Market Positioning
State clearly:
- India market fit: Yes or No, and one sentence why.
- US/global market fit: Yes or No, and one sentence why.
- Recommended salary range in INR (LPA) and USD.

## Resume Score Commentary
The resume has been scored {resume_score}/100. Explain what drove the score up and what the candidate should improve.

Be specific and actionable. Use bullet points inside each section.
"""

        try:
            analysis = self._invoke(prompt, max_new_tokens=1200)
            return {
                **state,
                "resume_analysis": analysis,
                "resume_keywords": keywords,
                "resume_score": resume_score,
                "current_step": node,
                "error": "",
                "warnings": warnings,
                "step_timings": self._tick(state, node, t0),
            }
        except Exception as exc:
            return {
                **state,
                "resume_keywords": keywords,
                "resume_score": resume_score,
                "current_step": node,
                "error": f"Resume analysis failed: {exc}",
                "step_timings": self._tick(state, node, t0),
            }

    # ── node: job search ──────────────────────

    def _job_search_node(self, state: JobMatchingState) -> Dict:
        t0 = time.time()
        node = "job_search"

        raw_query = state.get("search_query", "software developer").strip() or "software developer"
        keywords  = state.get("resume_keywords", [])
        enriched  = self._enrich_query(raw_query, keywords)

        warnings = list(state.get("warnings") or [])

        # Try live Adzuna India first, then US, then synthetic fallback
        jobs, location = [], "Unknown"

        adzuna_india = self._get_adzuna_jobs(enriched, country="in", currency="INR")
        if adzuna_india:
            jobs, location = adzuna_india, "India"
        else:
            adzuna_us = self._get_adzuna_jobs(enriched, country="us", currency="USD")
            if adzuna_us:
                jobs, location = adzuna_us, "US"
            else:
                warnings.append("Live job API unavailable — showing synthetic listings.")
                jobs = self._synthetic_jobs(raw_query)
                location = "India (demo)"

        ranked = self._rank_jobs(jobs, keywords)

        return {
            **state,
            "enriched_query": enriched,
            "jobs": jobs,
            "ranked_jobs": ranked,
            "location": location,
            "current_step": node,
            "error": "",
            "warnings": warnings,
            "step_timings": self._tick(state, node, t0),
        }

    # ── node: job matching ────────────────────

    def _job_matching_node(self, state: JobMatchingState) -> Dict:
        t0 = time.time()
        node = "job_matching"

        if not state.get("selected_job"):
            return {
                **state,
                "match_result": {},
                "current_step": node,
                "error": "No job selected for matching",
                "step_timings": self._tick(state, node, t0),
            }

        job             = state["selected_job"]
        resume_analysis = state.get("resume_analysis", "")
        keywords        = state.get("resume_keywords", [])
        salary_display  = self._fmt_salary(job)

        # --- quick keyword-overlap pre-score (instant, no LLM) ---
        desc_lower = (job.get("full_description", "") + " " + job.get("description", "")).lower()
        overlap    = [kw for kw in keywords if kw in desc_lower]
        pre_score  = min(len(overlap) / max(len(keywords), 1), 1.0) * 100

        prompt = f"""You are a senior technical recruiter performing a detailed candidate-job match analysis.

CANDIDATE RESUME ANALYSIS:
{resume_analysis}

JOB DETAILS:
Title: {job.get('title')}
Company: {job.get('company')}
Location: {job.get('location')}, {job.get('country')}
Salary: {salary_display}
Description:
{job.get('full_description', job.get('description', 'N/A'))}

Provide your analysis under these exact headings:

## Match Score
Give a single integer percentage (0–100) on its own line like: SCORE: 72
Then explain the score in 2–3 sentences.

## Skill Alignment
For each key requirement in the job description, state whether the candidate has it (✅ Present / ⚠️ Partial / ❌ Missing).

## Experience Fit
Does the candidate's seniority and domain match? What is their biggest experiential advantage? Their biggest gap?

## Salary Fit
Is the listed salary range appropriate for the candidate's profile? Should they negotiate up or down?

## Gap Analysis
List the top 3 missing skills/experiences with:
  - Impact: High / Medium / Low
  - Time to bridge: e.g. "2–3 months of focused learning"

## Application Strategy
Three specific, concrete actions the candidate should take when applying for this role.

## Red Flags
Any concerns the hiring manager might raise (employment gaps, mismatched seniority, etc.).

Be direct and specific. The candidate needs honest, actionable feedback.
"""

        try:
            analysis_text = self._invoke(prompt, max_new_tokens=1400)

            # --- extract SCORE: N from LLM output ---
            score = pre_score / 100.0  # default to keyword pre-score
            score_match = re.search(r"SCORE:\s*(\d+)", analysis_text)
            if score_match:
                raw_val = int(score_match.group(1))
                score = max(0.0, min(raw_val, 100)) / 100.0
            else:
                # fallback: grab any standalone percentage
                pcts = re.findall(r"(\d+)\s*%", analysis_text)
                if pcts:
                    score = max(0.0, min(int(pcts[0]), 100)) / 100.0

            match_result = {
                "match_score":   score,
                "pre_score":     round(pre_score / 100.0, 2),
                "keyword_overlap": overlap,
                "analysis":      analysis_text,
                "job_title":     job.get("title"),
                "company":       job.get("company"),
                "location":      job.get("location"),
                "country":       job.get("country"),
            }

            return {
                **state,
                "match_result": match_result,
                "current_step": node,
                "error": "",
                "step_timings": self._tick(state, node, t0),
            }

        except Exception as exc:
            return {
                **state,
                "match_result": {},
                "current_step": node,
                "error": f"Match analysis failed: {exc}",
                "step_timings": self._tick(state, node, t0),
            }

    # ── node: cover letter ────────────────────

    def _cover_letter_node(self, state: JobMatchingState) -> Dict:
        t0 = time.time()
        node = "cover_letter_generation"

        job            = state.get("selected_job", {})
        resume_analysis = state.get("resume_analysis", "")
        match_analysis  = (state.get("match_result") or {}).get("analysis", "")
        overlap_skills  = (state.get("match_result") or {}).get("keyword_overlap", [])

        # Build a concise skill highlight line for the prompt
        skill_line = ", ".join(overlap_skills[:6]) if overlap_skills else "relevant technical skills"

        prompt = f"""Write a professional cover letter for the following application.

JOB:
Title: {job.get('title')}
Company: {job.get('company')}
Location: {job.get('location')}

CANDIDATE PROFILE (from resume analysis):
{resume_analysis}

MATCH INSIGHTS:
{match_analysis[:800]}

KEY OVERLAPPING SKILLS: {skill_line}

Requirements for the cover letter:
1. Length: 350–420 words (strictly).
2. Structure: Date → "Dear Hiring Team," → Opening paragraph → Two body paragraphs → Closing paragraph → "Sincerely," → [Candidate Name].
3. Opening: One punchy sentence establishing enthusiasm + one specific thing the candidate knows about {job.get('company')}.
4. Body paragraph 1: Highlight 2–3 specific achievements from the resume with numbers. Tie them directly to this role.
5. Body paragraph 2: Address the most critical job requirement and show exactly how the candidate meets it. Weave in {skill_line}.
6. Closing: Express eagerness for an interview, provide a call-to-action.
7. Tone: Confident and specific. No filler phrases like "I am writing to express my interest".
8. Do NOT invent facts not present in the resume analysis.

Output only the letter text, nothing else.
"""

        try:
            letter = self._invoke(prompt, max_new_tokens=700, temperature=0.75)
            return {
                **state,
                "cover_letter": letter,
                "current_step": node,
                "error": "",
                "step_timings": self._tick(state, node, t0),
            }
        except Exception as exc:
            return {
                **state,
                "current_step": node,
                "error": f"Cover letter generation failed: {exc}",
                "step_timings": self._tick(state, node, t0),
            }

    # ── node: interview tips ──────────────────

    def _interview_tips_node(self, state: JobMatchingState) -> Dict:
        t0 = time.time()
        node = "interview_tips_generation"

        job            = state.get("selected_job", {})
        resume_analysis = state.get("resume_analysis", "")
        match_analysis  = (state.get("match_result") or {}).get("analysis", "")
        overlap_skills  = (state.get("match_result") or {}).get("keyword_overlap", [])
        salary_display  = self._fmt_salary(job)

        prompt = f"""Create a comprehensive, role-specific interview preparation guide.

JOB:
Title: {job.get('title')} at {job.get('company')} ({job.get('location')}, {job.get('country')})
Salary: {salary_display}
Description:
{job.get('full_description', job.get('description', ''))[:1000]}

CANDIDATE'S MATCHING SKILLS: {', '.join(overlap_skills[:8]) or 'see resume'}

MATCH ANALYSIS HIGHLIGHTS:
{match_analysis[:600]}

Produce the guide under these exact sections:

## Technical Questions (5 questions)
For each: write the question, then a model answer tailored to this candidate's background.

## Behavioral Questions (4 questions)
For each: write the question and a STAR-format answer using the candidate's likely experience.

## System Design / Architecture Question
One relevant system design question for this role, with a structured approach to answering it.

## Research Checklist
Five specific things to research about {job.get('company')} before the interview, with why each matters.

## Questions to Ask the Interviewer (6 questions)
Thoughtful, role-specific questions that signal genuine interest and intelligence.

## Addressing Weak Points
How to handle the top 2 gaps identified in the match analysis.

## Salary Negotiation
Given the listed salary of {salary_display} and this candidate's profile, provide a concrete negotiation script (2–3 sentences the candidate can actually say).

## 7-Day Prep Timeline
A day-by-day plan for the week before the interview.

Be specific to this exact role and company — no generic advice.
"""

        try:
            tips = self._invoke(prompt, max_new_tokens=1600)
            return {
                **state,
                "interview_tips": tips,
                "current_step": node,
                "error": "",
                "step_timings": self._tick(state, node, t0),
            }
        except Exception as exc:
            return {
                **state,
                "current_step": node,
                "error": f"Interview tips generation failed: {exc}",
                "step_timings": self._tick(state, node, t0),
            }

    # ── node: ATS tips (NEW) ──────────────────

    def _ats_tips_node(self, state: JobMatchingState) -> Dict:
        """
        Generate ATS (Applicant Tracking System) optimisation suggestions
        by comparing the candidate's keyword set against the job description.
        """
        t0 = time.time()
        node = "ats_optimisation"

        job       = state.get("selected_job", {})
        keywords  = state.get("resume_keywords", [])
        resume_text = state.get("resume_text", "")

        jd_text   = job.get("full_description", job.get("description", ""))
        jd_kws    = self.extract_keywords(jd_text)
        missing   = [kw for kw in jd_kws if kw not in keywords]
        present   = [kw for kw in jd_kws if kw in keywords]

        prompt = f"""You are an ATS (Applicant Tracking System) optimisation expert.

JOB TITLE: {job.get('title')} at {job.get('company')}

KEYWORDS PRESENT in both resume and job description: {', '.join(present) or 'none'}
KEYWORDS MISSING from resume but required by job: {', '.join(missing) or 'none'}

RESUME EXCERPT (first 600 chars):
{resume_text[:600]}

Provide ATS optimisation advice under these headings:

## ATS Keyword Gaps
List the missing keywords and for each:
- Suggest one natural sentence the candidate could add to their resume to include it authentically.

## Formatting Fixes
Three specific formatting improvements to make the resume more ATS-friendly (based on common ATS parsing pitfalls).

## Section Order Recommendation
What is the optimal section ordering for this role type (e.g. Skills before Experience, or vice versa)?

## Tailored Resume Summary
Write a 3-sentence professional summary the candidate should add to the top of their resume, optimised for ATS and tailored to {job.get('title')}.

Be concrete and specific.
"""

        try:
            tips = self._invoke(prompt, max_new_tokens=900)
        except Exception as exc:
            tips = f"ATS tips unavailable: {exc}"

        return {
            **state,
            "ats_tips": tips,
            "current_step": node,
            "step_timings": self._tick(state, node, t0),
        }

    # ── Adzuna API (India + US) ───────────────

    # Maps Adzuna country codes to human-readable names and default currencies.
    _ADZUNA_COUNTRIES = {
        "in": ("India",          "INR"),
        "us": ("United States",  "USD"),
        "gb": ("United Kingdom", "GBP"),
        "au": ("Australia",      "AUD"),
        "ca": ("Canada",         "CAD"),
        "de": ("Germany",        "EUR"),
        "sg": ("Singapore",      "SGD"),
    }

    def _get_adzuna_jobs(
        self,
        query: str,
        country: str = "in",
        currency: str = "INR",
        page: int = 1,
        results: int = 10,
    ) -> List[Dict]:
        """
        Fetch jobs from Adzuna using the documented URL format:
          http://api.adzuna.com/v1/api/jobs/{country}/search/{page}
            ?app_id=...&app_key=...&results_per_page=...&what=...&content-type=application/json

        country codes: in=India, us=US, gb=UK, au=Australia, ca=Canada, de=Germany, sg=Singapore
        NOTE: Adzuna uses plain http (not https) as shown in their official docs.
        content-type must be a query param per Adzuna spec, NOT a request header.
        """
        if not self.app_id or not self.app_key:
            logger.warning("Adzuna API credentials missing — set ADZUNA_APP_ID and ADZUNA_APP_KEY in .env")
            return []

        country_name, default_currency = self._ADZUNA_COUNTRIES.get(
            country, (country.upper(), currency)
        )
        # Use caller-supplied currency if explicitly passed, otherwise use country default
        effective_currency = currency if currency else default_currency

        # Adzuna official URL format uses http (not https)
        url = f"http://api.adzuna.com/v1/api/jobs/{country}/search/{page}"

        # content-type is a query param per Adzuna docs, not a header
        params = {
            "app_id":           self.app_id,
            "app_key":          self.app_key,
            "results_per_page": results,
            "what":             query,
            "content-type":     "application/json",
        }

        try:
            resp = requests.get(
                url,
                params=params,
                headers={"Accept": "application/json"},
                timeout=12,
            )
            resp.raise_for_status()
        except requests.exceptions.HTTPError as exc:
            logger.warning(
                "Adzuna %s API HTTP error %s: %s",
                country_name, exc.response.status_code, exc.response.text[:200],
            )
            return []
        except requests.RequestException as exc:
            logger.warning("Adzuna %s API request failed: %s", country_name, exc)
            return []

        try:
            data = resp.json()
        except ValueError:
            logger.warning("Adzuna %s returned non-JSON response", country_name)
            return []

        raw_jobs = data.get("results", [])
        if not raw_jobs:
            logger.info("Adzuna %s: query=%r returned 0 results", country_name, query)
            return []

        formatted = []
        for job in raw_jobs:
            desc       = job.get("description", "")
            salary_min = job.get("salary_min")
            salary_max = job.get("salary_max")
            formatted.append({
                "id":               f"{country}_{job.get('id', uuid.uuid4().hex[:8])}",
                "title":            job.get("title", "Software Developer"),
                "company":          job.get("company", {}).get("display_name", "Unknown Company"),
                "location":         job.get("location", {}).get("display_name", country_name),
                "description":      desc[:400] + ("…" if len(desc) > 400 else ""),
                "full_description": desc,
                "salary_min":       salary_min,
                "salary_max":       salary_max,
                "currency":         effective_currency,
                "contract_type":    job.get("contract_type", "full_time"),
                "country":          country_name,
                "posted_date":      job.get("created", "")[:10],
                "apply_url":        job.get("redirect_url", ""),
                "relevance_score":  0,
            })

        logger.info("Adzuna %s: fetched %d jobs for query=%r", country_name, len(formatted), query)
        return formatted

    # ── synthetic job fallback ────────────────

    def _synthetic_jobs(self, query: str) -> List[Dict]:
        """Demo listings used when the Adzuna API is unavailable."""
        companies = [
            "Tata Consultancy Services", "Infosys", "Wipro", "HCL Technologies",
            "Tech Mahindra", "Accenture India", "IBM India", "Microsoft India",
            "Google India", "Amazon India",
        ]
        cities = [
            "Bangalore, Karnataka", "Hyderabad, Telangana", "Pune, Maharashtra",
            "Chennai, Tamil Nadu", "Mumbai, Maharashtra", "Gurgaon, Haryana",
            "Noida, Uttar Pradesh", "Kolkata, West Bengal",
        ]
        titles = [
            f"Senior {query}", f"Lead {query}", f"Principal {query}",
            f"{query} — Team Lead", f"Full Stack {query}", f"Backend {query}",
            f"Frontend {query}", f"Staff {query}",
        ]
        jobs = []
        for i in range(8):
            base = 800_000 + i * 200_000
            company = companies[i % len(companies)]
            jobs.append({
                "id":            f"demo_{uuid.uuid4().hex[:8]}",
                "title":         titles[i % len(titles)],
                "company":       company,
                "location":      cities[i % len(cities)],
                "description":   f"Join {company} as a {query}. Work on cutting-edge projects.",
                "full_description": (
                    f"We are looking for a talented {query} to join {company}.\n\n"
                    "Responsibilities:\n"
                    "• Design and build scalable systems\n"
                    "• Collaborate with cross-functional teams\n"
                    "• Conduct code reviews\n\n"
                    "Requirements:\n"
                    "• 3+ years experience\n"
                    "• Strong Python / Java / JavaScript skills\n"
                    "• REST API and microservices knowledge\n"
                    "• Cloud experience (AWS / Azure / GCP)"
                ),
                "salary_min":    base,
                "salary_max":    base + 400_000,
                "currency":      "INR",
                "contract_type": "full_time",
                "country":       "India",
                "posted_date":   "",
                "apply_url":     "",
                "relevance_score": 0,
            })
        return jobs

    # ── public standalone API ─────────────────
    # These are the methods called directly by app.py routes.
    # Each builds a minimal state, calls the appropriate node, and returns
    # only what the route needs — keeping app.py decoupled from LangGraph.

    def analyze_resume(self, resume_text: str) -> Dict[str, Any]:
        """
        Returns:
            {
              "analysis": str,
              "keywords": List[str],
              "score": float,
              "warnings": List[str],
              "timing": float,
            }
        """
        state = {**self._empty_state(), "resume_text": resume_text}
        out   = self._resume_analysis_node(state)
        return {
            "analysis": out.get("resume_analysis", ""),
            "keywords": out.get("resume_keywords", []),
            "score":    out.get("resume_score", 0.0),
            "warnings": out.get("warnings", []),
            "timing":   out.get("step_timings", {}).get("resume_analysis", 0.0),
        }

    def search_jobs(self, query: str, keywords: Optional[List[str]] = None) -> Tuple[List[Dict], List[Dict], str]:
        """
        Returns: (all_jobs, ranked_jobs, location)
        ranked_jobs are sorted by keyword overlap with the candidate.
        """
        state = {
            **self._empty_state(),
            "search_query":    query,
            "resume_keywords": keywords or [],
        }
        out = self._job_search_node(state)
        return out.get("jobs", []), out.get("ranked_jobs", []), out.get("location", "Unknown")

    def analyze_job_match(self, resume_analysis: str, job: Dict, resume_keywords: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Returns the full match_result dict:
            match_score, pre_score, keyword_overlap, analysis, …
        """
        state = {
            **self._empty_state(),
            "resume_analysis":  resume_analysis,
            "resume_keywords":  resume_keywords or [],
            "selected_job":     job,
            "selected_job_id":  job.get("id", ""),
        }
        out = self._job_matching_node(state)
        return out.get("match_result", {})

    def generate_cover_letter(
        self, resume_analysis: str, job: Dict, match_analysis: str,
        keyword_overlap: Optional[List[str]] = None,
    ) -> str:
        state = {
            **self._empty_state(),
            "resume_analysis": resume_analysis,
            "selected_job":    job,
            "match_result":    {"analysis": match_analysis, "keyword_overlap": keyword_overlap or []},
        }
        out = self._cover_letter_node(state)
        return out.get("cover_letter", "")

    def generate_interview_tips(
        self, resume_analysis: str, job: Dict, match_analysis: str,
        keyword_overlap: Optional[List[str]] = None,
    ) -> str:
        state = {
            **self._empty_state(),
            "resume_analysis": resume_analysis,
            "resume_text":     "",
            "selected_job":    job,
            "match_result":    {"analysis": match_analysis, "keyword_overlap": keyword_overlap or []},
        }
        out = self._interview_tips_node(state)
        return out.get("interview_tips", "")

    def generate_ats_tips(
        self, resume_text: str, resume_keywords: List[str], job: Dict,
    ) -> str:
        """NEW: standalone ATS optimisation."""
        state = {
            **self._empty_state(),
            "resume_text":     resume_text,
            "resume_keywords": resume_keywords,
            "selected_job":    job,
        }
        out = self._ats_tips_node(state)
        return out.get("ats_tips", "")

    # ── full workflow helpers ─────────────────

    def process_resume_and_search(self, resume_text: str, search_query: str) -> JobMatchingState:
        """Run the full workflow up through job_search (no job selected yet)."""
        initial = {
            **self._empty_state(),
            "session_id":   str(uuid.uuid4()),
            "resume_text":  resume_text,
            "search_query": search_query,
        }
        return self.workflow.invoke(initial, {"recursion_limit": 15})

    def complete_job_analysis(self, state: JobMatchingState, selected_job_id: str) -> JobMatchingState:
        """Continue the workflow for a specific selected job."""
        job = next((j for j in state.get("jobs", []) if j["id"] == selected_job_id), None)
        if not job:
            return {**state, "error": f"Job {selected_job_id} not found in session."}
        updated = {**state, "selected_job": job, "selected_job_id": selected_job_id}
        return self.workflow.invoke(updated, {"recursion_limit": 15})
import logging
import threading
import time
import uuid
from datetime import datetime, timedelta
from functools import wraps
from typing import Any, Dict, Optional

from flask import Flask, jsonify, request, g
from flask_cors import CORS

from agent import JobMatchingAgent

# ── logging ──────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ── app setup ─────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024   # 16 MB

ALLOWED_EXTENSIONS = {"pdf"}
SESSION_TTL_HOURS  = 2
MAX_REQUESTS_PER_HOUR_PER_SESSION = 30

# ── agent init ────────────────────────────────
try:
    agent = JobMatchingAgent()
    logger.info("JobMatchingAgent initialised successfully.")
except Exception as exc:
    logger.error("Failed to initialise JobMatchingAgent: %s", exc)
    agent = None

# ── in-memory stores ──────────────────────────
# temp_storage: session_id → session dict
# rate_store:   session_id → {count: int, window_start: datetime}
temp_storage: Dict[str, Dict] = {}
rate_store:   Dict[str, Dict] = {}


# ──────────────────────────────────────────────
# Background cleanup
# ──────────────────────────────────────────────

def _cleanup_loop():
    while True:
        try:
            cutoff = datetime.now() - timedelta(hours=SESSION_TTL_HOURS)
            expired = [sid for sid, data in temp_storage.items()
                       if data.get("created_at", datetime.now()) < cutoff]
            for sid in expired:
                temp_storage.pop(sid, None)
                rate_store.pop(sid, None)
                logger.info("Expired session cleaned up: %s", sid)
        except Exception as exc:
            logger.error("Cleanup error: %s", exc)
        time.sleep(3600)


threading.Thread(target=_cleanup_loop, daemon=True).start()


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def _err(message: str, status: int = 400) -> tuple:
    """Uniform error response."""
    return jsonify({"success": False, "error": message}), status


def _get_session(session_id: Optional[str]) -> Optional[Dict]:
    """Return session dict or None if invalid/missing."""
    if not session_id or session_id not in temp_storage:
        return None
    return temp_storage[session_id]


def _check_rate(session_id: str) -> bool:
    """
    Sliding-window rate limit: max MAX_REQUESTS_PER_HOUR_PER_SESSION per hour.
    Returns True if request is allowed, False if blocked.
    """
    now = datetime.now()
    entry = rate_store.get(session_id)
    if not entry or (now - entry["window_start"]) > timedelta(hours=1):
        rate_store[session_id] = {"count": 1, "window_start": now}
        return True
    if entry["count"] >= MAX_REQUESTS_PER_HOUR_PER_SESSION:
        return False
    entry["count"] += 1
    return True


def _fmt_salary(job: Dict) -> str:
    """Delegate to agent for consistent formatting."""
    if agent:
        return agent._fmt_salary(job)
    if not job.get("salary_min") or not job.get("salary_max"):
        return "Not specified"
    cur = job.get("currency", "USD")
    lo, hi = int(job["salary_min"]), int(job["salary_max"])
    return f"₹{lo:,} – ₹{hi:,} p.a." if cur == "INR" else f"${lo:,} – ${hi:,} p.a."


def _public_job(job: Dict) -> Dict:
    """Strip internal fields before sending a job to the client."""
    return {
        "id":            job["id"],
        "title":         job["title"],
        "company":       job["company"],
        "location":      job["location"],
        "country":       job["country"],
        "description":   job.get("description", ""),
        "salary_display": _fmt_salary(job),
        "contract_type": job.get("contract_type", "full_time"),
        "posted_date":   job.get("posted_date", ""),
        "apply_url":     job.get("apply_url", ""),
        "relevance_score": job.get("relevance_score", 0),
    }


def require_agent(f):
    """Decorator: return 503 if agent failed to initialise."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        if agent is None:
            return _err("Service unavailable — agent not initialised.", 503)
        return f(*args, **kwargs)
    return wrapper


def require_json(f):
    """Decorator: parse JSON body or return 400."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        data = request.get_json(silent=True)
        if data is None:
            return _err("Request body must be valid JSON.")
        g.json = data
        return f(*args, **kwargs)
    return wrapper


# ── request-ID middleware ─────────────────────

@app.before_request
def _attach_request_id():
    g.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))


@app.after_request
def _add_request_id_header(response):
    response.headers["X-Request-ID"] = getattr(g, "request_id", "")
    return response


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "message": "Job Matching API",
        "version": "2.0.0",
        "status": "active",
        "endpoints": [
            "GET  /health",
            "POST /upload-resume",
            "POST /search-jobs",
            "POST /analyze-match",
            "POST /generate-cover-letter",
            "POST /generate-interview-tips",
            "POST /generate-ats-tips",
            "POST /compare-jobs",
            "POST /quick-match",
            "GET  /session-status?session_id=...",
        ],
    })


# ── /health ───────────────────────────────────

@app.route("/health", methods=["GET"])
def health_check():
    if agent is None:
        return jsonify({
            "status": "unhealthy",
            "error":  "Agent not initialised",
            "timestamp": datetime.now().isoformat(),
        }), 500

    model_ok = agent.health_check()
    if not model_ok:
        return jsonify({
            "status": "unhealthy",
            "error":  "Model inference failed",
            "timestamp": datetime.now().isoformat(),
        }), 500

    return jsonify({
        "status":        "healthy",
        "model":         "loaded",
        "active_sessions": len(temp_storage),
        "timestamp":     datetime.now().isoformat(),
    })


# ── /upload-resume ────────────────────────────

@app.route("/upload-resume", methods=["POST"])
@require_agent
def upload_resume():
    """
    Accepts multipart/form-data with field 'resume' (PDF).
    Returns session_id, resume analysis, keyword list, resume score, and warnings.
    """
    if "resume" not in request.files:
        return _err("No 'resume' file field in request.")

    file = request.files["resume"]
    if not file.filename:
        return _err("No file selected.")
    if not _allowed_file(file.filename):
        return _err("Only PDF files are accepted.")

    pdf_bytes = file.read()
    if not pdf_bytes:
        return _err("Uploaded file is empty.")

    session_id = str(uuid.uuid4())
    logger.info("New session %s — processing %s", session_id, file.filename)

    try:
        resume_text = agent.extract_text_from_pdf(pdf_bytes)
    except ValueError as exc:
        return _err(str(exc), 422)
    except Exception as exc:
        logger.exception("PDF extraction failed")
        return _err(f"PDF extraction failed: {exc}", 500)

    try:
        result = agent.analyze_resume(resume_text)
    except Exception as exc:
        logger.exception("Resume analysis failed")
        return _err(f"Resume analysis failed: {exc}", 500)

    temp_storage[session_id] = {
        "resume_text":     resume_text,
        "resume_analysis": result["analysis"],
        "resume_keywords": result["keywords"],
        "resume_score":    result["score"],
        "filename":        file.filename,
        "created_at":      datetime.now(),
        "jobs":            [],
        "ranked_jobs":     [],
        "location":        "",
        "selected_job":    None,
        "last_match":      None,
        "cover_letter":    None,
        "interview_tips":  None,
        "ats_tips":        None,
        "timings":         {"resume_analysis": result["timing"]},
        "warnings":        result["warnings"],
    }

    return jsonify({
        "success":         True,
        "session_id":      session_id,
        "filename":        file.filename,
        "resume_analysis": result["analysis"],
        "resume_keywords": result["keywords"],
        "resume_score":    result["score"],
        "warnings":        result["warnings"],
        "text_length":     len(resume_text),
    })


# ── /search-jobs ──────────────────────────────

@app.route("/search-jobs", methods=["POST"])
@require_agent
@require_json
def search_jobs():
    """
    Body: { "session_id": "...", "query": "python developer" }
    Returns all jobs + ranked_jobs (sorted by keyword overlap) + enriched query.
    """
    data = g.json
    session_id = data.get("session_id", "").strip()
    session = _get_session(session_id)
    if session is None:
        return _err("Invalid or expired session. Please upload your resume first.", 401)

    if not _check_rate(session_id):
        return _err("Rate limit exceeded. Please wait before making more requests.", 429)

    query = (data.get("query") or "").strip()
    if not query:
        return _err("'query' field is required and cannot be empty.")

    keywords = session.get("resume_keywords", [])

    try:
        t0 = time.time()
        all_jobs, ranked_jobs, location = agent.search_jobs(query, keywords=keywords)
        elapsed = round(time.time() - t0, 2)
    except Exception as exc:
        logger.exception("Job search failed")
        return _err(f"Job search failed: {exc}", 500)

    if not all_jobs:
        return _err("No jobs found for that query. Try a broader search term.", 404)

    # Determine enriched query from agent output for transparency
    enriched = agent._enrich_query(query, keywords)

    # Persist
    session["jobs"]       = all_jobs
    session["ranked_jobs"] = ranked_jobs
    session["location"]   = location
    session["search_query"] = query
    session["timings"]["job_search"] = elapsed

    return jsonify({
        "success":        True,
        "session_id":     session_id,
        "query":          query,
        "enriched_query": enriched,
        "location":       location,
        "total_count":    len(all_jobs),
        "jobs":           [_public_job(j) for j in all_jobs],
        "ranked_jobs":    [_public_job(j) for j in ranked_jobs],
    })


# ── /analyze-match ────────────────────────────

@app.route("/analyze-match", methods=["POST"])
@require_agent
@require_json
def analyze_match():
    """
    Body: { "session_id": "...", "job_id": "..." }
    Returns full match analysis including keyword_overlap and pre_score.
    """
    data = g.json
    session_id = data.get("session_id", "").strip()
    job_id     = data.get("job_id", "").strip()

    if not job_id:
        return _err("'job_id' is required.")

    session = _get_session(session_id)
    if session is None:
        return _err("Invalid or expired session.", 401)

    if not _check_rate(session_id):
        return _err("Rate limit exceeded.", 429)

    if not session.get("jobs"):
        return _err("No jobs in session. Please run /search-jobs first.", 422)

    job = next((j for j in session["jobs"] if j["id"] == job_id), None)
    if job is None:
        return _err(f"Job '{job_id}' not found in current session.", 404)

    try:
        t0 = time.time()
        match_result = agent.analyze_job_match(
            session["resume_analysis"],
            job,
            resume_keywords=session.get("resume_keywords", []),
        )
        elapsed = round(time.time() - t0, 2)
    except Exception as exc:
        logger.exception("Job match analysis failed")
        return _err(f"Match analysis failed: {exc}", 500)

    session["selected_job"]  = job
    session["last_match"]    = match_result
    session["timings"]["analyze_match"] = elapsed

    return jsonify({
        "success":         True,
        "session_id":      session_id,
        "job": {
            "id":            job["id"],
            "title":         job["title"],
            "company":       job["company"],
            "location":      job["location"],
            "country":       job["country"],
            "salary_display": _fmt_salary(job),
            "full_description": job.get("full_description", ""),
        },
        "match_score":     match_result.get("match_score", 0.0),
        "pre_score":       match_result.get("pre_score", 0.0),
        "keyword_overlap": match_result.get("keyword_overlap", []),
        "match_analysis":  match_result.get("analysis", ""),
        "elapsed_seconds": elapsed,
    })


# ── /generate-cover-letter ────────────────────

@app.route("/generate-cover-letter", methods=["POST"])
@require_agent
@require_json
def generate_cover_letter():
    """
    Body: { "session_id": "..." }
    Requires /analyze-match to have been called first.
    """
    session_id = g.json.get("session_id", "").strip()
    session = _get_session(session_id)
    if session is None:
        return _err("Invalid or expired session.", 401)

    if not _check_rate(session_id):
        return _err("Rate limit exceeded.", 429)

    if not session.get("last_match") or not session.get("selected_job"):
        return _err("Please run /analyze-match before generating a cover letter.", 422)

    try:
        t0 = time.time()
        letter = agent.generate_cover_letter(
            session["resume_analysis"],
            session["selected_job"],
            session["last_match"]["analysis"],
            keyword_overlap=session["last_match"].get("keyword_overlap", []),
        )
        elapsed = round(time.time() - t0, 2)
    except Exception as exc:
        logger.exception("Cover letter generation failed")
        return _err(f"Cover letter generation failed: {exc}", 500)

    session["cover_letter"] = letter
    session["timings"]["cover_letter"] = elapsed

    return jsonify({
        "success":         True,
        "session_id":      session_id,
        "cover_letter":    letter,
        "job_title":       session["selected_job"]["title"],
        "company":         session["selected_job"]["company"],
        "elapsed_seconds": elapsed,
    })


# ── /generate-interview-tips ──────────────────

@app.route("/generate-interview-tips", methods=["POST"])
@require_agent
@require_json
def generate_interview_tips():
    """
    Body: { "session_id": "..." }
    Requires /analyze-match to have been called first.
    """
    session_id = g.json.get("session_id", "").strip()
    session = _get_session(session_id)
    if session is None:
        return _err("Invalid or expired session.", 401)

    if not _check_rate(session_id):
        return _err("Rate limit exceeded.", 429)

    if not session.get("last_match") or not session.get("selected_job"):
        return _err("Please run /analyze-match before generating interview tips.", 422)

    try:
        t0 = time.time()
        tips = agent.generate_interview_tips(
            session["resume_analysis"],
            session["selected_job"],
            session["last_match"]["analysis"],
            keyword_overlap=session["last_match"].get("keyword_overlap", []),
        )
        elapsed = round(time.time() - t0, 2)
    except Exception as exc:
        logger.exception("Interview tips generation failed")
        return _err(f"Interview tips generation failed: {exc}", 500)

    session["interview_tips"] = tips
    session["timings"]["interview_tips"] = elapsed

    return jsonify({
        "success":         True,
        "session_id":      session_id,
        "interview_tips":  tips,
        "job_title":       session["selected_job"]["title"],
        "company":         session["selected_job"]["company"],
        "elapsed_seconds": elapsed,
    })


# ── /generate-ats-tips (NEW) ──────────────────

@app.route("/generate-ats-tips", methods=["POST"])
@require_agent
@require_json
def generate_ats_tips():
    """
    NEW endpoint.
    Body: { "session_id": "..." }
    Requires /analyze-match (so selected_job is known).
    Returns ATS keyword gap analysis + formatting tips + tailored resume summary.
    """
    session_id = g.json.get("session_id", "").strip()
    session = _get_session(session_id)
    if session is None:
        return _err("Invalid or expired session.", 401)

    if not _check_rate(session_id):
        return _err("Rate limit exceeded.", 429)

    if not session.get("selected_job"):
        return _err("Please run /analyze-match before generating ATS tips.", 422)

    try:
        t0 = time.time()
        tips = agent.generate_ats_tips(
            resume_text=session["resume_text"],
            resume_keywords=session.get("resume_keywords", []),
            job=session["selected_job"],
        )
        elapsed = round(time.time() - t0, 2)
    except Exception as exc:
        logger.exception("ATS tips generation failed")
        return _err(f"ATS tips generation failed: {exc}", 500)

    session["ats_tips"] = tips
    session["timings"]["ats_tips"] = elapsed

    return jsonify({
        "success":         True,
        "session_id":      session_id,
        "ats_tips":        tips,
        "job_title":       session["selected_job"]["title"],
        "company":         session["selected_job"]["company"],
        "elapsed_seconds": elapsed,
    })


# ── /compare-jobs (NEW) ───────────────────────

@app.route("/compare-jobs", methods=["POST"])
@require_agent
@require_json
def compare_jobs():
    """
    NEW endpoint.
    Body: { "session_id": "...", "job_ids": ["id1", "id2", "id3"] }
    Returns a side-by-side keyword-overlap comparison for up to 5 jobs.
    No LLM call — instant keyword heuristic only.
    """
    data = g.json
    session_id = data.get("session_id", "").strip()
    job_ids    = data.get("job_ids", [])

    session = _get_session(session_id)
    if session is None:
        return _err("Invalid or expired session.", 401)

    if not isinstance(job_ids, list) or not job_ids:
        return _err("'job_ids' must be a non-empty list.")
    if len(job_ids) > 5:
        return _err("You can compare up to 5 jobs at a time.")

    if not session.get("jobs"):
        return _err("No jobs in session. Please run /search-jobs first.", 422)

    keywords = session.get("resume_keywords", [])
    kw_set   = set(keywords)

    comparison = []
    for jid in job_ids:
        job = next((j for j in session["jobs"] if j["id"] == jid), None)
        if job is None:
            comparison.append({"job_id": jid, "error": "Not found in session"})
            continue

        desc      = (job.get("description", "") + " " + job.get("full_description", "")).lower()
        overlap   = [kw for kw in kw_set if kw in desc]
        missing   = [kw for kw in kw_set if kw not in desc]
        pct_match = round(len(overlap) / max(len(kw_set), 1) * 100, 1)

        comparison.append({
            "job_id":       jid,
            "title":        job["title"],
            "company":      job["company"],
            "location":     job["location"],
            "salary_display": _fmt_salary(job),
            "keyword_overlap": overlap,
            "keyword_missing": missing,
            "keyword_match_pct": pct_match,
        })

    # Sort by keyword_match_pct descending
    comparison.sort(key=lambda x: x.get("keyword_match_pct", -1), reverse=True)

    return jsonify({
        "success":       True,
        "session_id":    session_id,
        "candidate_keywords": keywords,
        "comparison":    comparison,
    })


# ── /quick-match (NEW) ───────────────────────

@app.route("/quick-match", methods=["POST"])
@require_agent
@require_json
def quick_match():
    """
    NEW endpoint — no LLM call, instant keyword-overlap score.
    Body: { "session_id": "...", "job_id": "..." }
    Useful for showing a lightweight score badge before the full /analyze-match.
    """
    data = g.json
    session_id = data.get("session_id", "").strip()
    job_id     = data.get("job_id", "").strip()

    session = _get_session(session_id)
    if session is None:
        return _err("Invalid or expired session.", 401)

    if not job_id:
        return _err("'job_id' is required.")

    if not session.get("jobs"):
        return _err("No jobs in session.", 422)

    job = next((j for j in session["jobs"] if j["id"] == job_id), None)
    if job is None:
        return _err(f"Job '{job_id}' not found.", 404)

    keywords = session.get("resume_keywords", [])
    kw_set   = set(keywords)
    desc     = (job.get("description", "") + " " + job.get("full_description", "")).lower()
    overlap  = [kw for kw in kw_set if kw in desc]
    pct      = round(len(overlap) / max(len(kw_set), 1) * 100, 1)

    return jsonify({
        "success":           True,
        "session_id":        session_id,
        "job_id":            job_id,
        "quick_match_score": pct,
        "keyword_overlap":   overlap,
        "keyword_missing":   [kw for kw in kw_set if kw not in desc],
        "note":              "This is a fast keyword-only score. Use /analyze-match for a full LLM-powered analysis.",
    })


# ── /session-status ───────────────────────────

@app.route("/session-status", methods=["GET"])
def session_status():
    session_id = request.args.get("session_id", "").strip()
    session = _get_session(session_id)
    if session is None:
        return _err("Invalid or expired session.", 404)

    rate_info = rate_store.get(session_id, {})
    requests_used = rate_info.get("count", 0)

    return jsonify({
        "success":    True,
        "session_id": session_id,
        "status": {
            "created_at":          session["created_at"].isoformat(),
            "filename":            session.get("filename"),
            "resume_score":        session.get("resume_score", 0.0),
            "resume_keywords":     session.get("resume_keywords", []),
            "warnings":            session.get("warnings", []),
            "has_resume":          bool(session.get("resume_analysis")),
            "has_jobs":            bool(session.get("jobs")),
            "job_count":           len(session.get("jobs", [])),
            "has_match_analysis":  bool(session.get("last_match")),
            "match_score":         session.get("last_match", {}).get("match_score") if session.get("last_match") else None,
            "has_cover_letter":    bool(session.get("cover_letter")),
            "has_interview_tips":  bool(session.get("interview_tips")),
            "has_ats_tips":        bool(session.get("ats_tips")),
            "selected_job":        session["selected_job"]["title"] if session.get("selected_job") else None,
            "search_query":        session.get("search_query"),
            "location":            session.get("location"),
            "step_timings":        session.get("timings", {}),
            "requests_this_hour":  requests_used,
            "requests_remaining":  max(0, MAX_REQUESTS_PER_HOUR_PER_SESSION - requests_used),
        },
    })


# ──────────────────────────────────────────────
# Error handlers
# ──────────────────────────────────────────────

@app.errorhandler(413)
def too_large(_e):
    return _err("File too large. Maximum size is 16 MB.", 413)


@app.errorhandler(404)
def not_found(_e):
    return _err("Endpoint not found.", 404)


@app.errorhandler(405)
def method_not_allowed(_e):
    return _err("HTTP method not allowed for this endpoint.", 405)


@app.errorhandler(500)
def internal_error(exc):
    logger.error("Unhandled server error: %s", exc)
    return _err("Internal server error.", 500)


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────

if __name__ == "__main__":
    if agent:
        ok = agent.health_check()
        print("✅ Model inference check passed." if ok else "⚠️  Model inference check failed — verify merged_model path.")
    else:
        print("⚠️  Agent not initialised.")

    print("🚀 Starting Flask Job Matching API v2.0 on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True, threaded=True)
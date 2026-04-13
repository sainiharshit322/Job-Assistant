# 🤖 AI Job Matching Agent

An intelligent, end-to-end job matching system powered by a fine-tuned local LLM (HuggingFace), LangGraph workflows, and live job data from the Adzuna API. Upload your resume and get ranked job listings, match analysis, a tailored cover letter, interview prep, and ATS optimization tips — all in one pipeline.

---

## ✨ Features

- **Resume Analysis** — Extracts skills, scores resume quality (0–100), and generates a structured recruiter-style report
- **Smart Job Search** — Fetches live listings from Adzuna (India + US) and auto-enriches your query with resume keywords
- **Job Ranking** — Sorts listings by keyword overlap with your resume before any LLM call
- **Match Analysis** — Deep candidate-job fit report with skill alignment, gap analysis, salary fit, and a match score
- **Cover Letter Generation** — Role-specific, 350–420 word letter grounded in your actual resume data
- **Interview Prep** — Technical questions, behavioral STAR answers, system design, 7-day prep timeline, and salary negotiation script
- **ATS Optimization** — Keyword gap analysis, formatting fixes, and a tailored resume summary for the target role
- **Quick Match** — Instant keyword-only score badge (no LLM, ~0ms) for UI previews
- **Job Comparison** — Side-by-side keyword overlap comparison for up to 5 jobs at once
- **Session Management** — In-memory sessions with 2-hour TTL and per-session rate limiting (30 req/hr)

---

## 🏗️ Architecture

```
Frontend (React)
      │
      ▼
Flask REST API (app.py)
      │
      ▼
JobMatchingAgent (agent.py)
      │
      ├── Local HuggingFace LLM (merged_model/)
      │       └── 4-bit quantized on CUDA, float32 fallback on CPU
      │
      ├── LangGraph Workflow
      │       resume_analysis → job_search → job_matching
      │           → cover_letter → interview_tips → ats_optimisation
      │
      └── Adzuna API (India + US + 5 other countries)
```

---

## 📁 Project Structure

```
├── agent.py          # Core AI agent — LLM inference, LangGraph nodes, all business logic
├── app.py            # Flask REST API — routes, session management, rate limiting
├── requirements.txt
├── .env              # API credentials
├── model/
│   └── merged_model/ # Fine-tuned HuggingFace model (local)
└── frontend/         # React app (Create React App)
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+ (for the React frontend)
- CUDA GPU recommended (CPU works but is significantly slower)
- Adzuna API credentials ([register free at adzuna.com](https://developer.adzuna.com/))

### 1. Clone & install backend dependencies

```bash
pip install -r requirements.txt
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
ADZUNA_APP_ID=your_app_id_here
ADZUNA_APP_KEY=your_app_key_here
```

### 3. Place your model

Put the fine-tuned HuggingFace model in `../model/merged_model/` (relative to `agent.py`), or update the `model_path` argument in `JobMatchingAgent.__init__`.

### 4. Run the backend

```bash
python app.py
```

The API starts at `http://127.0.0.1:5000`.

### 5. Run the frontend

```bash
cd frontend
npm install
npm start
```

The React app starts at `http://localhost:3000`.

---

## 📡 API Reference

All endpoints return JSON. Error responses have the shape `{ "success": false, "error": "..." }`.

### `GET /health`
Check if the server and model are operational.

**Response:**
```json
{
  "status": "healthy",
  "model": "loaded",
  "active_sessions": 3,
  "timestamp": "2024-01-15T10:30:00"
}
```

---

### `POST /upload-resume`
Upload a PDF resume. Creates a session and runs full resume analysis.

**Request:** `multipart/form-data` with field `resume` (PDF, max 16 MB)

**Response:**
```json
{
  "success": true,
  "session_id": "uuid-here",
  "resume_analysis": "## Personal Information\n...",
  "resume_keywords": ["python", "react", "aws", "docker"],
  "resume_score": 74.5,
  "warnings": ["Resume quality score is low (32/100)..."],
  "text_length": 3420
}
```

---

### `POST /search-jobs`
Search for live jobs. The query is auto-enriched with your resume keywords.

**Request:**
```json
{ "session_id": "...", "query": "python developer" }
```

**Response:**
```json
{
  "success": true,
  "enriched_query": "python developer react aws",
  "location": "India",
  "total_count": 10,
  "jobs": [...],
  "ranked_jobs": [...]
}
```

---

### `POST /analyze-match`
Full LLM-powered candidate-job match analysis.

**Request:**
```json
{ "session_id": "...", "job_id": "in_abc123" }
```

**Response:**
```json
{
  "success": true,
  "match_score": 0.78,
  "pre_score": 0.65,
  "keyword_overlap": ["python", "aws", "docker"],
  "match_analysis": "## Match Score\nSCORE: 78\n..."
}
```

---

### `POST /generate-cover-letter`
Generate a tailored cover letter. Requires `/analyze-match` first.

**Request:**
```json
{ "session_id": "..." }
```

---

### `POST /generate-interview-tips`
Generate a full interview prep guide. Requires `/analyze-match` first.

**Request:**
```json
{ "session_id": "..." }
```

---

### `POST /generate-ats-tips`
ATS keyword gap analysis + formatting recommendations. Requires `/analyze-match` first.

**Request:**
```json
{ "session_id": "..." }
```

---

### `POST /compare-jobs`
Side-by-side keyword overlap comparison (no LLM, instant).

**Request:**
```json
{ "session_id": "...", "job_ids": ["id1", "id2", "id3"] }
```

**Response:**
```json
{
  "comparison": [
    {
      "job_id": "id1",
      "title": "Senior Python Developer",
      "keyword_match_pct": 82.5,
      "keyword_overlap": ["python", "django", "aws"],
      "keyword_missing": ["kubernetes"]
    }
  ]
}
```

---

### `POST /quick-match`
Instant keyword-only score for a single job (no LLM).

**Request:**
```json
{ "session_id": "...", "job_id": "..." }
```

---

### `GET /session-status?session_id=...`
View the full state of a session including what steps have been completed and time taken per step.

---

## 🔄 Typical Workflow

```
1. POST /upload-resume        → get session_id + resume analysis
2. POST /search-jobs          → get ranked job listings
3. POST /quick-match          → preview match % for any job (optional)
4. POST /compare-jobs         → compare shortlisted jobs (optional)
5. POST /analyze-match        → deep match analysis for selected job
6. POST /generate-cover-letter
7. POST /generate-interview-tips
8. POST /generate-ats-tips
9. GET  /session-status       → review timings, scores, completion
```

---

## 🧠 Resume Scoring

The heuristic resume quality score (0–100) is computed as follows:

| Component | Max Points | Criteria |
|-----------|-----------|----------|
| Keyword breadth | 30 | ≥ 15 tech keywords = full marks |
| Length / detail | 30 | ≥ 800 words = full marks |
| Quantified achievements | 20 | ≥ 20 numbers in resume = full marks |
| Education signal | 20 | Degree/university keywords present |

---

## 🌍 Supported Job Markets

| Country | Code | Currency |
|---------|------|----------|
| India | `in` | INR |
| United States | `us` | USD |
| United Kingdom | `gb` | GBP |
| Australia | `au` | AUD |
| Canada | `ca` | CAD |
| Germany | `de` | EUR |
| Singapore | `sg` | SGD |

The agent tries India first, then US. If both fail (e.g. missing API keys), 8 synthetic demo listings are returned so the UI remains functional.

---

## ⚙️ Configuration

| Setting | Location | Default |
|---------|----------|---------|
| Model path | `JobMatchingAgent.__init__` | `../model/merged_model` |
| Session TTL | `app.py` | 2 hours |
| Rate limit | `app.py` | 30 requests / hour / session |
| Max upload size | `app.py` | 16 MB |
| LLM max context | `_invoke()` | 4096 tokens |

---

## 🛡️ Error Handling

- All LLM nodes catch exceptions and surface them in the `error` field without crashing the workflow
- CUDA OOM errors are retried up to 2 times before raising
- Non-fatal issues (low resume score, API fallback) accumulate in the `warnings` list
- Prompt responses are cached in memory (SHA-256 keyed) to avoid redundant inference
- Background thread auto-expires sessions older than `SESSION_TTL_HOURS`

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `transformers` | HuggingFace model loading and inference |
| `torch` | Tensor computation; CUDA support |
| `bitsandbytes` | 4-bit quantization on GPU |
| `langgraph` | Stateful LLM workflow / graph orchestration |
| `pdfplumber` | PDF text extraction |
| `flask` + `flask-cors` | REST API server |
| `requests` | Adzuna API HTTP calls |
| `python-dotenv` | Environment variable loading |

---

## 📝 Notes

- Sessions are stored **in memory only** — they are lost on server restart.
- The model runs locally; no data is sent to any external LLM provider.

---

## 📜 License

MIT

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import uuid
from datetime import datetime, timedelta
import threading
import time
from agent import JobMatchingAgent
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max
ALLOWED_EXTENSIONS = {'pdf'}

try:
    agent = JobMatchingAgent()
    logger.info("JobMatchingAgent initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize JobMatchingAgent: {e}")
    agent = None

temp_storage = {}

def cleanup_temp_storage():
    """Clean up temporary storage every hour"""
    while True:
        try:
            current_time = datetime.now()
            expired_sessions = []
            
            for session_id, data in temp_storage.items():
                if current_time - data['created_at'] > timedelta(hours=2):
                    expired_sessions.append(session_id)
            
            for session_id in expired_sessions:
                del temp_storage[session_id]
                logger.info(f"Cleaned up expired session: {session_id}")
            
            time.sleep(3600) 
        except Exception as e:
            logger.error(f"Error in cleanup thread: {e}")
            time.sleep(60)  

cleanup_thread = threading.Thread(target=cleanup_temp_storage, daemon=True)
cleanup_thread.start()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        if agent is None:
            return jsonify({
                "status": "unhealthy",
                "error": "JobMatchingAgent not initialized",
                "timestamp": datetime.now().isoformat()
            }), 500
        
        from langchain_core.messages import HumanMessage
        test_response = agent.llm.invoke([HumanMessage(content="test")])
        
        return jsonify({
            "status": "healthy",
            "ollama": "connected",
            "temp_sessions": len(temp_storage),
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/upload-resume', methods=['POST'])
def upload_resume():
    """Upload PDF resume, extract text, and analyze"""
    
    if agent is None:
        return jsonify({"error": "Service not available - agent not initialized"}), 503
    
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file provided"}), 400
    
    file = request.files['resume']
    
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF files are allowed"}), 400
    
    try:
        session_id = str(uuid.uuid4())
        
        pdf_content = file.read()
        
        if len(pdf_content) == 0:
            return jsonify({"error": "Empty PDF file"}), 400
        
        logger.info(f"Processing PDF for session {session_id}")
        resume_text = agent.extract_text_from_pdf(pdf_content)
        
        if not resume_text.strip():
            return jsonify({"error": "Could not extract readable text from PDF"}), 400
        
        logger.info(f"Analyzing resume for session {session_id}")
        resume_analysis = agent.analyze_resume(resume_text)
        
        temp_storage[session_id] = {
            "resume_text": resume_text,
            "resume_analysis": resume_analysis,
            "filename": file.filename,
            "created_at": datetime.now(),
            "jobs": None
        }
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "filename": file.filename,
            "resume_analysis": resume_analysis,
            "text_length": len(resume_text),
            "message": "Resume uploaded and analyzed successfully"
        }), 200
    
    except Exception as e:
        logger.error(f"Error processing resume: {str(e)}")
        return jsonify({"error": f"Error processing resume: {str(e)}"}), 500

@app.route('/search-jobs', methods=['POST'])
def search_jobs():
    """Search for jobs and store results in session"""
    
    if agent is None:
        return jsonify({"error": "Service not available"}), 503
    
    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    
    if not data or 'query' not in data:
        return jsonify({"error": "Search query is required"}), 400
    
    session_id = data.get('session_id')
    if not session_id or session_id not in temp_storage:
        return jsonify({"error": "Invalid session. Please upload resume first."}), 400
    
    query = data['query'].strip()
    if not query:
        return jsonify({"error": "Search query cannot be empty"}), 400
    
    try:
        logger.info(f"Searching jobs for query: {query}, session: {session_id}")
        
        jobs, location = agent.search_jobs(query)
        
        if not jobs:
            return jsonify({"error": "No jobs found for the given query"}), 404
        
        temp_storage[session_id]['jobs'] = jobs
        temp_storage[session_id]['search_query'] = query
        temp_storage[session_id]['location'] = location
        
        formatted_jobs = []
        for job in jobs:
            salary_display = "Not specified"
            if job.get('salary_min') and job.get('salary_max'):
                currency = job.get('currency', 'USD')
                if currency == 'INR':
                    salary_display = f"₹{job['salary_min']:,} - ₹{job['salary_max']:,} LPA"
                else:
                    salary_display = f"${job['salary_min']:,} - ${job['salary_max']:,}"
            
            formatted_job = {
                "id": job['id'],
                "title": job['title'],
                "company": job['company'],
                "location": job['location'],
                "country": job['country'],
                "description": job['description'],
                "salary_display": salary_display,
                "contract_type": job['contract_type'],
                "posted_date": job.get('posted_date', 'Recently')
            }
            formatted_jobs.append(formatted_job)
        
        return jsonify({
            "success": True,
            "jobs": formatted_jobs,
            "total_count": len(jobs),
            "search_query": query,
            "location": location,
            "session_id": session_id
        }), 200
    
    except Exception as e:
        logger.error(f"Error searching jobs: {str(e)}")
        return jsonify({"error": f"Error searching jobs: {str(e)}"}), 500

@app.route('/analyze-match', methods=['POST'])
def analyze_match():
    """Analyze job match for selected job"""
    
    if agent is None:
        return jsonify({"error": "Service not available"}), 503
    
    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    
    required_fields = ['session_id', 'job_id']
    if not data or not all(field in data for field in required_fields):
        return jsonify({"error": "session_id and job_id are required"}), 400
    
    session_id = data['session_id']
    job_id = data['job_id']
    
    if session_id not in temp_storage:
        return jsonify({"error": "Invalid session. Please upload resume first."}), 400
    
    session_data = temp_storage[session_id]
    
    if not session_data.get('jobs'):
        return jsonify({"error": "No jobs found in session. Please search jobs first."}), 400
    
    selected_job = None
    for job in session_data['jobs']:
        if job['id'] == job_id:
            selected_job = job
            break
    
    if not selected_job:
        return jsonify({"error": "Job not found in current session"}), 404
    
    try:
        logger.info(f"Analyzing match for job {job_id}, session {session_id}")
        
        match_result = agent.analyze_job_match(
            session_data['resume_analysis'],
            selected_job
        )
        
        temp_storage[session_id]['last_match'] = match_result
        temp_storage[session_id]['selected_job'] = selected_job
        
        salary_display = "Not specified"
        if selected_job.get('salary_min') and selected_job.get('salary_max'):
            currency = selected_job.get('currency', 'USD')
            if currency == 'INR':
                salary_display = f"₹{selected_job['salary_min']:,} - ₹{selected_job['salary_max']:,} LPA"
            else:
                salary_display = f"${selected_job['salary_min']:,} - ${selected_job['salary_max']:,}"
        
        return jsonify({
            "success": True,
            "job": {
                "id": selected_job['id'],
                "title": selected_job['title'],
                "company": selected_job['company'],
                "location": selected_job['location'],
                "country": selected_job['country'],
                "salary_display": salary_display,
                "full_description": selected_job['full_description']
            },
            "match_score": match_result['match_score'],
            "match_analysis": match_result['analysis'],
            "session_id": session_id
        }), 200
    
    except Exception as e:
        logger.error(f"Error analyzing match: {str(e)}")
        return jsonify({"error": f"Error analyzing job match: {str(e)}"}), 500

@app.route('/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    """Generate tailored cover letter"""
    
    if agent is None:
        return jsonify({"error": "Service not available"}), 503
    
    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    
    if not data or 'session_id' not in data:
        return jsonify({"error": "session_id is required"}), 400
    
    session_id = data['session_id']
    
    if session_id not in temp_storage:
        return jsonify({"error": "Invalid session"}), 400
    
    session_data = temp_storage[session_id]
    
    if not session_data.get('last_match') or not session_data.get('selected_job'):
        return jsonify({"error": "Please analyze job match first"}), 400
    
    try:
        logger.info(f"Generating cover letter for session {session_id}")
        
        cover_letter = agent.generate_cover_letter(
            session_data['resume_analysis'],
            session_data['selected_job'],
            session_data['last_match']['analysis']
        )
        
        temp_storage[session_id]['cover_letter'] = cover_letter
        
        return jsonify({
            "success": True,
            "cover_letter": cover_letter,
            "job_title": session_data['selected_job']['title'],
            "company": session_data['selected_job']['company'],
            "session_id": session_id
        }), 200
    
    except Exception as e:
        logger.error(f"Error generating cover letter: {str(e)}")
        return jsonify({"error": f"Error generating cover letter: {str(e)}"}), 500

@app.route('/generate-interview-tips', methods=['POST'])
def generate_interview_tips():
    """Generate interview preparation tips"""
    
    if agent is None:
        return jsonify({"error": "Service not available"}), 503
    
    try:
        data = request.get_json()
    except Exception as e:
        return jsonify({"error": "Invalid JSON in request body"}), 400
    
    if not data or 'session_id' not in data:
        return jsonify({"error": "session_id is required"}), 400
    
    session_id = data['session_id']
    
    if session_id not in temp_storage:
        return jsonify({"error": "Invalid session"}), 400
    
    session_data = temp_storage[session_id]
    
    if not session_data.get('last_match') or not session_data.get('selected_job'):
        return jsonify({"error": "Please analyze job match first"}), 400
    
    try:
        logger.info(f"Generating interview tips for session {session_id}")
        
        interview_tips = agent.generate_interview_tips(
            session_data['resume_analysis'],
            session_data['selected_job'],
            session_data['last_match']['analysis']
        )
        
        temp_storage[session_id]['interview_tips'] = interview_tips
        
        return jsonify({
            "success": True,
            "interview_tips": interview_tips,
            "job_title": session_data['selected_job']['title'],
            "company": session_data['selected_job']['company'],
            "session_id": session_id
        }), 200
    
    except Exception as e:
        logger.error(f"Error generating interview tips: {str(e)}")
        return jsonify({"error": f"Error generating interview tips: {str(e)}"}), 500

@app.route('/session-status', methods=['GET'])
def session_status():
    """Get current session status and available data"""
    
    session_id = request.args.get('session_id')
    
    if not session_id:
        return jsonify({"error": "session_id parameter is required"}), 400
    
    if session_id not in temp_storage:
        return jsonify({"error": "Invalid session"}), 404
    
    session_data = temp_storage[session_id]
    
    status = {
        "session_id": session_id,
        "created_at": session_data['created_at'].isoformat(),
        "filename": session_data.get('filename'),
        "has_resume": bool(session_data.get('resume_analysis')),
        "has_jobs": bool(session_data.get('jobs')),
        "has_match_analysis": bool(session_data.get('last_match')),
        "has_cover_letter": bool(session_data.get('cover_letter')),
        "has_interview_tips": bool(session_data.get('interview_tips')),
        "search_query": session_data.get('search_query'),
        "location": session_data.get('location'),
        "selected_job": session_data.get('selected_job', {}).get('title') if session_data.get('selected_job') else None
    }
    
    return jsonify({
        "success": True,
        "status": status
    }), 200

@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File too large. Maximum size is 16MB"}), 413

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal server error: {e}")
    return jsonify({"error": "Internal server error"}), 500

@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "message": "Job Matching API is running",
        "version": "1.0.0",
        "status": "active",
        "endpoints": [
            "/health",
            "/upload-resume", 
            "/search-jobs",
            "/analyze-match",
            "/generate-cover-letter",
            "/generate-interview-tips",
            "/session-status"
        ]
    }), 200

if __name__ == '__main__':
    try:
        from langchain_core.messages import HumanMessage
        if agent and agent.llm:
            agent.llm.invoke([HumanMessage(content="test")])
            print("✅ Ollama connection successful")
        else:
            print("⚠️  Agent not initialized, but Flask will start anyway")
    except Exception as e:
        print(f"❌ Ollama connection failed: {e}")
        print("Please ensure: ollama serve && ollama pull llama3.2")
        print("Flask will start but functionality will be limited")
    
    print("🚀 Starting Flask Job Matching API...")
    print("📝 Temporary storage cleanup runs every hour")
    print("🔗 API endpoints available at http://localhost:5000")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True  
    )
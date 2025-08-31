import os
from typing import Dict, Any, List, Optional, Tuple
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langchain_ollama import ChatOllama
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict
import requests
import pdfplumber
from io import BytesIO
import uuid
import re
from dotenv import load_dotenv

load_dotenv()

class JobMatchingState(TypedDict):
    """State for LangGraph workflow"""
    session_id: str
    resume_text: str
    resume_analysis: str
    search_query: str
    jobs: List[Dict]
    location: str
    selected_job: Dict
    selected_job_id: str
    match_result: Dict[str, Any]
    cover_letter: str
    interview_tips: str
    current_step: str
    error: str

class JobMatchingAgent:
    """Job matching agent with LangGraph workflow and PDF processing"""
    
    def __init__(self):
        self.llm = ChatOllama(model="llama3.2", base_url="http://localhost:11434")
        self.app_id = os.getenv("ADZUNA_APP_ID")
        self.app_key = os.getenv("ADZUNA_APP_KEY")
        self.workflow = self._create_workflow()
    
    def extract_text_from_pdf(self, pdf_file_bytes: bytes) -> str:
        """Extract text from PDF using pdfplumber"""
        try:
            text = ""
            with pdfplumber.open(BytesIO(pdf_file_bytes)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
            
            if not text.strip():
                raise Exception("No text found in PDF")
            
            return text.strip()
            
        except Exception as e:
            raise Exception(f"Failed to extract text from PDF: {str(e)}")
    
    def _create_workflow(self) -> StateGraph:
        """Create LangGraph workflow for job matching process"""
        
        workflow = StateGraph(JobMatchingState)
        
        # Add nodes
        workflow.add_node("resume_analysis", self._resume_analysis_node)
        workflow.add_node("job_search", self._job_search_node)
        workflow.add_node("job_matching", self._job_matching_node)
        workflow.add_node("cover_letter_generation", self._cover_letter_node)
        workflow.add_node("interview_tips_generation", self._interview_tips_node)
        
        # Define edges
        workflow.add_edge(START, "resume_analysis")
        workflow.add_edge("resume_analysis", "job_search")
        workflow.add_edge("job_search", "job_matching")
        workflow.add_edge("job_matching", "cover_letter_generation")
        workflow.add_edge("cover_letter_generation", "interview_tips_generation")
        workflow.add_edge("interview_tips_generation", END)
        
        return workflow.compile()
    
    def _resume_analysis_node(self, state: JobMatchingState) -> JobMatchingState:
        """LangGraph node: Analyze resume"""
        
        if not state.get("resume_text"):
            return {
                **state,
                "current_step": "resume_analysis",
                "error": "No resume text provided"
            }
        
        prompt = f"""
        Analyze this resume comprehensively:
        
        Resume Content:
        {state['resume_text']}
        
        Please extract and organize the following information:
        
        1. **PERSONAL INFORMATION**
           - Name and contact details
           - Location preference
        
        2. **TECHNICAL SKILLS**
           - Programming languages
           - Frameworks and libraries  
           - Databases and tools
           - Cloud platforms
           - Development methodologies
        
        3. **EXPERIENCE ANALYSIS**
           - Total years of experience
           - Seniority level (Junior/Mid/Senior/Lead)
           - Domain expertise
           - Key achievements with metrics
        
        4. **EDUCATION & CERTIFICATIONS**
           - Educational background
           - Professional certifications
           - Relevant courses
        
        5. **STRENGTHS & HIGHLIGHTS**
           - Top 5 strongest skills
           - Notable projects or achievements
           - Leadership experience
           - Open source contributions
        
        6. **IMPROVEMENT AREAS**
           - Skills that need development
           - Experience gaps
           - Certifications to pursue
        
        7. **MARKET POSITIONING**
           - Suitable for India market? (Yes/No and why)
           - Suitable for US market? (Yes/No and why)
           - Recommended salary range (both INR and USD)
        
        Format the response with clear headings and bullet points for easy readability.
        """
        
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return {
                **state,
                "resume_analysis": response.content,
                "current_step": "resume_analysis",
                "error": ""
            }
        except Exception as e:
            return {
                **state,
                "current_step": "resume_analysis",
                "error": f"Error analyzing resume: {str(e)}"
            }
    
    def _job_search_node(self, state: JobMatchingState) -> JobMatchingState:
        """LangGraph node: Search for jobs"""
        
        query = state.get("search_query", "developer")
        
        try:
            # Try India first
            indian_jobs = self._get_indian_jobs(query)
            if indian_jobs:
                return {
                    **state,
                    "jobs": indian_jobs,
                    "location": "India",
                    "current_step": "job_search",
                    "error": ""
                }
            
            # Fallback to US
            us_jobs = self._get_us_jobs(query)
            if us_jobs:
                return {
                    **state,
                    "jobs": us_jobs,
                    "location": "US",
                    "current_step": "job_search",
                    "error": ""
                }
            
            # Demo data
            demo_jobs = self._get_indian_jobs(query)
            return {
                **state,
                "jobs": demo_jobs,
                "location": "India",
                "current_step": "job_search",
                "error": ""
            }
            
        except Exception as e:
            return {
                **state,
                "current_step": "job_search",
                "error": f"Error searching jobs: {str(e)}"
            }
    
    def _job_matching_node(self, state: JobMatchingState) -> JobMatchingState:
        """LangGraph node: Analyze job match"""
        
        if not state.get("selected_job"):
            return {
                **state,
                "current_step": "job_matching",
                "error": "No job selected for matching"
            }
        
        job = state["selected_job"]
        resume_analysis = state.get("resume_analysis", "")
        
        # Format salary display
        salary_info = "Not specified"
        if job.get("salary_min") and job.get("salary_max"):
            currency = job.get("currency", "USD")
            if currency == "INR":
                salary_info = f"₹{job['salary_min']:,} - ₹{job['salary_max']:,} per annum"
            else:
                salary_info = f"${job['salary_min']:,} - ${job['salary_max']:,} per annum"
        
        prompt = f"""
        Perform a detailed job matching analysis:
        
        **RESUME ANALYSIS:**
        {resume_analysis}
        
        **JOB DETAILS:**
        • Position: {job.get('title')}
        • Company: {job.get('company')}
        • Location: {job.get('location')} ({job.get('country')})
        • Salary Range: {salary_info}
        • Job Description:
        {job.get('full_description')}
        
        Please provide a comprehensive analysis with:
        
        1. **OVERALL MATCH SCORE**
           - Give a percentage match (0-100%)
           - Explain the reasoning behind the score
        
        2. **SKILL ALIGNMENT**
           - ✅ Skills that perfectly match job requirements
           - ⚠️ Skills that partially match or need improvement  
           - ❌ Critical skills that are completely missing
        
        3. **EXPERIENCE MATCH**
           - How candidate's experience level fits the role
           - Relevant projects and achievements
           - Industry experience alignment
        
        4. **LOCATION & MARKET FIT**
           - Suitability for the job's location and market
           - Visa/work authorization considerations (if applicable)
           - Cultural and work style fit
        
        5. **SALARY EXPECTATIONS**
           - Is the offered salary range appropriate?
           - Negotiation potential based on candidate's profile
        
        6. **GAP ANALYSIS**
           - Most critical missing skills/experience
           - Impact of each gap (High/Medium/Low)
           - Time required to bridge gaps
        
        7. **COMPETITIVE POSITIONING**
           - Candidate's strengths vs typical applicants
           - Unique value proposition
           - Areas where candidate might struggle
        
        8. **IMPROVEMENT RECOMMENDATIONS**
           - Top 3 priority skills to develop
           - Specific courses, certifications, or projects
           - Timeline for improvement (1-3 months, 3-6 months, 6+ months)
        
        9. **APPLICATION STRATEGY**
           - Key points to highlight in application
           - How to address weaknesses positively
           - Best approach for this specific role
        
        Be specific, honest, and actionable in your analysis.
        """
        
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            
            # Extract match score using regex
            match_patterns = [
                r'(\d+)%',
                r'match.*?(\d+)%',
                r'score.*?(\d+)%',
                r'percentage.*?(\d+)'
            ]
            
            match_score = 0.0
            for pattern in match_patterns:
                score_match = re.search(pattern, response.content, re.IGNORECASE)
                if score_match:
                    match_score = float(score_match.group(1)) / 100.0
                    break
            
            match_result = {
                "match_score": match_score,
                "analysis": response.content,
                "job_title": job.get('title'),
                "company": job.get('company'),
                "location": job.get('location'),
                "country": job.get('country')
            }
            
            return {
                **state,
                "match_result": match_result,
                "current_step": "job_matching",
                "error": ""
            }
            
        except Exception as e:
            return {
                **state,
                "current_step": "job_matching",
                "error": f"Error analyzing job match: {str(e)}"
            }
    
    def _cover_letter_node(self, state: JobMatchingState) -> JobMatchingState:
        """LangGraph node: Generate cover letter"""
        
        job = state.get("selected_job", {})
        resume_analysis = state.get("resume_analysis", "")
        match_analysis = state.get("match_result", {}).get("analysis", "")
        
        prompt = f"""
        Generate a professional, compelling cover letter:
        
        **JOB INFORMATION:**
        • Position: {job.get('title')}
        • Company: {job.get('company')}
        • Location: {job.get('location')}
        
        **CANDIDATE PROFILE:**
        {resume_analysis}
        
        **MATCH ANALYSIS:**
        {match_analysis}
        
        Create a cover letter that:
        
        1. **STRUCTURE:**
           - Professional header with date
           - Proper addressing (Dear Hiring Manager or specific name if known)
           - 3-4 paragraph body
           - Professional closing
        
        2. **CONTENT REQUIREMENTS:**
           - Opening: Strong hook showing enthusiasm and knowledge of company
           - Body: Highlight most relevant experience and achievements with specific examples
           - Address key job requirements directly
           - Show understanding of company's industry and challenges
           - Address any skill gaps positively (eagerness to learn, transferable skills)
           - Quantify achievements where possible
        
        3. **TONE & STYLE:**
           - Professional but personable
           - Confident without being arrogant  
           - Specific to this role (no generic language)
           - Show genuine interest in the company
           - 350-450 words total
        
        4. **CALL TO ACTION:**
           - Express interest in discussing the role further
           - Professional sign-off
        
        Make it compelling and ready to send as-is.
        """
        
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return {
                **state,
                "cover_letter": response.content,
                "current_step": "cover_letter_generation",
                "error": ""
            }
        except Exception as e:
            return {
                **state,
                "current_step": "cover_letter_generation",
                "error": f"Error generating cover letter: {str(e)}"
            }
    
    def _interview_tips_node(self, state: JobMatchingState) -> JobMatchingState:
        """LangGraph node: Generate interview tips"""
        
        job = state.get("selected_job", {})
        resume_analysis = state.get("resume_analysis", "")
        match_analysis = state.get("match_result", {}).get("analysis", "")
        
        prompt = f"""
        Generate a comprehensive interview preparation guide:
        
        **JOB INFORMATION:**
        • Position: {job.get('title')}  
        • Company: {job.get('company')}
        • Location: {job.get('location')} ({job.get('country')})
        
        **CANDIDATE PROFILE:**
        {resume_analysis}
        
        **MATCH ANALYSIS:**
        {match_analysis}
        
        Create a detailed interview preparation guide with:
        
        1. **TECHNICAL QUESTIONS TO EXPECT**
           - 5-7 specific technical questions likely for this role
           - Sample approach/answers for each
           - Coding challenges to practice
           - System design questions (if applicable)
        
        2. **BEHAVIORAL QUESTIONS**
           - 5-6 behavioral questions common for this role level
           - STAR method examples using candidate's actual experience
           - Leadership and teamwork scenarios
        
        3. **COMPANY-SPECIFIC PREPARATION**
           - Key things to research about {job.get('company')}
           - Industry trends and challenges to discuss
           - Company culture and values alignment
           - Recent company news or developments
        
        4. **QUESTIONS TO ASK INTERVIEWER**
           - 6-8 thoughtful questions showing genuine interest
           - Technical questions about stack/architecture
           - Culture and growth questions
           - Role-specific questions
        
        5. **SHOWCASING YOUR EXPERIENCE**
           - Top 3 projects/achievements to highlight
           - How to present each with impact metrics
           - Handling questions about experience gaps
        
        6. **HANDLING WEAKNESSES/GAPS**
           - How to address missing skills positively
           - Learning commitment statements
           - Transferable skills to emphasize
           - Practice answers for weak areas
        
        7. **SALARY NEGOTIATION STRATEGY**
           - Research on market rates for this role
           - How to handle salary questions
           - Negotiation talking points based on candidate's profile
        
        8. **PRACTICAL INTERVIEW TIPS**
           - What to bring/prepare
           - Dress code for {job.get('country')} market
           - Video interview best practices
           - Follow-up strategy
        
        9. **MOCK INTERVIEW SCENARIOS**
           - 3-4 complete question-answer scenarios
           - Practice timeline (1-2 weeks before interview)
        
        Make it specific, actionable, and tailored to this exact role and candidate profile.
        """
        
        try:
            response = self.llm.invoke([HumanMessage(content=prompt)])
            return {
                **state,
                "interview_tips": response.content,
                "current_step": "interview_tips_generation",
                "error": ""
            }
        except Exception as e:
            return {
                **state,
                "current_step": "interview_tips_generation",
                "error": f"Error generating interview tips: {str(e)}"
            }
    
    # Helper methods for job searching (same as before)
    def _get_indian_jobs(self, query: str) -> List[Dict]:
        """Get Indian jobs (sample data)"""
        
        indian_companies = [
            "Tata Consultancy Services", "Infosys Limited", "Wipro Technologies", 
            "HCL Technologies", "Tech Mahindra", "Accenture India", "IBM India",
            "Microsoft India", "Google India", "Amazon India", "Flipkart", 
            "Paytm", "Swiggy", "Zomato", "Ola"
        ]
        
        indian_cities = [
            "Bangalore, Karnataka", "Hyderabad, Telangana", "Pune, Maharashtra",
            "Chennai, Tamil Nadu", "Mumbai, Maharashtra", "Gurgaon, Haryana",
            "Noida, Uttar Pradesh", "Kolkata, West Bengal", "Ahmedabad, Gujarat",
            "Kochi, Kerala"
        ]
        
        job_titles = [
            f"Senior {query}", f"Lead {query}", f"Principal {query}",
            f"{query} - Team Lead", f"Full Stack {query}", f"Backend {query}",
            f"Frontend {query}", f"{query} - II", f"{query} - III", f"Staff {query}"
        ]
        
        jobs = []
        for i in range(10):
            base_salary = 800000 + (i * 150000)
            job = {
                "id": f"in_{uuid.uuid4().hex[:8]}",
                "title": job_titles[i % len(job_titles)],
                "company": indian_companies[i % len(indian_companies)],
                "location": indian_cities[i % len(indian_cities)],
                "description": f"Join {indian_companies[i % len(indian_companies)]} as a {query}. Work on innovative projects with cutting-edge technology stack.",
                "full_description": f"""We are seeking a talented {query} to join our dynamic team at {indian_companies[i % len(indian_companies)]}.

Key Responsibilities:
• Design and develop scalable web applications
• Collaborate with cross-functional teams
• Write clean, maintainable code
• Participate in code reviews and agile processes
• Work with modern tech stack: React.js, Node.js, Python, AWS/Azure

Requirements:
• 3+ years of experience in software development
• Strong knowledge of JavaScript, Python, or Java
• Experience with databases (MySQL, MongoDB)
• Knowledge of RESTful APIs and microservices
• Understanding of DevOps practices

What We Offer:
• Competitive salary and benefits
• Flexible work arrangements
• Learning and development opportunities
• Health insurance and wellness programs""",
                "salary_min": base_salary,
                "salary_max": base_salary + 400000,
                "currency": "INR",
                "contract_type": "full_time",
                "country": "India",
                "posted_date": "2025-08-30",
                "apply_url": f"https://careers.{indian_companies[i % len(indian_companies)].lower().replace(' ', '')}.com/job-{i+1}"
            }
            jobs.append(job)
        
        return jobs
    
    def _get_us_jobs(self, query: str) -> List[Dict]:
        """Get US jobs from Adzuna API"""
        
        if not self.app_id or not self.app_key:
            return []
        
        try:
            url = "https://api.adzuna.com/v1/api/jobs/us/search/1"
            params = {
                "app_id": self.app_id,
                "app_key": self.app_key,
                "what": query,
                "results_per_page": 10,
                "sort_by": "relevance"
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                raw_jobs = data.get("results", [])
                
                formatted_jobs = []
                for i, job in enumerate(raw_jobs):
                    formatted_job = {
                        "id": f"us_{job.get('id', uuid.uuid4().hex[:8])}",
                        "title": job.get("title", "Software Developer"),
                        "company": job.get("company", {}).get("display_name", "Tech Company"),
                        "location": job.get("location", {}).get("display_name", "United States"),
                        "description": (job.get("description", "")[:400] + "..." if len(job.get("description", "")) > 400 else job.get("description", "")),
                        "full_description": job.get("description", ""),
                        "salary_min": job.get("salary_min"),
                        "salary_max": job.get("salary_max"),
                        "currency": "USD",
                        "contract_type": job.get("contract_type", "full_time"),
                        "country": "US",
                        "posted_date": job.get("created", "2025-08-30"),
                        "apply_url": job.get("redirect_url", "")
                    }
                    formatted_jobs.append(formatted_job)
                
                return formatted_jobs
                
        except Exception as e:
            print(f"Error fetching US jobs: {e}")
            return []
    
    # Public API methods that use the LangGraph workflow
    def process_resume_and_search(self, resume_text: str, search_query: str) -> JobMatchingState:
        """Process resume and search jobs using LangGraph workflow"""
        
        initial_state: JobMatchingState = {
            "session_id": str(uuid.uuid4()),
            "resume_text": resume_text,
            "resume_analysis": "",
            "search_query": search_query,
            "jobs": [],
            "location": "",
            "selected_job": {},
            "selected_job_id": "",
            "match_result": {},
            "cover_letter": "",
            "interview_tips": "",
            "current_step": "",
            "error": ""
        }
        
        # Run partial workflow (resume analysis + job search)
        final_state = self.workflow.invoke(initial_state, {"recursion_limit": 2})
        return final_state
    
    def complete_job_analysis(self, state: JobMatchingState, selected_job_id: str) -> JobMatchingState:
        """Complete the job analysis workflow for selected job"""
        
        # Find selected job
        selected_job = None
        for job in state.get("jobs", []):
            if job["id"] == selected_job_id:
                selected_job = job
                break
        
        if not selected_job:
            return {
                **state,
                "error": "Selected job not found"
            }
        
        # Update state with selected job
        updated_state: JobMatchingState = {
            **state,
            "selected_job": selected_job,
            "selected_job_id": selected_job_id
        }
        
        # Run complete workflow
        final_state = self.workflow.invoke(updated_state)
        return final_state
    
    # Individual method access for API endpoints
    def analyze_resume(self, resume_text: str) -> str:
        """Standalone resume analysis"""
        state: JobMatchingState = {
            "session_id": "",
            "resume_text": resume_text,
            "resume_analysis": "",
            "search_query": "",
            "jobs": [],
            "location": "",
            "selected_job": {},
            "selected_job_id": "",
            "match_result": {},
            "cover_letter": "",
            "interview_tips": "",
            "current_step": "",
            "error": ""
        }
        
        result_state = self._resume_analysis_node(state)
        return result_state.get("resume_analysis", "Error in analysis")
    
    def search_jobs(self, query: str) -> Tuple[List[Dict], str]:
        """Standalone job search"""
        state: JobMatchingState = {
            "session_id": "",
            "resume_text": "",
            "resume_analysis": "",
            "search_query": query,
            "jobs": [],
            "location": "",
            "selected_job": {},
            "selected_job_id": "",
            "match_result": {},
            "cover_letter": "",
            "interview_tips": "",
            "current_step": "",
            "error": ""
        }
        
        result_state = self._job_search_node(state)
        return result_state.get("jobs", []), result_state.get("location", "Unknown")
    
    def analyze_job_match(self, resume_analysis: str, job: Dict) -> Dict[str, Any]:
        """Standalone job matching"""
        state: JobMatchingState = {
            "session_id": "",
            "resume_text": "",
            "resume_analysis": resume_analysis,
            "search_query": "",
            "jobs": [],
            "location": "",
            "selected_job": job,
            "selected_job_id": job.get("id", ""),
            "match_result": {},
            "cover_letter": "",
            "interview_tips": "",
            "current_step": "",
            "error": ""
        }
        
        result_state = self._job_matching_node(state)
        return result_state.get("match_result", {})
    
    def generate_cover_letter(self, resume_analysis: str, job: Dict, match_analysis: str) -> str:
        """Standalone cover letter generation"""
        state: JobMatchingState = {
            "session_id": "",
            "resume_text": "",
            "resume_analysis": resume_analysis,
            "search_query": "",
            "jobs": [],
            "location": "",
            "selected_job": job,
            "selected_job_id": job.get("id", ""),
            "match_result": {"analysis": match_analysis},
            "cover_letter": "",
            "interview_tips": "",
            "current_step": "",
            "error": ""
        }
        
        result_state = self._cover_letter_node(state)
        return result_state.get("cover_letter", "Error generating cover letter")
    
    def generate_interview_tips(self, resume_analysis: str, job: Dict, match_analysis: str) -> str:
        """Standalone interview tips generation"""
        state: JobMatchingState = {
            "session_id": "",
            "resume_text": "",
            "resume_analysis": resume_analysis,
            "search_query": "",
            "jobs": [],
            "location": "",
            "selected_job": job,
            "selected_job_id": job.get("id", ""),
            "match_result": {"analysis": match_analysis},
            "cover_letter": "",
            "interview_tips": "",
            "current_step": "",
            "error": ""
        }
        
        result_state = self._interview_tips_node(state)
        return result_state.get("interview_tips", "Error generating interview tips")
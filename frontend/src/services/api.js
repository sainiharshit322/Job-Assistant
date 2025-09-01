import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const jobAssistantAPI = {
  // Health check
  healthCheck: () => api.get('/health'),

  // Upload resume and get analysis
  uploadResume: (file) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    return api.post('/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log('Upload progress:', percentCompleted + '%');
      },
    });
  },

  // Search jobs
  searchJobs: (sessionId, query) => 
    api.post('/search-jobs', { 
      session_id: sessionId, 
      query 
    }),

  // Analyze job match
  analyzeMatch: (sessionId, jobId) => 
    api.post('/analyze-match', { 
      session_id: sessionId, 
      job_id: jobId 
    }),

  // Generate cover letter
  generateCoverLetter: (sessionId) => 
    api.post('/generate-cover-letter', { 
      session_id: sessionId 
    }),

  // Generate interview tips
  generateInterviewTips: (sessionId) => 
    api.post('/generate-interview-tips', { 
      session_id: sessionId 
    }),

  // Get session status
  getSessionStatus: (sessionId) => 
    api.get('/session-status', { 
      params: { session_id: sessionId } 
    }),
};

export default api;

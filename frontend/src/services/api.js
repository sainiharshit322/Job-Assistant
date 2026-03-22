import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000';

// ─── STANDARD INSTANCE ───────────────────────────────────────────

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── UPLOAD INSTANCE ─────────────────────────────────────────────

const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes
  headers: { 'Content-Type': 'application/json' },
});

// ─── REQUEST INTERCEPTORS ────────────────────────────────────────
const requestLogger = (config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
};
api.interceptors.request.use(requestLogger, (e) => Promise.reject(e));
uploadApi.interceptors.request.use(requestLogger, (e) => Promise.reject(e));

// ─── RESPONSE INTERCEPTORS ───────────────────────────────────────
const responseError = (error) => {
  if (error.code === 'ECONNABORTED') {
    const isUpload = error.config?.url?.includes('upload');
    error.userMessage = isUpload
      ? 'Resume analysis is taking longer than expected. Please try again — it usually finishes within 2 minutes.'
      : 'Request timed out. Please check your connection and try again.';
  } else {
    error.userMessage = error.response?.data?.error || error.message || 'Something went wrong.';
  }
  console.error('[API Error]', error.userMessage);
  return Promise.reject(error);
};

api.interceptors.response.use((r) => r, responseError);
uploadApi.interceptors.response.use((r) => r, responseError);

// ─── API METHODS ─────────────────────────────────────────────────
export const jobAssistantAPI = {

  // Health check
  healthCheck: () =>
    api.get('/health'),

  uploadResume: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('resume', file);
    return uploadApi.post('/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
        console.log('[Upload] File transfer:', pct + '%');
        onUploadProgress?.(pct);
      },
    });
  },

  searchJobs: (sessionId, query) =>
    api.post('/search-jobs', { session_id: sessionId, query }, { timeout: 300000 }),

  analyzeMatch: (sessionId, jobId) =>
    api.post('/analyze-match', { session_id: sessionId, job_id: jobId }),

  generateCoverLetter: (sessionId) =>
    api.post('/generate-cover-letter', { session_id: sessionId }, { timeout: 300000 }),

  generateInterviewTips: (sessionId) =>
    api.post('/generate-interview-tips', { session_id: sessionId }, { timeout: 300000 }),

  getSessionStatus: (sessionId) =>
    api.get('/session-status', { params: { session_id: sessionId } }),
};

export default api;
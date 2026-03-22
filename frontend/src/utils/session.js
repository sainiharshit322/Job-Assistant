export const SESSION_KEYS = [
  'sessionId',
  'resumeAnalysis',
  'resumeFilename',
  'savedJobs',
  'autoSearch',
  'defaultSearchQuery',
];

/** Wipe every session key from localStorage */
export const clearSession = () => {
  SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
};

/** True if a resume session exists */
export const hasSession = () => !!localStorage.getItem('sessionId');

/** Read the current session as an object (null if none) */
export const getSession = () => {
  const sessionId = localStorage.getItem('sessionId');
  if (!sessionId) return null;
  return {
    sessionId,
    analysis: localStorage.getItem('resumeAnalysis'),
    filename: localStorage.getItem('resumeFilename'),
  };
};

/** Persist a completed analysis */
export const saveSession = ({ sessionId, analysis, filename }) => {
  localStorage.setItem('sessionId',      sessionId);
  localStorage.setItem('resumeAnalysis', analysis);
  localStorage.setItem('resumeFilename', filename);
};
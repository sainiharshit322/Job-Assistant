import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, SlidersHorizontal, Briefcase,
  Brain, AlertCircle, RefreshCw, ArrowRight, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../components/JobCard';
import JobFilters from '../components/JobFilters';
import JobDetails from '../components/JobDetails';
import { jobAssistantAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  .jp-root { font-family: 'DM Sans', sans-serif; color: #f5f5f5; }
  .jp-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .03em; }

  .jp-input {
    width: 100%; padding: 12px 16px 12px 44px;
    background: #ffffff08; border: 1px solid #ffffff14;
    border-radius: 12px; color: #f5f5f5; font-family: 'DM Sans', sans-serif;
    font-size: 14px; outline: none; transition: border-color .2s;
  }
  .jp-input::placeholder { color: #555566; }
  .jp-input:focus { border-color: #c6ff0050; }

  .jp-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; border-radius: 12px; font-size: 14px;
    font-weight: 600; cursor: pointer; border: none; transition: box-shadow .15s, transform .1s;
    font-family: 'DM Sans', sans-serif; white-space: nowrap;
  }
  .jp-btn-lime  { background: #c6ff00; color: #0a0a0f; }
  .jp-btn-lime:hover:not(:disabled) { box-shadow: 0 0 24px #c6ff0055; transform: translateY(-1px); }
  .jp-btn-lime:disabled { opacity: .5; cursor: not-allowed; }
  .jp-btn-ghost { background: #ffffff0a; color: #f5f5f5; border: 1px solid #ffffff14; }
  .jp-btn-ghost:hover { background: #ffffff12; }

  .jp-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 999px; font-size: 12px;
    font-weight: 500; letter-spacing: .06em; text-transform: uppercase;
  }
  .jp-pill-green { background: #22c55e18; color: #22c55e; border: 1px solid #22c55e30; }
  .jp-pill-lime  { background: #c6ff0018; color: #c6ff00; border: 1px solid #c6ff0030; }

  .jp-card {
    background: #ffffff06; border: 1px solid #ffffff10;
    border-radius: 18px; backdrop-filter: blur(24px);
  }

  .jp-skeleton {
    background: linear-gradient(90deg, #ffffff06 25%, #ffffff0e 50%, #ffffff06 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 10px;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  .spin { animation: spin .9s linear infinite; }
`;

const JobsPage = () => {
  const navigate = useNavigate();
  const [jobs,          setJobs]          = useState([]);
  const [filteredJobs,  setFilteredJobs]  = useState([]);
  const [selectedJob,   setSelectedJob]   = useState(null);
  const [showFilters,   setShowFilters]   = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [locationVal,   setLocationVal]   = useState('');
  const [sessionId]                       = useState(localStorage.getItem('sessionId'));
  const [matchAnalysis, setMatchAnalysis] = useState({});
  const [savedJobs,     setSavedJobs]     = useState(new Set());
  const [filters,       setFilters]       = useState({
    jobType: '', experienceLevel: '', salaryMin: '', salaryMax: '', remote: false, sortBy: 'relevance',
  });

  /* ── load saved jobs ── */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    setSavedJobs(new Set(saved));
  }, []);

  /* ── auto-search from homepage ── */
  useEffect(() => {
    const should = localStorage.getItem('autoSearch');
    const query  = localStorage.getItem('defaultSearchQuery');
    if (should === 'true' && sessionId && query) {
      setSearchQuery(query);
      localStorage.removeItem('autoSearch');
      localStorage.removeItem('defaultSearchQuery');
      runSearch(query);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  /* ── filter side-effect ── */
  useEffect(() => { applyFilters(); }, [filters, jobs]);

  /* ── search ── */
  const runSearch = async (q = searchQuery) => {
    if (!sessionId) { toast.error('Please upload your resume first'); return; }
    if (!q.trim())  { toast.error('Please enter a search query');     return; }
    setIsLoading(true);
    try {
      const res = await jobAssistantAPI.searchJobs(sessionId, q);
      if (res.data.success) {
        setJobs(res.data.jobs);
        setFilteredJobs(res.data.jobs);
        setLocationVal(res.data.location || '');
        toast.success(`Found ${res.data.jobs.length} jobs matching your profile!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to search jobs');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── job select + match analysis ── */
  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    if (sessionId && !matchAnalysis[job.id]) {
      try {
        const res = await jobAssistantAPI.analyzeMatch(sessionId, job.id);
        if (res.data.success) {
          setMatchAnalysis(prev => ({
            ...prev,
            [job.id]: { score: res.data.match_score, analysis: res.data.match_analysis },
          }));
        }
      } catch { /* silent */ }
    }
  };

  /* ── save toggle ── */
  const handleSaveJob = (jobId) => {
    const next = new Set(savedJobs);
    if (next.has(jobId)) { next.delete(jobId); toast.success('Removed from saved'); }
    else                 { next.add(jobId);    toast.success('Job saved!'); }
    setSavedJobs(next);
    localStorage.setItem('savedJobs', JSON.stringify([...next]));
  };

  /* ── filters ── */
  const applyFilters = () => {
    let f = [...jobs];
    if (filters.jobType)  f = f.filter(j => j.contract_type?.toLowerCase().includes(filters.jobType.toLowerCase()));
    if (filters.salaryMin) f = f.filter(j => !j.salary_min || j.salary_min >= parseInt(filters.salaryMin));
    if (filters.salaryMax) f = f.filter(j => !j.salary_max || j.salary_max <= parseInt(filters.salaryMax));
    if (filters.remote)    f = f.filter(j => j.location?.toLowerCase().includes('remote') || j.contract_type?.toLowerCase().includes('remote'));
    if (filters.sortBy === 'salary_high') f.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
    if (filters.sortBy === 'salary_low')  f.sort((a, b) => (a.salary_min || 0) - (b.salary_min || 0));
    if (filters.sortBy === 'date')        f.sort((a, b) => new Date(b.posted_date) - new Date(a.posted_date));
    setFilteredJobs(f);
  };

  const resetFilters = () => setFilters({ jobType: '', experienceLevel: '', salaryMin: '', salaryMax: '', remote: false, sortBy: 'relevance' });

  return (
    <>
      <style>{css}</style>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1c1c2a', color: '#f5f5f5', border: '1px solid #ffffff14', fontFamily: 'DM Sans, sans-serif' } }} />

      <div className="jp-root" style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>

          {/* ── HEADER ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              <div>
                <span className="jp-pill jp-pill-lime" style={{ marginBottom: 12, display: 'inline-flex' }}>
                  <Zap size={10} /> Job Search
                </span>
                <h1 className="display" style={{ fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: .92, color: '#f5f5f5' }}>
                  Find Your<br /><span style={{ color: '#c6ff00' }}>Dream Role.</span>
                </h1>
                <p style={{ fontSize: 14, color: '#888899', marginTop: 10 }}>
                  {jobs.length > 0
                    ? `${filteredJobs.length} of ${jobs.length} jobs shown`
                    : 'Search jobs tailored to your resume profile'}
                </p>
              </div>
              {sessionId && (
                <div className="jp-pill jp-pill-green">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Resume Analysed
                </div>
              )}
            </div>

            {/* ── SEARCH BAR ── */}
            <div className="jp-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {/* query */}
                <div style={{ flex: '1 1 200px', position: 'relative', minWidth: 0 }}>
                  <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555566', pointerEvents: 'none' }} />
                  <input
                    className="jp-input"
                    type="text"
                    placeholder="Job title, skills, or company"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runSearch()}
                  />
                </div>

                {/* location */}
                <div style={{ flex: '0 1 200px', position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#555566', pointerEvents: 'none' }} />
                  <input
                    className="jp-input"
                    type="text"
                    placeholder="Location"
                    value={locationVal}
                    onChange={e => setLocationVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runSearch()}
                  />
                </div>

                {/* buttons */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="jp-btn jp-btn-ghost" onClick={() => setShowFilters(s => !s)}>
                    <SlidersHorizontal size={15} />
                    <span>Filters {showFilters ? '▲' : '▼'}</span>
                  </button>
                  <button className="jp-btn jp-btn-lime" onClick={() => runSearch()} disabled={isLoading}>
                    {isLoading ? <RefreshCw size={15} className="spin" /> : <Search size={15} />}
                    Search
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── FILTERS ── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 20, overflow: 'hidden' }}
              >
                <JobFilters filters={filters} setFilters={setFilters} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── MAIN GRID ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

            {/* LEFT — job list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="jp-card" style={{ padding: 24 }}>
                    <div className="jp-skeleton" style={{ height: 18, width: '70%', marginBottom: 12 }} />
                    <div className="jp-skeleton" style={{ height: 13, width: '40%', marginBottom: 10 }} />
                    <div className="jp-skeleton" style={{ height: 13, width: '55%' }} />
                  </div>
                ))
              ) : filteredJobs.length > 0 ? (
                <AnimatePresence>
                  {filteredJobs.map((job, idx) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }} transition={{ delay: idx * 0.05 }}
                    >
                      <JobCard
                        job={job}
                        isSelected={selectedJob?.id === job.id}
                        isSaved={savedJobs.has(job.id)}
                        matchScore={matchAnalysis[job.id]?.score}
                        onSelect={() => handleJobSelect(job)}
                        onSave={() => handleSaveJob(job.id)}
                        sessionId={sessionId}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              ) : jobs.length === 0 ? (
                /* empty state */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="jp-card"
                  style={{ padding: 64, textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 20, background: '#c6ff0015', border: '1px solid #c6ff0025', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <Search size={32} style={{ color: '#c6ff00' }} />
                  </div>
                  <h3 className="display" style={{ fontSize: 32, marginBottom: 10 }}>
                    {sessionId ? 'Start Your Search' : 'Upload Resume First'}
                  </h3>
                  <p style={{ fontSize: 14, color: '#888899', marginBottom: 28, maxWidth: 340, margin: '0 auto 28px' }}>
                    {sessionId
                      ? 'Enter a job title or skill above to get AI-powered matches'
                      : 'Your resume is needed to get personalised job recommendations'}
                  </p>
                  {!sessionId && (
                    <button className="jp-btn jp-btn-lime" onClick={() => navigate('/')}>
                      <Brain size={15} /> Upload Resume <ArrowRight size={13} />
                    </button>
                  )}
                </motion.div>
              ) : (
                /* no filter results */
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="jp-card"
                  style={{ padding: 48, textAlign: 'center' }}>
                  <AlertCircle size={40} style={{ color: '#f59e0b', margin: '0 auto 16px' }} />
                  <h3 className="display" style={{ fontSize: 26, marginBottom: 8 }}>No Results</h3>
                  <p style={{ fontSize: 14, color: '#888899', marginBottom: 24 }}>Try adjusting or clearing your filters</p>
                  <button className="jp-btn jp-btn-ghost" onClick={resetFilters}>Clear Filters</button>
                </motion.div>
              )}
            </div>

            {/* RIGHT — job details */}
            <div style={{ position: 'sticky', top: 84 }}>
              {selectedJob ? (
                <JobDetails
                  job={selectedJob}
                  matchAnalysis={matchAnalysis[selectedJob.id]}
                  sessionId={sessionId}
                  isSaved={savedJobs.has(selectedJob.id)}
                  onSave={() => handleSaveJob(selectedJob.id)}
                />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="jp-card"
                  style={{ padding: 48, textAlign: 'center' }}>
                  <div style={{ width: 60, height: 60, borderRadius: 16, background: '#ffffff08', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Briefcase size={26} style={{ color: '#333344' }} />
                  </div>
                  <h3 className="display" style={{ fontSize: 24, marginBottom: 8 }}>Select a Job</h3>
                  <p style={{ fontSize: 13, color: '#888899' }}>Click any listing to view details, AI match score, cover letter and interview tips</p>
                </motion.div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* responsive collapse */}
      <style>{`@media(max-width:900px){.jp-root > div > div:last-child{grid-template-columns:1fr !important;}}`}</style>
    </>
  );
};

export default JobsPage;
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, MapPin, DollarSign, Calendar, Users,
  ExternalLink, Bookmark, BookmarkCheck, Brain,
  FileText, MessageSquare, TrendingUp, Share2,
  Sparkles, Target, AlertTriangle, CheckCircle,
  Loader2, Copy, Download, Check,
} from 'lucide-react';
import { jobAssistantAPI } from '../services/api';
import toast from 'react-hot-toast';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
  .jd-root { font-family: 'DM Sans', sans-serif; color: #f5f5f5; }
  .jd-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .03em; }

  .jd-card {
    background: #0e0e16; border: 1px solid #ffffff10;
    border-radius: 18px; overflow: hidden; backdrop-filter: blur(24px);
  }

  .jd-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 9px; font-size: 12px;
    font-weight: 500; cursor: pointer; border: none; flex: 1;
    justify-content: center; transition: background .15s, color .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .jd-tab-active   { background: #ffffff12; color: #f5f5f5; }
  .jd-tab-inactive { background: transparent; color: #555566; }
  .jd-tab-inactive:hover { background: #ffffff08; color: #888899; }

  .jd-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px; border-radius: 10px; font-size: 13px;
    font-weight: 600; cursor: pointer; border: none;
    font-family: 'DM Sans', sans-serif; transition: box-shadow .15s, transform .1s;
  }
  .jd-btn-lime  { background: #c6ff00; color: #0a0a0f; flex: 1; justify-content: center; }
  .jd-btn-lime:hover { box-shadow: 0 0 20px #c6ff0050; transform: translateY(-1px); }
  .jd-btn-ghost { background: #ffffff0a; color: #f5f5f5; border: 1px solid #ffffff12; }
  .jd-btn-ghost:hover { background: #ffffff12; }
  .jd-btn-sm    { padding: 7px 14px; font-size: 12px; border-radius: 8px; }
  .jd-btn-ai    { background: #c6ff0018; color: #c6ff00; border: 1px solid #c6ff0030; }
  .jd-btn-ai:hover { background: #c6ff0028; }
  .jd-btn-ai:disabled { opacity: .5; cursor: not-allowed; }

  .jd-save-btn {
    width: 38px; height: 38px; border-radius: 10px;
    background: #ffffff08; border: 1px solid #ffffff12;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; transition: background .15s;
  }
  .jd-save-btn:hover { background: #ffffff14; }

  .jd-prose {
    font-size: 13px; color: #aaaabc; line-height: 1.75;
    white-space: pre-wrap; font-family: 'DM Sans', sans-serif;
  }

  .jd-bar-track { width: 100%; height: 4px; background: #ffffff0c; border-radius: 99px; overflow: hidden; }
  .jd-bar-fill  { height: 100%; border-radius: 99px; }

  .jd-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 40px 24px; text-align: center; gap: 12px;
  }

  .jd-divider { height: 1px; background: #ffffff0a; }

  @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  .spin { animation: spin .9s linear infinite; }
`;

/* ─── helpers ── */
const SCORE_COLOR = (s) => !s ? '#555566' : s >= 0.8 ? '#22c55e' : s >= 0.6 ? '#f59e0b' : '#f97316';
const SCORE_LABEL = (s) => !s ? 'No data' : s >= 0.8 ? 'Excellent Match' : s >= 0.6 ? 'Good Match' : 'Fair Match';
const SCORE_ICON  = (s) => !s ? AlertTriangle : s >= 0.8 ? CheckCircle : s >= 0.6 ? Target : AlertTriangle;

const TABS = [
  { id: 'description', label: 'Description', icon: FileText },
  { id: 'match',       label: 'Match',        icon: Brain },
  { id: 'cover',       label: 'Cover',        icon: MessageSquare },
  { id: 'interview',   label: 'Interview',    icon: Sparkles },
];

/* ═══════════════════════════════════════════════════════════════════ */
const JobDetails = ({ job, matchAnalysis, sessionId, isSaved, onSave }) => {
  const [tab,             setTab]             = useState('description');
  const [coverLetter,     setCoverLetter]     = useState('');
  const [interviewTips,   setInterviewTips]   = useState('');
  const [genCover,        setGenCover]        = useState(false);
  const [genTips,         setGenTips]         = useState(false);
  const [copiedCover,     setCopiedCover]     = useState(false);
  const [copiedTips,      setCopiedTips]      = useState(false);

  const generateCoverLetter = async () => {
    if (!sessionId) { toast.error('Upload your resume first'); return; }
    setGenCover(true);
    try {
      const res = await jobAssistantAPI.generateCoverLetter(sessionId);
      if (res.data.success) { setCoverLetter(res.data.cover_letter); toast.success('Cover letter ready!'); }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to generate'); }
    finally { setGenCover(false); }
  };

  const generateInterviewTips = async () => {
    if (!sessionId) { toast.error('Upload your resume first'); return; }
    setGenTips(true);
    try {
      const res = await jobAssistantAPI.generateInterviewTips(sessionId);
      if (res.data.success) { setInterviewTips(res.data.interview_tips); toast.success('Interview tips ready!'); }
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to generate'); }
    finally { setGenTips(false); }
  };

  const copy = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true); toast.success('Copied!');
    setTimeout(() => setter(false), 2000);
  };

  const scoreColor = SCORE_COLOR(matchAnalysis?.score);
  const ScoreIcon  = SCORE_ICON(matchAnalysis?.score);

  return (
    <>
      <style>{css}</style>
      <motion.div className="jd-root jd-card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>

        {/* ── JOB HEADER ── */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f5f5f5', marginBottom: 6, lineHeight: 1.3 }}>{job.title}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 size={13} style={{ color: '#c6ff00', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#c6ff00', fontWeight: 500 }}>{job.company}</span>
              </div>
            </div>
            <div className="jd-save-btn" onClick={onSave}>
              {isSaved
                ? <BookmarkCheck size={16} style={{ color: '#c6ff00' }} />
                : <Bookmark      size={16} style={{ color: '#555566' }} />
              }
            </div>
          </div>

          {/* meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 16 }}>
            {[
              { icon: MapPin,    val: job.location },
              { icon: Users,     val: job.contract_type?.replace('_', ' ') },
              job.salary_display && { icon: DollarSign, val: job.salary_display },
              { icon: Calendar,  val: job.posted_date || 'Recently posted' },
            ].filter(Boolean).map(({ icon: Icon, val }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={12} style={{ color: '#555566', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#888899', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* match score bar */}
          {sessionId && matchAnalysis && (
            <div style={{ marginBottom: 16, padding: '12px 14px', background: `${scoreColor}0e`, border: `1px solid ${scoreColor}25`, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <TrendingUp size={14} style={{ color: scoreColor }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor }}>{SCORE_LABEL(matchAnalysis.score)}</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor }}>{Math.round(matchAnalysis.score * 100)}%</span>
              </div>
              <div className="jd-bar-track">
                <motion.div
                  className="jd-bar-fill"
                  style={{ background: scoreColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${matchAnalysis.score * 100}%` }}
                  transition={{ duration: .8, ease: 'easeOut' }}
                />
              </div>
            </div>
          )}

          {/* action buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="jd-btn jd-btn-lime" style={{ display: 'flex' }} onClick={() => window.open(job.apply_url || '#', '_blank')}>
              <ExternalLink size={14} /> Apply Now
            </button>
            <button className="jd-btn jd-btn-ghost" style={{ width: 40, padding: 0, justifyContent: 'center' }}>
              <Share2 size={14} />
            </button>
          </div>

          <div className="jd-divider" />
        </div>

        {/* ── TABS ── */}
        <div style={{ padding: '12px 20px' }}>
          <div style={{ display: 'flex', gap: 4, background: '#ffffff05', borderRadius: 12, padding: 4 }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} className={`jd-tab ${tab === t.id ? 'jd-tab-active' : 'jd-tab-inactive'}`} onClick={() => setTab(t.id)}>
                  <Icon size={13} />
                  <span style={{ display: 'none', '@media(minWidth:480px)': { display: 'inline' } }}>{t.label}</span>
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="jd-divider" />

        {/* ── TAB CONTENT ── */}
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: '20px' }}>
          <AnimatePresence mode="wait">

            {/* Description */}
            {tab === 'description' && (
              <motion.div key="desc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <p className="jd-prose">{job.full_description || job.description}</p>
              </motion.div>
            )}

            {/* Match */}
            {tab === 'match' && (
              <motion.div key="match" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {sessionId ? (
                  matchAnalysis ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <ScoreIcon size={18} style={{ color: scoreColor }} />
                        <span style={{ fontSize: 15, fontWeight: 600, color: scoreColor }}>{SCORE_LABEL(matchAnalysis.score)}</span>
                      </div>
                      <p className="jd-prose">{matchAnalysis.analysis}</p>
                    </div>
                  ) : (
                    <div className="jd-empty">
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: '#ffffff08', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 size={22} style={{ color: '#c6ff00' }} className="spin" />
                      </div>
                      <p style={{ fontSize: 13, color: '#888899' }}>Analysing match…</p>
                    </div>
                  )
                ) : (
                  <div className="jd-empty">
                    <Brain size={32} style={{ color: '#333344' }} />
                    <p style={{ fontSize: 13, color: '#888899' }}>Upload your resume to see match analysis</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Cover Letter */}
            {tab === 'cover' && (
              <motion.div key="cover" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>Cover Letter</p>
                  {sessionId && (
                    <button className="jd-btn jd-btn-ai jd-btn-sm" onClick={generateCoverLetter} disabled={genCover}>
                      {genCover ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
                      {coverLetter ? 'Regenerate' : 'Generate'}
                    </button>
                  )}
                </div>
                {coverLetter ? (
                  <div>
                    <div style={{ background: '#ffffff05', border: '1px solid #ffffff0a', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <p className="jd-prose">{coverLetter}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="jd-btn jd-btn-ghost jd-btn-sm" onClick={() => copy(coverLetter, setCopiedCover)}>
                        {copiedCover ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} />}
                        {copiedCover ? 'Copied' : 'Copy'}
                      </button>
                      <button className="jd-btn jd-btn-ghost jd-btn-sm"><Download size={12} /> Download</button>
                    </div>
                  </div>
                ) : sessionId ? (
                  <div className="jd-empty">
                    <MessageSquare size={32} style={{ color: '#333344' }} />
                    <p style={{ fontSize: 13, color: '#888899' }}>Generate a personalised cover letter for this role</p>
                  </div>
                ) : (
                  <div className="jd-empty">
                    <MessageSquare size={32} style={{ color: '#333344' }} />
                    <p style={{ fontSize: 13, color: '#888899' }}>Upload your resume to generate cover letters</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Interview Tips */}
            {tab === 'interview' && (
              <motion.div key="interview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <p style={{ fontSize: 15, fontWeight: 600 }}>Interview Tips</p>
                  {sessionId && (
                    <button className="jd-btn jd-btn-ai jd-btn-sm" onClick={generateInterviewTips} disabled={genTips}>
                      {genTips ? <Loader2 size={13} className="spin" /> : <Brain size={13} />}
                      {interviewTips ? 'Regenerate' : 'Generate'}
                    </button>
                  )}
                </div>
                {interviewTips ? (
                  <div>
                    <div style={{ background: '#ffffff05', border: '1px solid #ffffff0a', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <p className="jd-prose">{interviewTips}</p>
                    </div>
                    <button className="jd-btn jd-btn-ghost jd-btn-sm" onClick={() => copy(interviewTips, setCopiedTips)}>
                      {copiedTips ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} />}
                      {copiedTips ? 'Copied' : 'Copy Tips'}
                    </button>
                  </div>
                ) : sessionId ? (
                  <div className="jd-empty">
                    <Brain size={32} style={{ color: '#333344' }} />
                    <p style={{ fontSize: 13, color: '#888899' }}>Get personalised interview preparation tips</p>
                  </div>
                ) : (
                  <div className="jd-empty">
                    <Brain size={32} style={{ color: '#333344' }} />
                    <p style={{ fontSize: 13, color: '#888899' }}>Upload your resume to get interview tips</p>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </motion.div>
    </>
  );
};

export default JobDetails;
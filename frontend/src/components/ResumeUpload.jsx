import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Brain,
  Sparkles,
  Download,
  Eye,
  Loader2,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { jobAssistantAPI } from '../services/api';
import toast from 'react-hot-toast';

/* ─── inline styles for this component only ─────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  .ru-root { font-family: 'DM Sans', sans-serif; }
  .ru-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .03em; }

  .ru-zone {
    border: 1.5px dashed #ffffff20;
    border-radius: 20px;
    padding: 56px 40px;
    text-align: center;
    cursor: pointer;
    background: #ffffff04;
    transition: border-color .2s, background .2s, transform .15s;
    position: relative;
    overflow: hidden;
  }
  .ru-zone:hover  { border-color: #c6ff0060; background: #c6ff0006; }
  .ru-zone.active { border-color: #c6ff00;   background: #c6ff0010; transform: scale(1.01); }
  .ru-zone.has-file { border-color: #22c55e80; border-style: solid; }
  .ru-zone.has-error { border-color: #ef444480; border-style: solid; }

  .ru-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 999px; font-size: 12px;
    font-weight: 500; letter-spacing: .06em; text-transform: uppercase;
  }
  .ru-pill-lime { background: #c6ff0020; color: #c6ff00; border: 1px solid #c6ff0040; }
  .ru-pill-red  { background: #ef444420; color: #ef4444; border: 1px solid #ef444440; }
  .ru-pill-green{ background: #22c55e20; color: #22c55e; border: 1px solid #22c55e40; }

  .ru-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 28px; border-radius: 12px; font-size: 14px;
    font-weight: 600; cursor: pointer; border: none; transition: transform .15s, box-shadow .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .ru-btn-lime  { background: #c6ff00; color: #0a0a0f; }
  .ru-btn-lime:hover  { transform: translateY(-2px); box-shadow: 0 0 28px #c6ff0050; }
  .ru-btn-ghost { background: #ffffff08; color: #f5f5f5; border: 1px solid #ffffff14; }
  .ru-btn-ghost:hover { background: #ffffff12; }

  .ru-bar-track { width: 100%; height: 3px; background: #ffffff10; border-radius: 99px; overflow: hidden; }
  .ru-bar-fill  { height: 100%; background: linear-gradient(90deg, #c6ff00, #4f8aff); border-radius: 99px; transition: width .3s; }

  .ru-card {
    background: #ffffff06; border: 1px solid #ffffff12;
    border-radius: 16px; padding: 28px;
    backdrop-filter: blur(20px);
  }

  .ru-feat {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 20px 16px; background: #ffffff05; border: 1px solid #ffffff0d;
    border-radius: 12px; font-size: 12px; color: #888899; text-align: center;
    text-transform: uppercase; letter-spacing: .06em;
  }

  @keyframes spin-slow { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  .spin-slow { animation: spin-slow 3s linear infinite; }

  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .float { animation: float 3.5s ease-in-out infinite; }
`;

/* ─── FEATURE CHIPS ─────────────────────────────────────────────── */
const FEATURES = [
  { icon: Shield,   label: 'Secure' },
  { icon: Zap,      label: 'Instant' },
  { icon: Brain,    label: 'AI Parsed' },
  { icon: FileText, label: 'PDF Only' },
];

/* ─── LOADING MESSAGES ──────────────────────────────────────────── */
const MSGS = [
  'Extracting skills & experience…',
  'Scoring ATS compatibility…',
  'Mapping market positioning…',
  'Building your talent profile…',
];

/* ═══════════════════════════════════════════════════════════════════ */
const ResumeUpload = ({ onAnalysisComplete }) => {
  const [drag,     setDrag]     = useState(false);
  const [file,     setFile]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [msgIdx,   setMsgIdx]   = useState(0);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState(null);

  /* drag handlers */
  const onDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDrag(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDrag(false);
    if (e.dataTransfer.files?.[0]) process(e.dataTransfer.files[0]);
  }, []);

  const process = (f) => {
    if (f.type !== 'application/pdf') { toast.error('PDF files only'); setError('Only PDF files are supported'); return; }
    if (f.size > 16 * 1024 * 1024)    { toast.error('Max 16 MB');       setError('File too large (max 16 MB)'); return; }
    setFile(f); setError(null); upload(f);
  };

  const upload = async (f) => {
    setLoading(true); setProgress(0); setDone(false);

    // rotating messages
    let mi = 0;
    const msgTimer = setInterval(() => { mi = (mi + 1) % MSGS.length; setMsgIdx(mi); }, 2200);

    // fake progress
    const prog = setInterval(() => setProgress(p => p >= 88 ? p : p + 8), 220);

    try {
      const res = await jobAssistantAPI.uploadResume(f);
      clearInterval(prog); clearInterval(msgTimer);
      setProgress(100); setDone(true);

      if (res.data.success) {
        toast.success('Analysis complete!');
        onAnalysisComplete?.({
          sessionId: res.data.session_id,
          analysis:  res.data.resume_analysis,
          filename:  res.data.filename,
        });
      }
    } catch (err) {
      clearInterval(prog); clearInterval(msgTimer);
      const msg = err.response?.data?.error || 'Upload failed';
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const reset = () => { setFile(null); setDone(false); setError(null); setProgress(0); };

  /* ── zone class ── */
  const zoneClass = [
    'ru-zone',
    drag  ? 'active'    : '',
    file && !error ? 'has-file'  : '',
    error ? 'has-error' : '',
  ].join(' ');

  return (
    <>
      <style>{css}</style>
      <div className="ru-root" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── DROP ZONE ── */}
        <div
          className={zoneClass}
          onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
          onClick={() => !file && document.getElementById('ru-input').click()}
        >
          {/* ambient corner glow */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, #c6ff0015 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, background: 'radial-gradient(circle, #4f8aff10 0%, transparent 70%)', pointerEvents: 'none' }} />

          {!file ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* icon */}
              <div className="float" style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #c6ff0030, #4f8aff20)', border: '1px solid #c6ff0040', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
                <Upload size={32} style={{ color: '#c6ff00' }} />
              </div>

              <h3 style={{ fontSize: 22, fontWeight: 600, color: '#f5f5f5', marginBottom: 8 }}>Drop your CV here</h3>
              <p style={{ fontSize: 14, color: '#888899', marginBottom: 28 }}>or click to browse from your device</p>

              <button className="ru-btn ru-btn-lime" onClick={e => { e.stopPropagation(); document.getElementById('ru-input').click(); }}>
                <Upload size={15} /> Choose File
              </button>

              {/* feature chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 36, maxWidth: 440, marginInline: 'auto' }}>
                {FEATURES.map(({ icon: Icon, label }) => (
                  <div key={label} className="ru-feat">
                    <Icon size={18} style={{ color: '#c6ff00', opacity: .9 }} />
                    {label}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: done ? '#22c55e20' : '#c6ff0020', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${done ? '#22c55e40' : '#c6ff0040'}` }}>
                  {done
                    ? <CheckCircle size={22} style={{ color: '#22c55e' }} />
                    : loading
                      ? <div className="spin-slow"><Loader2 size={22} style={{ color: '#c6ff00' }} /></div>
                      : <FileText size={22} style={{ color: '#c6ff00' }} />
                  }
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ fontWeight: 600, color: '#f5f5f5', fontSize: 15 }}>{file.name}</p>
                  <p style={{ fontSize: 12, color: '#888899' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!loading && (
                  <button onClick={e => { e.stopPropagation(); reset(); }}
                    style={{ marginLeft: 8, width: 32, height: 32, borderRadius: '50%', background: '#ef444420', border: '1px solid #ef444440', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} style={{ color: '#ef4444' }} />
                  </button>
                )}
              </div>

              {/* progress */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 360, margin: '0 auto', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#888899' }}>{MSGS[msgIdx]}</span>
                    <span style={{ fontSize: 13, color: '#c6ff00', fontWeight: 600 }}>{progress}%</span>
                  </div>
                  <div className="ru-bar-track">
                    <div className="ru-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          <input id="ru-input" type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && process(e.target.files[0])} className="hidden" style={{ display: 'none' }} disabled={loading} />
        </div>

        {/* ── ERROR ── */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: '#ef444412', border: '1px solid #ef444430', borderRadius: 12 }}>
              <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#ef4444' }}>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── LOADING CARD ── */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ru-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #c6ff0030, #4f8aff20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div className="spin-slow"><Brain size={24} style={{ color: '#c6ff00' }} /></div>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#f5f5f5', marginBottom: 4, fontSize: 15 }}>AI Analysing Your Resume</p>
                  <p style={{ fontSize: 13, color: '#888899' }}>Extracting skills, experience patterns and market fit…</p>
                </div>
                <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <span className="ru-pill ru-pill-lime"><Sparkles size={10} /> Live</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SUCCESS CARD ── */}
        <AnimatePresence>
          {done && file && !loading && !error && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ru-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#22c55e20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={20} style={{ color: '#22c55e' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#f5f5f5', fontSize: 15 }}>Resume Successfully Analysed</p>
                  <p style={{ fontSize: 13, color: '#888899' }}>Scroll down to see your full profile breakdown</p>
                </div>
                <span className="ru-pill ru-pill-green" style={{ marginLeft: 'auto' }}>Complete</span>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="ru-btn ru-btn-ghost" style={{ fontSize: 13, padding: '10px 18px' }}>
                  <Eye size={14} /> View Analysis
                </button>
                <button className="ru-btn ru-btn-ghost" style={{ fontSize: 13, padding: '10px 18px' }}>
                  <Download size={14} /> Export PDF
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};

export default ResumeUpload;
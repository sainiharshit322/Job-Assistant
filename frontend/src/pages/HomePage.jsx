import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  ArrowRight,
  CheckCircle,
  Zap,
  Target,
  TrendingUp,
  Shield,
  ChevronDown,
} from 'lucide-react';
import ResumeUpload from '../components/ResumeUpload';
import ResumeAnalysis from '../components/ResumeAnalysis';
import { jobAssistantAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

/* ─── DESIGN TOKENS ──────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap');

  :root {
    --ink:      #0a0a0f;
    --ink-2:    #12121a;
    --ink-3:    #1c1c2a;
    --surface:  #ffffff08;
    --border:   #ffffff14;
    --lime:     #c6ff00;
    --lime-dim: #c6ff0033;
    --blue:     #4f8aff;
    --blue-dim: #4f8aff22;
    --white:    #f5f5f5;
    --muted:    #888899;
    --font-display: 'Bebas Neue', sans-serif;
    --font-body: 'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--ink);
    color: var(--white);
    font-family: var(--font-body);
    overflow-x: hidden;
  }

  /* grid overlay */
  .grid-bg {
    background-image:
      linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
    background-size: 80px 80px;
  }

  /* noise grain */
  .grain::after {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
  }

  .display { font-family: var(--font-display); letter-spacing: .02em; }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    backdrop-filter: blur(24px);
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .tag-lime { background: var(--lime-dim); color: var(--lime); border: 1px solid #c6ff0055; }
  .tag-blue { background: var(--blue-dim); color: var(--blue); border: 1px solid #4f8aff44; }
  .tag-white { background: #ffffff10; color: var(--muted); border: 1px solid var(--border); }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 32px;
    border-radius: 12px;
    background: var(--lime);
    color: var(--ink);
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    border: none;
    transition: transform .15s, box-shadow .15s;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 40px #c6ff0060;
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    border-radius: 12px;
    background: transparent;
    color: var(--white);
    font-family: var(--font-body);
    font-weight: 500;
    font-size: 15px;
    cursor: pointer;
    border: 1px solid var(--border);
    transition: background .15s, border-color .15s;
  }
  .btn-ghost:hover { background: var(--surface); border-color: #ffffff30; }

  .step-active { border-color: var(--lime) !important; box-shadow: 0 0 24px #c6ff0030; }
  .step-done   { border-color: #ffffff25 !important; }

  .marquee-wrap { overflow: hidden; white-space: nowrap; }
  .marquee-track {
    display: inline-block;
    animation: marquee 28s linear infinite;
  }
  @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

  .glow-lime { text-shadow: 0 0 60px #c6ff0080; }
  .glow-blue { text-shadow: 0 0 60px #4f8aff80; }

  /* status dot pulse */
  @keyframes ping {
    0%,100%{opacity:1;transform:scale(1)}
    50%{opacity:.4;transform:scale(1.6)}
  }
  .dot-pulse { animation: ping 1.5s ease-in-out infinite; }

  /* scroll indicator bounce */
  @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }
  .bounce { animation: bounce 1.8s ease-in-out infinite; }
`;

/* ─── MARQUEE SKILLS ─────────────────────────────────────────────── */
const SKILLS = ['React', 'Python', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'GraphQL', 'Go', 'Kubernetes', 'Machine Learning', 'Next.js', 'PostgreSQL', 'Redis', 'Terraform', 'Rust'];

const Marquee = () => (
  <div className="marquee-wrap" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '14px 0', background: '#ffffff03' }}>
    <div className="marquee-track">
      {[...SKILLS, ...SKILLS].map((s, i) => (
        <span key={i} style={{ marginRight: 48, color: 'var(--muted)', fontFamily: 'var(--font-body)', fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase' }}>
          {s} <span style={{ color: 'var(--lime)', marginLeft: 24 }}>✦</span>
        </span>
      ))}
    </div>
  </div>
);

/* ─── STATUS BADGE ───────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    online:   { color: '#22c55e', label: 'AI Online' },
    offline:  { color: '#ef4444', label: 'Service Offline' },
    checking: { color: '#f59e0b', label: 'Connecting…' },
  };
  const { color, label } = map[status] || map.checking;
  return (
    <div className="tag tag-white" style={{ gap: 8 }}>
      <span className="dot-pulse" style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color }} />
      {label}
    </div>
  );
};

/* ─── STEP CARD ──────────────────────────────────────────────────── */
const STEPS = [
  { n: 1, icon: Brain,     title: 'Upload Resume',  sub: 'PDF in, insights out' },
  { n: 2, icon: Zap,       title: 'AI Analysis',    sub: 'Skills, gaps, strengths' },
  { n: 3, icon: Target,    title: 'Job Matching',   sub: 'Curated for your profile' },
  { n: 4, icon: TrendingUp,title: 'Apply Smart',    sub: 'Cover letters & prep' },
];

const StepCard = ({ step, current }) => {
  const done   = current > step.n;
  const active = current === step.n;
  const Icon   = step.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: step.n * 0.08 }}
      className={`card ${active ? 'step-active' : done ? 'step-done' : ''}`}
      style={{ padding: '28px 24px', position: 'relative', overflow: 'hidden' }}
    >
      {/* number watermark */}
      <div className="display" style={{ position: 'absolute', top: -10, right: 12, fontSize: 80, color: active ? '#c6ff0010' : '#ffffff06', lineHeight: 1, pointerEvents: 'none' }}>
        {step.n}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: active ? 'var(--lime)' : done ? '#ffffff10' : '#ffffff08',
        }}>
          {done
            ? <CheckCircle size={20} style={{ color: 'var(--muted)' }} />
            : <Icon size={20} style={{ color: active ? 'var(--ink)' : 'var(--muted)' }} />
          }
        </div>
        {active && <span className="tag tag-lime">Current</span>}
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: active ? 'var(--white)' : 'var(--muted)', marginBottom: 4 }}>
        {step.title}
      </p>
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>{step.sub}</p>
    </motion.div>
  );
};

/* ─── HERO METRICS ───────────────────────────────────────────────── */
const METRICS = [
  { val: '94%',  label: 'Match accuracy' },
  { val: '3×',   label: 'More interviews' },
  { val: '12s',  label: 'Analysis time' },
  { val: '2026', label: 'Market ready' },
];

/* ═══════════════════════════════════════════════════════════════════
   HOMEPAGE
═══════════════════════════════════════════════════════════════════ */
const HomePage = () => {
  const [currentStep, setCurrentStep]   = useState(1);
  const [analysisData, setAnalysisData] = useState(null);
  const [apiStatus, setApiStatus]       = useState('checking');
  const navigate = useNavigate();

  useEffect(() => {
    checkAPIStatus();
    const sid  = localStorage.getItem('sessionId');
    const an   = localStorage.getItem('resumeAnalysis');
    const fn   = localStorage.getItem('resumeFilename');
    if (sid && an) {
      setAnalysisData({ sessionId: sid, analysis: an, filename: fn || 'Previous Resume' });
      setCurrentStep(2);
    }
  }, []);

  const checkAPIStatus = async () => {
    try {
      await jobAssistantAPI.healthCheck();
      setApiStatus('online');
    } catch {
      setApiStatus('offline');
      toast.error('Backend service is offline. Please start the Flask server.');
    }
  };

  const handleAnalysisComplete = (data) => {
    localStorage.setItem('sessionId', data.sessionId);
    localStorage.setItem('resumeAnalysis', data.analysis);
    localStorage.setItem('resumeFilename', data.filename);
    setAnalysisData(data);
    setCurrentStep(2);
    toast.success('Resume analysis complete!');
  };

  const handleFindJobs = () => {
    if (!analysisData?.sessionId) { toast.error('Complete resume analysis first'); return; }
    localStorage.setItem('autoSearch', 'true');
    localStorage.setItem('defaultSearchQuery', 'developer');
    navigate('/jobs');
  };

  return (
    <>
      <style>{css}</style>
      <div className="grain grid-bg" style={{ minHeight: '100vh', position: 'relative' }}>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1c1c2a', color: '#f5f5f5', border: '1px solid #ffffff14', fontFamily: 'var(--font-body)' }
        }} />

        {/* ── AMBIENT BLOBS ── */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-5%',  width: 640, height: 640, borderRadius: '50%', background: 'radial-gradient(circle, #c6ff0012 0%, transparent 70%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '5%',  right: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, #4f8aff0e 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        {/* ── HERO ── */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 5% 60px', position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              <span className="tag tag-lime"><Zap size={11} /> AI-Powered · 2026 Edition</span>
              <span className="tag tag-white"><Shield size={11} /> ATS-Smart</span>
            </div>

            <h1 className="display glow-lime" style={{ fontSize: 'clamp(56px, 10vw, 110px)', lineHeight: .92, marginBottom: 32, maxWidth: 900 }}>
              Land Your<br />
              <span style={{ color: 'var(--lime)' }}>Dream Job</span><br />
              Faster.
            </h1>

            <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 500, lineHeight: 1.6, marginBottom: 48 }}>
              Upload your resume. Get instant AI analysis, personalised job matches, and a competitive edge in today's market.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 64 }}>
              {currentStep === 1
                ? <button className="btn-primary" onClick={() => document.getElementById('action-section')?.scrollIntoView({ behavior: 'smooth' })}>
                    Analyse My Resume <ArrowRight size={16} />
                  </button>
                : <button className="btn-primary" onClick={handleFindJobs}>
                    Find Matching Jobs <ArrowRight size={16} />
                  </button>
              }
              <button className="btn-ghost" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                How it works <ChevronDown size={15} />
              </button>
            </div>

            {/* metrics row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', maxWidth: 640 }}>
              {METRICS.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .4 + i * .08 }}
                  style={{ padding: '20px 16px', background: 'var(--surface)', borderRight: i < 3 ? '1px solid var(--border)' : 'none', textAlign: 'center' }}>
                  <div className="display" style={{ fontSize: 28, color: i === 0 ? 'var(--lime)' : 'var(--white)', lineHeight: 1 }}>{m.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{m.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── MARQUEE ── */}
        <Marquee />

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 5%', position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ marginBottom: 56 }}>
            <span className="tag tag-blue" style={{ marginBottom: 20, display: 'inline-flex' }}>Process</span>
            <h2 className="display" style={{ fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: .95, marginBottom: 16 }}>
              Four Steps.<br />
              <span style={{ color: 'var(--muted)' }}>One Outcome.</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {STEPS.map(s => <StepCard key={s.n} step={s} current={currentStep} />)}
          </div>
        </section>

        {/* ── ACTION SECTION ── */}
        <section id="action-section" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5% 120px', position: 'relative', zIndex: 1 }}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div key="upload" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}>
                <div style={{ marginBottom: 40 }}>
                  <span className="tag tag-lime" style={{ marginBottom: 16, display: 'inline-flex' }}><Brain size={11} /> Step 1</span>
                  <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: .95, marginBottom: 12 }}>Upload Your CV</h2>
                  <p style={{ color: 'var(--muted)', fontSize: 16 }}>PDF only · Max 16 MB · Analysed in seconds</p>
                </div>
                <ResumeUpload onAnalysisComplete={handleAnalysisComplete} />
              </motion.div>
            )}

            {currentStep === 2 && analysisData && (
              <motion.div key="analysis" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}>
                <div style={{ marginBottom: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
                  <div>
                    <span className="tag tag-lime" style={{ marginBottom: 16, display: 'inline-flex' }}><CheckCircle size={11} /> Analysis Ready</span>
                    <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: .95 }}>Your Profile<br /><span style={{ color: 'var(--lime)' }}>Decoded.</span></h2>
                  </div>
                  <button className="btn-primary" onClick={handleFindJobs}>
                    Find Jobs Now <ArrowRight size={16} />
                  </button>
                </div>
                <ResumeAnalysis analysis={analysisData.analysis} filename={analysisData.filename} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 5%', background: '#ffffff03' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Brain size={13} style={{ color: 'var(--ink)' }} />
              </div>
              <span className="display" style={{ fontSize: 16, color: 'var(--white)' }}>HIREAI</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>© 2026 · Built for the future of work</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
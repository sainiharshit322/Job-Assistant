import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Brain, TrendingUp, Award, Code, Briefcase,
  GraduationCap, Star, AlertTriangle, Globe,
  ChevronDown, ChevronUp, Copy, Download, Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── STYLES ──────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

  .ra-root { font-family: 'DM Sans', sans-serif; color: #f5f5f5; }
  .ra-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .03em; }

  .ra-card {
    background: #ffffff06; border: 1px solid #ffffff10;
    border-radius: 18px; backdrop-filter: blur(24px);
    transition: border-color .2s;
  }
  .ra-card:hover { border-color: #ffffff1e; }

  .ra-tab {
    padding: 9px 18px; border-radius: 10px; font-size: 13px;
    font-weight: 500; cursor: pointer; border: none; display: inline-flex;
    align-items: center; gap: 7px; transition: background .15s, color .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .ra-tab-active   { background: #ffffff12; color: #f5f5f5; }
  .ra-tab-inactive { background: transparent; color: #888899; }
  .ra-tab-inactive:hover { background: #ffffff08; color: #f5f5f5; }

  .ra-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 999px; font-size: 11px;
    font-weight: 500; letter-spacing: .06em; text-transform: uppercase;
  }
  .ra-pill-lime  { background: #c6ff0020; color: #c6ff00; border: 1px solid #c6ff0040; }
  .ra-pill-blue  { background: #4f8aff20; color: #4f8aff; border: 1px solid #4f8aff40; }
  .ra-pill-green { background: #22c55e20; color: #22c55e; border: 1px solid #22c55e40; }
  .ra-pill-amber { background: #f59e0b20; color: #f59e0b; border: 1px solid #f59e0b40; }
  .ra-pill-red   { background: #ef444420; color: #ef4444; border: 1px solid #ef444440; }

  .ra-icon-box {
    width: 42px; height: 42px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  .ra-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 10px; font-size: 13px;
    font-weight: 500; cursor: pointer; border: none; transition: background .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .ra-btn-ghost { background: #ffffff08; color: #f5f5f5; border: 1px solid #ffffff14; }
  .ra-btn-ghost:hover { background: #ffffff12; }
  .ra-btn-lime  { background: #c6ff00; color: #0a0a0f; }
  .ra-btn-lime:hover { box-shadow: 0 0 24px #c6ff0050; }

  .ra-divider { height: 1px; background: #ffffff0d; }

  .ra-prose { font-size: 14px; color: #aaaabc; line-height: 1.7; white-space: pre-wrap; }

  .ra-section-btn {
    display: flex; align-items: center; gap: 8px; background: none;
    border: none; color: #888899; font-size: 13px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; padding: 0; transition: color .15s;
  }
  .ra-section-btn:hover { color: #c6ff00; }

  .ra-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .ra-grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }

  .ra-score-bar-track { width: 100%; height: 4px; background: #ffffff10; border-radius: 99px; overflow: hidden; }
  .ra-score-bar-fill  { height: 100%; border-radius: 99px; }

  /* max-height collapser */
  .ra-collapsed { max-height: 80px; overflow: hidden; -webkit-mask-image: linear-gradient(black 30%, transparent); mask-image: linear-gradient(black 30%, transparent); }
  .ra-expanded  { max-height: none; }
`;

/* ─── HELPERS ─────────────────────────────────────────────────────── */
const parseAnalysis = (text = '') => {
  const sections = { personalInfo: '', skills: '', experience: '', education: '', strengths: '', improvements: '', positioning: '' };
  let cur = '';
  text.split('\n').forEach(line => {
    if (line.includes('PERSONAL INFORMATION'))    cur = 'personalInfo';
    else if (line.includes('TECHNICAL SKILLS'))   cur = 'skills';
    else if (line.includes('EXPERIENCE ANALYSIS'))cur = 'experience';
    else if (line.includes('EDUCATION'))          cur = 'education';
    else if (line.includes('STRENGTHS'))          cur = 'strengths';
    else if (line.includes('IMPROVEMENT'))        cur = 'improvements';
    else if (line.includes('MARKET POSITIONING')) cur = 'positioning';
    else if (cur && line.trim()) sections[cur] += line + '\n';
  });
  return sections;
};

/* ─── CARD DATA ───────────────────────────────────────────────────── */
const CARDS = (p) => [
  { key: 'skills',       label: 'Technical Skills',         icon: Code,          pill: 'ra-pill-blue',  pillText: 'Stack',   iconBg: '#4f8aff20', iconColor: '#4f8aff', content: p.skills },
  { key: 'experience',   label: 'Experience Overview',      icon: Briefcase,     pill: 'ra-pill-lime',  pillText: 'Career',  iconBg: '#c6ff0020', iconColor: '#c6ff00', content: p.experience },
  { key: 'education',    label: 'Education',                icon: GraduationCap, pill: 'ra-pill-blue',  pillText: 'Degree',  iconBg: '#8b5cf620', iconColor: '#8b5cf6', content: p.education },
  { key: 'strengths',    label: 'Key Strengths',            icon: Star,          pill: 'ra-pill-green', pillText: 'Strong',  iconBg: '#22c55e20', iconColor: '#22c55e', content: p.strengths },
  { key: 'improvements', label: 'Improvement Areas',        icon: AlertTriangle, pill: 'ra-pill-amber', pillText: 'Gaps',    iconBg: '#f59e0b20', iconColor: '#f59e0b', content: p.improvements },
  { key: 'positioning',  label: 'Market Positioning',       icon: Globe,         pill: 'ra-pill-lime',  pillText: 'Market',  iconBg: '#06b6d420', iconColor: '#06b6d4', content: p.positioning },
];

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: User },
  { id: 'skills',      label: 'Skills',      icon: Code },
  { id: 'experience',  label: 'Experience',  icon: Briefcase },
  { id: 'insights',    label: 'Insights',    icon: Brain },
];

/* ─── ANALYSIS CARD ───────────────────────────────────────────────── */
const AnalysisCard = ({ card, idx }) => {
  const [open, setOpen] = useState(false);
  const Icon = card.icon;
  const hasContent = !!card.content?.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * .07 }}
      className="ra-card" style={{ padding: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ra-icon-box" style={{ background: card.iconBg }}>
            <Icon size={18} style={{ color: card.iconColor }} />
          </div>
          <p style={{ fontWeight: 600, fontSize: 15 }}>{card.label}</p>
        </div>
        <span className={`ra-pill ${card.pill}`}>{card.pillText}</span>
      </div>

      <div className={hasContent ? (open ? 'ra-expanded' : 'ra-collapsed') : ''}>
        <p className="ra-prose">
          {hasContent ? card.content : <span style={{ color: '#555566' }}>No data extracted for this section.</span>}
        </p>
      </div>

      {hasContent && (
        <button className="ra-section-btn" style={{ marginTop: 12 }} onClick={() => setOpen(o => !o)}>
          {open ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Read more</>}
        </button>
      )}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */
const ResumeAnalysis = ({ analysis = '', filename = '' }) => {
  const [tab,      setTab]      = useState('overview');
  const [copied,   setCopied]   = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  const p = parseAnalysis(analysis);
  const cards = CARDS(p);

  const copyAll = () => {
    navigator.clipboard.writeText(analysis);
    setCopied(true); toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{css}</style>
      <div className="ra-root" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── HEADER CARD ── */}
        <div className="ra-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="ra-icon-box" style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #c6ff0030, #4f8aff20)', border: '1px solid #c6ff0030' }}>
                <Brain size={24} style={{ color: '#c6ff00' }} />
              </div>
              <div>
                <h2 className="display" style={{ fontSize: 28, lineHeight: 1 }}>Resume Analysis</h2>
                <p style={{ fontSize: 13, color: '#888899', marginTop: 4 }}>{filename}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="ra-btn ra-btn-ghost" onClick={copyAll}>
                {copied ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button className="ra-btn ra-btn-ghost">
                <Download size={14} /> Export
              </button>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: 6, padding: '6px', background: '#ffffff05', borderRadius: 14, flexWrap: 'wrap' }}>
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} className={`ra-tab ${tab === t.id ? 'ra-tab-active' : 'ra-tab-inactive'}`} onClick={() => setTab(t.id)}>
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── TAB PANELS ── */}
        <AnimatePresence mode="wait">

          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ra-grid-3">
              {cards.map((c, i) => <AnalysisCard key={c.key} card={c} idx={i} />)}
            </motion.div>
          )}

          {tab === 'skills' && (
            <motion.div key="skills" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ra-card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div className="ra-icon-box" style={{ background: '#4f8aff20' }}>
                  <Code size={18} style={{ color: '#4f8aff' }} />
                </div>
                <h3 className="display" style={{ fontSize: 26 }}>Technical Skills</h3>
              </div>
              <div className="ra-divider" style={{ marginBottom: 24 }} />
              <p className="ra-prose">{p.skills || 'No skills data extracted.'}</p>
            </motion.div>
          )}

          {tab === 'experience' && (
            <motion.div key="experience" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="ra-grid-2">
              <div className="ra-card" style={{ padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div className="ra-icon-box" style={{ background: '#c6ff0020' }}>
                    <Briefcase size={18} style={{ color: '#c6ff00' }} />
                  </div>
                  <h3 className="display" style={{ fontSize: 22 }}>Work History</h3>
                </div>
                <p className="ra-prose">{p.experience || 'No experience data extracted.'}</p>
              </div>
              <div className="ra-card" style={{ padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div className="ra-icon-box" style={{ background: '#8b5cf620' }}>
                    <GraduationCap size={18} style={{ color: '#8b5cf6' }} />
                  </div>
                  <h3 className="display" style={{ fontSize: 22 }}>Education</h3>
                </div>
                <p className="ra-prose">{p.education || 'No education data extracted.'}</p>
              </div>
            </motion.div>
          )}

          {tab === 'insights' && (
            <motion.div key="insights" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* strengths vs gaps */}
              <div className="ra-grid-2">
                <div className="ra-card" style={{ padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div className="ra-icon-box" style={{ background: '#22c55e20' }}>
                      <Star size={18} style={{ color: '#22c55e' }} />
                    </div>
                    <h3 className="display" style={{ fontSize: 22 }}>Strengths</h3>
                    <span className="ra-pill ra-pill-green" style={{ marginLeft: 'auto' }}>Positive</span>
                  </div>
                  <p className="ra-prose">{p.strengths || '—'}</p>
                </div>
                <div className="ra-card" style={{ padding: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div className="ra-icon-box" style={{ background: '#f59e0b20' }}>
                      <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
                    </div>
                    <h3 className="display" style={{ fontSize: 22 }}>Gaps</h3>
                    <span className="ra-pill ra-pill-amber" style={{ marginLeft: 'auto' }}>Action needed</span>
                  </div>
                  <p className="ra-prose">{p.improvements || '—'}</p>
                </div>
              </div>

              {/* market positioning */}
              <div className="ra-card" style={{ padding: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div className="ra-icon-box" style={{ background: '#06b6d420' }}>
                    <Globe size={18} style={{ color: '#06b6d4' }} />
                  </div>
                  <h3 className="display" style={{ fontSize: 26 }}>Market Positioning</h3>
                  <span className="ra-pill ra-pill-blue" style={{ marginLeft: 'auto' }}>2026</span>
                </div>
                <div className="ra-divider" style={{ marginBottom: 24 }} />
                <p className="ra-prose">{p.positioning || 'No market data extracted.'}</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── FULL RAW ANALYSIS ── */}
        <div className="ra-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: fullOpen ? 20 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="ra-icon-box" style={{ background: '#ffffff08' }}>
                <Award size={18} style={{ color: '#888899' }} />
              </div>
              <h3 className="display" style={{ fontSize: 22 }}>Raw Analysis</h3>
            </div>
            <button className="ra-section-btn" onClick={() => setFullOpen(o => !o)}>
              {fullOpen ? <><ChevronUp size={14} /> Collapse</> : <><ChevronDown size={14} /> Expand</>}
            </button>
          </div>

          <AnimatePresence>
            {fullOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div className="ra-divider" style={{ marginBottom: 20 }} />
                <div className="ra-prose" style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8, fontSize: 13 }}>
                  {analysis || 'No analysis data.'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </>
  );
};

export default ResumeAnalysis;
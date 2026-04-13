import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, TrendingUp, Briefcase, BookmarkCheck,
  Users, Target, Sparkles, FileText, Search,
  MessageSquare, Plus, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import ActivityFeed from '../components/ActivityFeed';
import JobRecommendations from '../components/JobRecommendations';
import ProfileProgress from '../components/ProfileProgress';
import toast, { Toaster } from 'react-hot-toast';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
  .dp-root { font-family: 'DM Sans', sans-serif; color: #f5f5f5; }
  .dp-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .03em; }

  .dp-card {
    background: #ffffff06; border: 1px solid #ffffff10;
    border-radius: 18px; padding: 24px; backdrop-filter: blur(24px);
  }

  .dp-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 999px; font-size: 12px;
    font-weight: 500; letter-spacing: .06em; text-transform: uppercase;
  }
  .dp-pill-lime  { background: #c6ff0018; color: #c6ff00; border: 1px solid #c6ff0030; }
  .dp-pill-green { background: #22c55e18; color: #22c55e; border: 1px solid #22c55e30; }

  .dp-select {
    padding: 9px 14px; background: #ffffff08; border: 1px solid #ffffff14;
    border-radius: 10px; color: #f5f5f5; font-family: 'DM Sans', sans-serif;
    font-size: 13px; cursor: pointer; outline: none; appearance: none;
  }
  .dp-select option { background: #12121a; }

  .dp-action-card {
    background: #ffffff06; border: 1px solid #ffffff0d;
    border-radius: 14px; padding: 20px; cursor: pointer;
    transition: border-color .2s, background .2s, transform .15s;
    display: flex; align-items: center; gap: 16px;
  }
  .dp-action-card:hover { border-color: #c6ff0030; background: #c6ff0005; transform: translateY(-2px); }

  .dp-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 20px; border-radius: 10px; font-size: 13px;
    font-weight: 600; cursor: pointer; border: none;
    font-family: 'DM Sans', sans-serif; transition: box-shadow .15s, transform .1s;
  }
  .dp-btn-lime { background: #c6ff00; color: #0a0a0f; }
  .dp-btn-lime:hover { box-shadow: 0 0 24px #c6ff0050; transform: translateY(-1px); }

  .dp-insight {
    padding: 14px 16px; border-radius: 12px;
    background: #ffffff05; border: 1px solid #ffffff0a;
    transition: border-color .2s;
  }
  .dp-insight:hover { border-color: #ffffff16; }

  .dp-bar-track { width: 100%; height: 5px; background: #ffffff0c; border-radius: 99px; overflow: hidden; }
  .dp-bar-fill  { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #c6ff00, #4f8aff); }

  .dp-divider { height: 1px; background: #ffffff0c; }
`;

/* ─── static data ─────────────────────────────────────────────────── */
const STATS = (d) => [
  { title: 'Profile Strength', value: d.profileStrength, unit: '%', change: +5,  icon: Target,    color: 'from-blue-500 to-blue-600',     description: 'Profile completeness' },
  { title: 'Jobs Applied',     value: d.jobsApplied,     unit: '',  change: +3,  icon: Briefcase, color: 'from-green-500 to-green-600',   description: 'This month' },
  { title: 'Profile Views',    value: d.profileViews,    unit: '',  change: +12, icon: Users,     color: 'from-purple-500 to-purple-600', description: 'Last 30 days' },
  { title: 'Avg Match Score',  value: d.avgMatchScore,   unit: '%', change: +8,  icon: TrendingUp, color: 'from-orange-500 to-orange-600', description: 'For viewed jobs' },
];

const QUICK_ACTIONS = (navigate) => [
  { title: 'Upload Resume',     sub: 'Update with latest CV',          icon: FileText,     accent: '#4f8aff', action: () => navigate('/') },
  { title: 'Search Jobs',       sub: 'Find your next opportunity',      icon: Search,       accent: '#22c55e', action: () => navigate('/jobs') },
  { title: 'Practice Interview',sub: 'AI-generated mock questions',     icon: MessageSquare,accent: '#8b5cf6', action: () => toast('Interview practice coming soon!') },
  { title: 'Skill Assessment',  sub: 'Test your technical skills',      icon: Brain,        accent: '#f97316', action: () => toast('Skill assessment coming soon!') },
];

const ACTIVITY = [
  { id: 1, type: 'job_view',        title: 'Viewed Senior Developer at TechCorp', description: 'Match score: 85%',        timestamp: '2 hours ago',  icon: Briefcase,    color: 'text-blue-400' },
  { id: 2, type: 'resume_analysis', title: 'Resume analysed successfully',         description: 'Found 15 technical skills',timestamp: '1 day ago',    icon: Brain,        color: 'text-green-400' },
  { id: 3, type: 'job_save',        title: 'Saved Frontend Developer position',    description: 'At StartupX',              timestamp: '2 days ago',   icon: BookmarkCheck,color: 'text-purple-400' },
  { id: 4, type: 'cover_letter',    title: 'Generated cover letter',               description: 'For React Developer role', timestamp: '3 days ago',   icon: MessageSquare,color: 'text-orange-400' },
];

/* stable random heights so bars don't re-randomise on every render */
const BAR_HEIGHTS = [62, 45, 78, 55, 88, 34, 70];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ═════════════════════════════════════════════════════════════════ */
const DashboardPage = () => {
  const navigate  = useNavigate();
  const [timeRange, setTimeRange] = useState('7d');

  // read from localStorage — keep as state so it's reactive
  const sessionId = localStorage.getItem('sessionId');
  const savedJobs = useMemo(() => JSON.parse(localStorage.getItem('savedJobs') || '[]'), []);

  const data = {
    profileStrength: 75, jobsApplied: 12,
    jobsViewed: 48, profileViews: 156,
    responseRate: 25, avgMatchScore: 82,
    skillsIdentified: 15, interviewsScheduled: 3,
  };

  const stats        = STATS(data);
  const quickActions = QUICK_ACTIONS(navigate);

  return (
    <>
      <style>{css}</style>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1c1c2a', color: '#f5f5f5', border: '1px solid #ffffff14', fontFamily: 'DM Sans, sans-serif' }
      }} />

      <div className="dp-root" style={{ minHeight: '100vh', paddingTop: 80, paddingBottom: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>

          {/* ── PAGE HEADER ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
              <div>
                <span className="dp-pill dp-pill-lime" style={{ marginBottom: 12, display: 'inline-flex' }}>
                  <Zap size={10} /> Dashboard
                </span>
                <h1 className="display" style={{ fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: .95, color: '#f5f5f5' }}>
                  Welcome back<span style={{ color: '#c6ff00' }}>.</span>
                </h1>
                <p style={{ fontSize: 15, color: '#888899', marginTop: 8 }}>Track your job search progress and next steps</p>
              </div>

              <div style={{ display: 'flex', align: 'center', gap: 10, flexWrap: 'wrap' }}>
                <select className="dp-select" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <button className="dp-btn dp-btn-lime">
                  <Plus size={14} /> New Application
                </button>
              </div>
            </div>

            {sessionId && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: '#22c55e10', border: '1px solid #22c55e25', borderRadius: 999 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'ping 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, color: '#22c55e' }}>AI Assistant Active</span>
                <Sparkles size={13} style={{ color: '#22c55e' }} />
              </div>
            )}
          </motion.div>

          {/* ── STATS ROW ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 40 }}>
            {stats.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 + i * .05 }}>
                <StatsCard stat={s} />
              </motion.div>
            ))}
          </motion.div>

          {/* ── MAIN GRID ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>

              {/* quick actions */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}>
                <h2 className="display" style={{ fontSize: 26, marginBottom: 16, color: '#f5f5f5' }}>Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {quickActions.map((qa, i) => {
                    const Icon = qa.icon;
                    return (
                      <motion.div key={qa.title} className="dp-action-card"
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 + i * .05 }}
                        onClick={qa.action} whileTap={{ scale: .97 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${qa.accent}18`, border: `1px solid ${qa.accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={18} style={{ color: qa.accent }} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: 14, color: '#e0e0ef', marginBottom: 2 }}>{qa.title}</p>
                          <p style={{ fontSize: 12, color: '#888899' }}>{qa.sub}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* job recommendations */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>
                <JobRecommendations sessionId={sessionId} />
              </motion.div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 }}>
                <ProfileProgress profileStrength={data.profileStrength} sessionId={sessionId} />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .4 }}>
                <ActivityFeed activities={ACTIVITY} />
              </motion.div>
            </div>
          </div>

        </div>
      </div>

      {/* responsive collapse right column */}
      <style>{`
        @media (max-width: 900px) {
          .dp-root > div > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

export default DashboardPage;
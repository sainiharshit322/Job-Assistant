import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, Circle, ArrowRight } from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
  .pp-root { font-family: 'DM Sans', sans-serif; }
  .pp-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .03em; }

  .pp-card {
    background: #ffffff06; border: 1px solid #ffffff10;
    border-radius: 18px; padding: 24px; backdrop-filter: blur(24px);
  }

  .pp-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; border-radius: 10px; transition: background .15s;
  }
  .pp-item:hover { background: #ffffff07; }

  .pp-next {
    padding: 14px 16px; border-radius: 12px;
    background: #c6ff0010; border: 1px solid #c6ff0025;
  }
`;

const PROGRESS_ITEMS = (sessionId) => [
  { label: 'Resume Uploaded',       completed: !!sessionId, points: 25 },
  { label: 'Skills Analyzed',       completed: !!sessionId, points: 20 },
  { label: 'Job Preferences Set',   completed: false,       points: 15 },
  { label: 'Portfolio Added',       completed: false,       points: 20 },
  { label: 'Professional Photo',    completed: false,       points: 10 },
  { label: 'Contact Info Verified', completed: false,       points: 10 },
];

const ProfileProgress = ({ profileStrength = 0, sessionId }) => {
  const items   = PROGRESS_ITEMS(sessionId);
  const nextItem = items.find(i => !i.completed);
  const R = 52, C = 60, CIRC = 2 * Math.PI * R;

  return (
    <>
      <style>{css}</style>
      <div className="pp-root pp-card">
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#c6ff0018', border: '1px solid #c6ff0030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Target size={16} style={{ color: '#c6ff00' }} />
          </div>
          <h3 className="display" style={{ fontSize: 22, color: '#f5f5f5' }}>Profile Strength</h3>
        </div>

        {/* circular progress — fixed SVG approach */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', width: C * 2, height: C * 2 }}>
            <svg width={C * 2} height={C * 2} style={{ transform: 'rotate(-90deg)' }}>
              {/* track */}
              <circle cx={C} cy={C} r={R} fill="none" stroke="#ffffff0f" strokeWidth={7} />
              {/* fill */}
              <motion.circle
                cx={C} cy={C} r={R}
                fill="none"
                stroke="#c6ff00"
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: CIRC * (1 - profileStrength / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            {/* center label */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span className="display" style={{ fontSize: 32, lineHeight: 1, color: '#f5f5f5' }}>{profileStrength}</span>
              <span style={{ fontSize: 11, color: '#888899', textTransform: 'uppercase', letterSpacing: '.08em' }}>%</span>
            </div>
          </div>
        </div>

        {/* items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 16 }}>
          {items.map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              className="pp-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {item.completed
                  ? <CheckCircle size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
                  : <Circle      size={15} style={{ color: '#333344', flexShrink: 0 }} />
                }
                <span style={{ fontSize: 13, fontWeight: 500, color: item.completed ? '#e0e0ef' : '#555566' }}>
                  {item.label}
                </span>
              </div>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 999,
                background: item.completed ? '#22c55e15' : '#ffffff08',
                color:      item.completed ? '#22c55e'   : '#444455',
                border:     `1px solid ${item.completed ? '#22c55e25' : '#ffffff0a'}`,
              }}>
                +{item.points}%
              </span>
            </motion.div>
          ))}
        </div>

        {/* next action nudge */}
        {nextItem && (
          <div className="pp-next">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 12, color: '#c6ff00', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>
                  Next step
                </p>
                <p style={{ fontSize: 13, color: '#e0e0ef' }}>{nextItem.label}</p>
                <p style={{ fontSize: 11, color: '#888899', marginTop: 2 }}>
                  +{nextItem.points}% profile strength
                </p>
              </div>
              <ArrowRight size={16} style={{ color: '#c6ff00', flexShrink: 0 }} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileProgress;
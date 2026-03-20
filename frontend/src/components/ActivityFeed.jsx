import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
  .af-root { font-family: 'DM Sans', sans-serif; }
  .af-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .03em; }

  .af-card {
    background: #ffffff06; border: 1px solid #ffffff10;
    border-radius: 18px; padding: 24px; backdrop-filter: blur(24px);
  }

  .af-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px; border-radius: 12px; cursor: default;
    transition: background .15s;
  }
  .af-item:hover { background: #ffffff07; }

  .af-dot-line {
    display: flex; flex-direction: column; align-items: center; gap: 0;
  }

  .af-view-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; margin-top: 8px; padding: 10px;
    background: transparent; border: 1px solid #ffffff10;
    border-radius: 10px; color: #888899; font-size: 13px;
    font-family: 'DM Sans', sans-serif; font-weight: 500;
    cursor: pointer; transition: background .15s, color .15s, border-color .15s;
  }
  .af-view-btn:hover { background: #ffffff08; color: #f5f5f5; border-color: #ffffff1e; }
`;

/* Maps the legacy Tailwind color classes to a hex accent */
const COLOR_MAP = {
  'text-blue-400':   '#4f8aff',
  'text-green-400':  '#22c55e',
  'text-purple-400': '#8b5cf6',
  'text-orange-400': '#f97316',
  'text-red-400':    '#ef4444',
  'text-yellow-400': '#f59e0b',
};

const ActivityFeed = ({ activities = [] }) => {
  return (
    <>
      <style>{css}</style>
      <div className="af-root af-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#c6ff0018', border: '1px solid #c6ff0030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={16} style={{ color: '#c6ff00' }} />
          </div>
          <h3 className="display" style={{ fontSize: 22, color: '#f5f5f5' }}>Recent Activity</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activities.map((activity, index) => {
            const accent = COLOR_MAP[activity.color] ?? '#888899';
            const Icon   = activity.icon;
            const isLast = index === activities.length - 1;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.07 }}
                style={{ display: 'flex', gap: 12 }}
              >
                {/* timeline spine */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} style={{ color: accent }} />
                  </div>
                  {!isLast && <div style={{ width: 1, flex: 1, minHeight: 16, background: '#ffffff0c', marginTop: 4 }} />}
                </div>

                {/* content */}
                <div className="af-item" style={{ flex: 1, padding: '10px 10px 14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#e0e0ef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {activity.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#888899', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                      {activity.description}
                    </p>
                    <p style={{ fontSize: 11, color: '#444455', marginTop: 4 }}>{activity.timestamp}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {activities.length === 0 && (
          <p style={{ textAlign: 'center', color: '#444455', fontSize: 13, padding: '24px 0' }}>No recent activity yet.</p>
        )}

        <button className="af-view-btn">
          View all activity <ArrowRight size={13} />
        </button>
      </div>
    </>
  );
};

export default ActivityFeed;
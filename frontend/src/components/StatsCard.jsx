import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
  .sc-root { font-family: 'DM Sans', sans-serif; }
  .sc-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .03em; }
  .sc-card {
    background: #ffffff06; border: 1px solid #ffffff10; border-radius: 18px;
    padding: 24px; backdrop-filter: blur(24px);
    transition: border-color .2s, box-shadow .2s;
    position: relative; overflow: hidden;
  }
  .sc-card:hover { border-color: #ffffff1e; box-shadow: 0 8px 40px #0008; }
`;

/* Map the old Tailwind gradient strings to a single accent hex for the icon box */
const GRADIENT_MAP = {
  'from-blue-500 to-blue-600':     '#4f8aff',
  'from-green-500 to-green-600':   '#22c55e',
  'from-purple-500 to-purple-600': '#8b5cf6',
  'from-orange-500 to-orange-600': '#f97316',
};

const StatsCard = ({ stat }) => {
  const isPositive = stat.change > 0;
  const accentColor = GRADIENT_MAP[stat.color] ?? '#c6ff00';

  return (
    <>
      <style>{css}</style>
      <motion.div
        className="sc-root sc-card"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: .98 }}
      >
        {/* subtle corner glow */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `${accentColor}18`, filter: 'blur(20px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          {/* icon */}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accentColor}20`, border: `1px solid ${accentColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <stat.icon size={20} style={{ color: accentColor }} />
          </div>

          {/* change badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: isPositive ? '#22c55e18' : '#ef444418',
            color: isPositive ? '#22c55e' : '#ef4444',
            border: `1px solid ${isPositive ? '#22c55e30' : '#ef444430'}`,
          }}>
            {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(stat.change)}{stat.unit}
          </div>
        </div>

        <div className="display" style={{ fontSize: 38, lineHeight: 1, color: '#f5f5f5', marginBottom: 4 }}>
          {stat.value}{stat.unit}
        </div>
        <p style={{ fontSize: 14, fontWeight: 500, color: '#ccccdd', marginBottom: 6 }}>{stat.title}</p>
        <p style={{ fontSize: 12, color: '#555566' }}>{stat.description}</p>
      </motion.div>
    </>
  );
};

export default StatsCard;
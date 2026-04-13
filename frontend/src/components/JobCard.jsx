import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Clock, DollarSign, Bookmark, BookmarkCheck,
  Building2, ExternalLink, TrendingUp, Calendar,
} from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
  .jc-root { font-family: 'DM Sans', sans-serif; }

  .jc-card {
    background: #ffffff06; border: 1px solid #ffffff0e;
    border-radius: 16px; padding: 20px; cursor: pointer;
    transition: border-color .2s, background .2s;
    position: relative; overflow: hidden;
  }
  .jc-card:hover     { border-color: #ffffff1c; background: #ffffff09; }
  .jc-card.selected  { border-color: #c6ff0055; background: #c6ff0008; box-shadow: 0 0 32px #c6ff0012; }

  .jc-save-btn {
    width: 34px; height: 34px; border-radius: 9px;
    background: #ffffff08; border: 1px solid #ffffff10;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0; transition: background .15s, border-color .15s;
  }
  .jc-save-btn:hover { background: #ffffff14; border-color: #ffffff20; }

  .jc-skill {
    display: inline-flex; padding: 4px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 500;
    background: #ffffff0a; color: #888899; border: 1px solid #ffffff0e;
    transition: border-color .15s;
  }
  .jc-card:hover .jc-skill { border-color: #ffffff18; }

  .jc-divider { height: 1px; background: #ffffff0a; }
`;

const scoreColor = (s) => {
  if (!s) return '#555566';
  if (s >= 0.8) return '#22c55e';
  if (s >= 0.6) return '#f59e0b';
  return '#f97316';
};
const scoreLabel = (s) => {
  if (!s) return null;
  if (s >= 0.8) return 'Excellent';
  if (s >= 0.6) return 'Good';
  return 'Fair';
};

/* fallback skills shown when job.skills is empty */
const FALLBACK_SKILLS = ['React', 'JavaScript', 'Node.js'];

const JobCard = ({ job, isSelected, isSaved, matchScore, onSelect, onSave, sessionId }) => {
  const skills = job.skills?.length ? job.skills.slice(0, 3) : FALLBACK_SKILLS;
  const color  = scoreColor(matchScore);

  return (
    <>
      <style>{css}</style>
      <motion.div
        className={`jc-root jc-card ${isSelected ? 'selected' : ''}`}
        onClick={onSelect}
        whileHover={{ y: -2 }}
        whileTap={{ scale: .99 }}
      >
        {/* selected accent line */}
        {isSelected && (
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#c6ff00', borderRadius: '16px 0 0 16px' }} />
        )}

        {/* ── HEADER ROW ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e0e0ef', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {job.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 size={12} style={{ color: '#888899', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#888899', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.company}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* match score badge */}
            {sessionId && matchScore !== undefined && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                background: `${color}18`, color, border: `1px solid ${color}30`,
              }}>
                <TrendingUp size={11} />
                {Math.round(matchScore * 100)}% {scoreLabel(matchScore)}
              </div>
            )}

            {/* save */}
            <div
              className="jc-save-btn"
              onClick={e => { e.stopPropagation(); onSave(); }}
            >
              {isSaved
                ? <BookmarkCheck size={15} style={{ color: '#c6ff00' }} />
                : <Bookmark      size={15} style={{ color: '#555566' }} />
              }
            </div>
          </div>
        </div>

        {/* ── META ROW ── */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { icon: MapPin,    val: job.location },
            { icon: Clock,     val: job.contract_type?.replace('_', ' ') },
            job.salary_display && { icon: DollarSign, val: job.salary_display },
            { icon: Calendar,  val: job.posted_date || 'Recently' },
          ].filter(Boolean).map(({ icon: Icon, val }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon size={12} style={{ color: '#555566', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#888899', textTransform: 'capitalize' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* ── DESCRIPTION PREVIEW ── */}
        <p style={{ fontSize: 13, color: '#aaaabc', lineHeight: 1.6, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {job.description}
        </p>

        {/* ── SKILL TAGS ── */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {skills.map((s, i) => <span key={i} className="jc-skill">{s}</span>)}
        </div>

        {/* ── FOOTER ── */}
        <div className="jc-divider" style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#444455', letterSpacing: '.04em', textTransform: 'uppercase' }}>
            {isSelected ? '● Viewing details' : 'Click to view details'}
          </span>
          {isSelected && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#c6ff00' }}>
              <ExternalLink size={11} /> Selected
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default JobCard;
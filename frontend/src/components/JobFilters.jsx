import React from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
  .jf-root { font-family: 'DM Sans', sans-serif; }
  .jf-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .03em; }

  .jf-card {
    background: #ffffff06; border: 1px solid #ffffff10;
    border-radius: 18px; padding: 24px; backdrop-filter: blur(24px);
  }

  .jf-label {
    display: block; font-size: 11px; font-weight: 600; color: #888899;
    text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px;
  }

  .jf-select, .jf-input {
    width: 100%; padding: 10px 12px;
    background: #ffffff08; border: 1px solid #ffffff12;
    border-radius: 10px; color: #f5f5f5; font-family: 'DM Sans', sans-serif;
    font-size: 13px; outline: none; transition: border-color .2s; appearance: none;
  }
  .jf-select:focus, .jf-input:focus { border-color: #c6ff0050; }
  .jf-select option { background: #12121a; }
  .jf-input::placeholder { color: #444455; }

  .jf-clear-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 9px; font-size: 12px; font-weight: 500;
    background: #ffffff08; border: 1px solid #ffffff12; color: #888899;
    cursor: pointer; transition: background .15s, color .15s;
    font-family: 'DM Sans', sans-serif;
  }
  .jf-clear-btn:hover { background: #ef444418; color: #ef4444; border-color: #ef444430; }

  .jf-toggle {
    position: relative; width: 40px; height: 22px; cursor: pointer; flex-shrink: 0;
  }
  .jf-toggle input { opacity: 0; width: 0; height: 0; }
  .jf-toggle-track {
    position: absolute; inset: 0; border-radius: 999px;
    background: #ffffff12; border: 1px solid #ffffff14;
    transition: background .2s, border-color .2s;
  }
  .jf-toggle input:checked + .jf-toggle-track { background: #c6ff00; border-color: #c6ff00; }
  .jf-toggle-thumb {
    position: absolute; top: 3px; left: 3px; width: 14px; height: 14px;
    border-radius: 50%; background: #888899; transition: transform .2s, background .2s;
  }
  .jf-toggle input:checked ~ .jf-toggle-thumb { transform: translateX(18px); background: #0a0a0f; }

  .jf-divider { height: 1px; background: #ffffff0a; }
`;

const JOB_TYPES    = [['', 'All Types'], ['full_time', 'Full Time'], ['part_time', 'Part Time'], ['contract', 'Contract'], ['freelance', 'Freelance'], ['internship', 'Internship']];
const EXP_LEVELS   = [['', 'All Levels'], ['entry', 'Entry Level'], ['junior', 'Junior'], ['mid', 'Mid Level'], ['senior', 'Senior'], ['lead', 'Lead / Principal']];
const SORT_OPTIONS = [['relevance', 'Most Relevant'], ['date', 'Most Recent'], ['salary_high', 'Salary: High → Low'], ['salary_low', 'Salary: Low → High']];

const JobFilters = ({ filters, setFilters }) => {
  const update = (key, val) => setFilters(p => ({ ...p, [key]: val }));
  const clear  = () => setFilters({ jobType: '', experienceLevel: '', salaryMin: '', salaryMax: '', remote: false, sortBy: 'relevance' });

  return (
    <>
      <style>{css}</style>
      <motion.div
        className="jf-root jf-card"
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#c6ff0018', border: '1px solid #c6ff0030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SlidersHorizontal size={16} style={{ color: '#c6ff00' }} />
            </div>
            <span className="display" style={{ fontSize: 22, color: '#f5f5f5' }}>Filters</span>
          </div>
          <button className="jf-clear-btn" onClick={clear}>
            <X size={12} /> Clear All
          </button>
        </div>

        <div className="jf-divider" style={{ marginBottom: 20 }} />

        {/* filter grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div>
            <label className="jf-label">Job Type</label>
            <select className="jf-select" value={filters.jobType} onChange={e => update('jobType', e.target.value)}>
              {JOB_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="jf-label">Experience</label>
            <select className="jf-select" value={filters.experienceLevel} onChange={e => update('experienceLevel', e.target.value)}>
              {EXP_LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="jf-label">Min Salary</label>
            <input className="jf-input" type="number" placeholder="50 000" value={filters.salaryMin} onChange={e => update('salaryMin', e.target.value)} />
          </div>
          <div>
            <label className="jf-label">Max Salary</label>
            <input className="jf-input" type="number" placeholder="150 000" value={filters.salaryMax} onChange={e => update('salaryMax', e.target.value)} />
          </div>
          <div>
            <label className="jf-label">Sort By</label>
            <select className="jf-select" value={filters.sortBy} onChange={e => update('sortBy', e.target.value)}>
              {SORT_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="jf-divider" style={{ marginBottom: 16 }} />

        {/* remote toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label className="jf-toggle">
            <input type="checkbox" checked={filters.remote} onChange={e => update('remote', e.target.checked)} />
            <div className="jf-toggle-track" />
            <div className="jf-toggle-thumb" />
          </label>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#e0e0ef' }}>Remote only</p>
            <p style={{ fontSize: 11, color: '#555566' }}>Show remote positions exclusively</p>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default JobFilters;
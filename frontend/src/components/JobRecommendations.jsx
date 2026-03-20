import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Building2, TrendingUp, ExternalLink, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
  .jr-root { font-family: 'DM Sans', sans-serif; }
  .jr-root .display { font-family: 'Bebas Neue', sans-serif; letter-spacing: .03em; }

  .jr-card {
    background: #ffffff06; border: 1px solid #ffffff10;
    border-radius: 18px; padding: 24px; backdrop-filter: blur(24px);
  }

  .jr-job {
    padding: 16px; border-radius: 14px;
    border: 1px solid #ffffff0c; background: #ffffff04;
    cursor: pointer; transition: border-color .2s, background .2s;
    position: relative; overflow: hidden;
  }
  .jr-job:hover { border-color: #c6ff0030; background: #c6ff0005; }

  .jr-score-high { color: #22c55e; }
  .jr-score-mid  { color: #f59e0b; }
  .jr-score-low  { color: #f97316; }

  .jr-tag {
    display: inline-flex; padding: 3px 9px; border-radius: 999px;
    font-size: 11px; font-weight: 500;
    background: #4f8aff18; color: #4f8aff; border: 1px solid #4f8aff28;
  }

  .jr-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    width: 100%; padding: 11px; border-radius: 10px; font-size: 13px;
    font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer;
    background: transparent; border: 1px solid #ffffff10; color: #888899;
    transition: background .15s, color .15s, border-color .15s;
  }
  .jr-btn:hover { background: #ffffff08; color: #f5f5f5; border-color: #ffffff1e; }
`;

const RECS = [
  {
    id: 1, title: 'Senior React Developer', company: 'TechCorp Inc.',
    location: 'San Francisco, CA', matchScore: 92, salary: '$120k – $150k',
    reasons: ['Perfect React experience', 'Leadership skills match'],
  },
  {
    id: 2, title: 'Full Stack Engineer', company: 'StartupX',
    location: 'Remote', matchScore: 87, salary: '$100k – $130k',
    reasons: ['Full-stack experience', 'Remote work preferred'],
  },
  {
    id: 3, title: 'Frontend Lead', company: 'DesignStudio',
    location: 'New York, NY', matchScore: 84, salary: '$110k – $140k',
    reasons: ['UI/UX skills', 'Team leadership'],
  },
];

const scoreClass = (s) => s >= 90 ? 'jr-score-high' : s >= 80 ? 'jr-score-mid' : 'jr-score-low';

const JobRecommendations = ({ sessionId }) => {
  const navigate = useNavigate();

  return (
    <>
      <style>{css}</style>
      <div className="jr-root jr-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#c6ff0018', border: '1px solid #c6ff0030', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} style={{ color: '#c6ff00' }} />
          </div>
          <h2 className="display" style={{ fontSize: 22, color: '#f5f5f5' }}>AI Recommendations</h2>
        </div>

        {sessionId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {RECS.map((job, idx) => (
              <motion.div
                key={job.id}
                className="jr-job"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -2 }}
              >
                {/* top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#e0e0ef' }}>{job.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                      <Building2 size={11} style={{ color: '#555566' }} />
                      <span style={{ fontSize: 12, color: '#888899' }}>{job.company}</span>
                    </div>
                  </div>
                  {/* match score */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} className={scoreClass(job.matchScore)}>
                    <TrendingUp size={13} />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{job.matchScore}%</span>
                  </div>
                </div>

                {/* meta row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={11} style={{ color: '#555566' }} />
                    <span style={{ fontSize: 12, color: '#888899' }}>{job.location}</span>
                  </div>
                  <span style={{ fontSize: 12, color: '#888899' }}>{job.salary}</span>
                </div>

                {/* reason tags */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {job.reasons.map((r, i) => <span key={i} className="jr-tag">{r}</span>)}
                </div>

                {/* CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => navigate('/jobs')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#c6ff00', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}
                  >
                    <ExternalLink size={11} /> View Details
                  </button>
                </div>
              </motion.div>
            ))}

            <button className="jr-btn" onClick={() => navigate('/jobs')}>
              See all job matches <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ffffff08', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Sparkles size={24} style={{ color: '#333344' }} />
            </div>
            <p style={{ color: '#888899', fontSize: 14, marginBottom: 20 }}>Upload your resume to get personalised recommendations</p>
            <button
              onClick={() => navigate('/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, background: '#c6ff00', color: '#0a0a0f', fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', border: 'none' }}
            >
              Get Started <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default JobRecommendations;
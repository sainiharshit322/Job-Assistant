import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle, AlertCircle } from 'lucide-react';

const ProfileProgress = ({ profileStrength, sessionId }) => {
  const progressItems = [
    { label: 'Resume Uploaded', completed: !!sessionId, points: 25 },
    { label: 'Skills Analyzed', completed: !!sessionId, points: 20 },
    { label: 'Job Preferences Set', completed: false, points: 15 },
    { label: 'Portfolio Added', completed: false, points: 20 },
    { label: 'Professional Photo', completed: false, points: 10 },
    { label: 'Contact Info Verified', completed: false, points: 10 }
  ];

  const completedItems = progressItems.filter(item => item.completed);
  const nextItem = progressItems.find(item => !item.completed);

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
          <Target className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">Profile Strength</h3>
      </div>

      {/* Progress Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
              animate={{ 
                strokeDashoffset: 2 * Math.PI * 56 * (1 - profileStrength / 100) 
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{profileStrength}%</div>
              <div className="text-white/60 text-xs">Complete</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Items */}
      <div className="space-y-3 mb-6">
        {progressItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              {item.completed ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-white/40" />
              )}
              <span className={`text-sm ${
                item.completed ? 'text-white' : 'text-white/60'
              }`}>
                {item.label}
              </span>
            </div>
            <span className="text-xs text-white/40">+{item.points}%</span>
          </motion.div>
        ))}
      </div>

      {/* Next Action */}
      {nextItem && (
        <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <p className="text-primary-300 text-sm font-medium mb-1">
            Next: {nextItem.label}
          </p>
          <p className="text-white/70 text-xs">
            Complete this to gain +{nextItem.points}% profile strength
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileProgress;

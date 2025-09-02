import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, MapPin, Building2, TrendingUp, ExternalLink } from 'lucide-react';

const JobRecommendations = ({ sessionId }) => {
  const [recommendations] = useState([
    {
      id: 1,
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      matchScore: 92,
      salary: '$120k - $150k',
      reasons: ['Perfect React experience', 'Leadership skills match', 'Salary expectations align']
    },
    {
      id: 2,
      title: 'Full Stack Engineer',
      company: 'StartupX',
      location: 'Remote',
      matchScore: 87,
      salary: '$100k - $130k',
      reasons: ['Full-stack experience', 'Startup environment fit', 'Remote work preferred']
    },
    {
      id: 3,
      title: 'Frontend Lead',
      company: 'DesignStudio',
      location: 'New York, NY',
      matchScore: 84,
      salary: '$110k - $140k',
      reasons: ['UI/UX skills', 'Team leadership', 'Design system experience']
    }
  ]);

  const getMatchColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">AI Job Recommendations</h2>
      </div>

      {sessionId ? (
        <div className="space-y-4">
          {recommendations.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold group-hover:text-primary-300 transition-colors">
                    {job.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-white/60 text-sm mt-1">
                    <Building2 className="h-3 w-3" />
                    <span>{job.company}</span>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-1 ${getMatchColor(job.matchScore)}`}>
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">{job.matchScore}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-white/70 mb-3">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{job.location}</span>
                </div>
                <span>{job.salary}</span>
              </div>

              <div className="space-y-1">
                <p className="text-white/60 text-xs">Why this matches:</p>
                <div className="flex flex-wrap gap-1">
                  {job.reasons.slice(0, 2).map((reason, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-primary-500/20 text-primary-300 text-xs rounded"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              </div>

              <motion.div
                className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.02 }}
              >
                <button className="flex items-center space-x-1 text-primary-400 hover:text-primary-300 text-sm">
                  <ExternalLink className="h-3 w-3" />
                  <span>View Details</span>
                </button>
              </motion.div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 text-white/30 mx-auto mb-3" />
          <p className="text-white/70 mb-4">Upload your resume to get personalized job recommendations</p>
          <motion.button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default JobRecommendations;

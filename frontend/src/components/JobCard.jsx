import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Bookmark, 
  BookmarkCheck,
  Building2,
  ExternalLink,
  TrendingUp,
  Calendar,
  Users
} from 'lucide-react';

const JobCard = ({ 
  job, 
  isSelected, 
  isSaved, 
  matchScore, 
  onSelect, 
  onSave, 
  sessionId 
}) => {
  const getMatchColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getMatchLabel = (score) => {
    if (!score) return 'No Match';
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    return 'Fair';
  };

  return (
    <motion.div
      onClick={onSelect}
      className={`glass rounded-xl p-6 cursor-pointer transition-all duration-200 hover-lift ${
        isSelected ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : ''
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
            {job.title}
          </h3>
          <div className="flex items-center space-x-2 text-primary-400 mb-2">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">{job.company}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Match Score */}
          {sessionId && matchScore !== undefined && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/10 ${getMatchColor(matchScore)}`}>
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-medium">
                {Math.round(matchScore * 100)}% {getMatchLabel(matchScore)}
              </span>
            </div>
          )}

          {/* Save Button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-primary-400" />
            ) : (
              <Bookmark className="h-5 w-5 text-white/40 hover:text-white/60" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Job Details */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm text-white/70">
        <div className="flex items-center space-x-1">
          <MapPin className="h-4 w-4" />
          <span>{job.location}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Users className="h-4 w-4" />
          <span className="capitalize">{job.contract_type?.replace('_', ' ')}</span>
        </div>
        
        {job.salary_display && (
          <div className="flex items-center space-x-1">
            <DollarSign className="h-4 w-4" />
            <span>{job.salary_display}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>{job.posted_date || 'Recently'}</span>
        </div>
      </div>

      {/* Job Description Preview */}
      <p className="text-white/80 text-sm line-clamp-2 mb-4">
        {job.description}
      </p>

      {/* Skills/Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.skills?.slice(0, 3).map((skill, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-md"
          >
            {skill}
          </span>
        )) || (
          // Generate some sample skills based on job title
          ['React', 'JavaScript', 'Node.js'].map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white/10 text-white/70 text-xs rounded-md"
            >
              {skill}
            </span>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center space-x-2 text-white/60 text-xs">
          <Clock className="h-3 w-3" />
          <span>Click to view details</span>
        </div>
        
        {isSelected && (
          <div className="flex items-center space-x-1 text-primary-400 text-xs">
            <ExternalLink className="h-3 w-3" />
            <span>Selected</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default JobCard;

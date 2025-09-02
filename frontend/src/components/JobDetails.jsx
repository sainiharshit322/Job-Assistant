import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Brain,
  FileText,
  MessageSquare,
  TrendingUp,
  Clock,
  Share2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { jobAssistantAPI } from '../services/api';
import toast from 'react-hot-toast';

const JobDetails = ({ job, matchAnalysis, sessionId, isSaved, onSave }) => {
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [isGeneratingTips, setIsGeneratingTips] = useState(false);
  const [expandedSection, setExpandedSection] = useState('description');
  const [coverLetter, setCoverLetter] = useState('');
  const [interviewTips, setInterviewTips] = useState('');

  const generateCoverLetter = async () => {
    if (!sessionId) {
      toast.error('Please upload your resume first');
      return;
    }

    setIsGeneratingCoverLetter(true);
    try {
      const response = await jobAssistantAPI.generateCoverLetter(sessionId);
      if (response.data.success) {
        setCoverLetter(response.data.cover_letter);
        toast.success('Cover letter generated successfully!');
      }
    } catch (error) {
      console.error('Cover letter generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate cover letter');
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  const generateInterviewTips = async () => {
    if (!sessionId) {
      toast.error('Please upload your resume first');
      return;
    }

    setIsGeneratingTips(true);
    try {
      const response = await jobAssistantAPI.generateInterviewTips(sessionId);
      if (response.data.success) {
        setInterviewTips(response.data.interview_tips);
        toast.success('Interview tips generated successfully!');
      }
    } catch (error) {
      console.error('Interview tips generation error:', error);
      toast.error(error.response?.data?.error || 'Failed to generate interview tips');
    } finally {
      setIsGeneratingTips(false);
    }
  };

  const getMatchColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getMatchIcon = (score) => {
    if (!score) return AlertTriangle;
    if (score >= 0.8) return CheckCircle;
    if (score >= 0.6) return Target;
    return AlertTriangle;
  };

  const sections = [
    { id: 'description', label: 'Job Description', icon: FileText },
    { id: 'match', label: 'Match Analysis', icon: Brain },
    { id: 'cover', label: 'Cover Letter', icon: MessageSquare },
    { id: 'interview', label: 'Interview Tips', icon: Sparkles }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
            <div className="flex items-center space-x-2 text-primary-400 mb-2">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{job.company}</span>
            </div>
          </div>

          <motion.button
            onClick={onSave}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-primary-400" />
            ) : (
              <Bookmark className="h-5 w-5 text-white/40" />
            )}
          </motion.button>
        </div>

        {/* Job Info */}
        <div className="grid grid-cols-1 gap-3 text-sm text-white/70">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>{job.location}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="capitalize">{job.contract_type?.replace('_', ' ')}</span>
          </div>
          
          {job.salary_display && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>{job.salary_display}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>{job.posted_date || 'Recently posted'}</span>
          </div>
        </div>

        {/* Match Score */}
        {sessionId && matchAnalysis && (
          <div className="mt-4 p-3 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className={`h-5 w-5 ${getMatchColor(matchAnalysis.score)}`} />
                <span className="text-white font-medium">Match Score</span>
              </div>
              <div className={`text-lg font-bold ${getMatchColor(matchAnalysis.score)}`}>
                {Math.round(matchAnalysis.score * 100)}%
              </div>
            </div>
            <div className="mt-2 w-full bg-white/10 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${
                  matchAnalysis.score >= 0.8 ? 'from-green-500 to-green-400' :
                  matchAnalysis.score >= 0.6 ? 'from-yellow-500 to-yellow-400' :
                  'from-orange-500 to-orange-400'
                }`}
                style={{ width: `${matchAnalysis.score * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <motion.button
            onClick={() => window.open(job.apply_url || '#', '_blank')}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ExternalLink className="h-4 w-4" />
            <span>Apply Now</span>
          </motion.button>
          
          <motion.button
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {sections.map((section) => (
            <motion.button
              key={section.id}
              onClick={() => setExpandedSection(section.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                expandedSection === section.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <section.icon className="h-4 w-4" />
              <span className="hidden sm:block">{section.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Job Description */}
          {expandedSection === 'description' && (
            <motion.div
              key="description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h4 className="text-lg font-semibold text-white mb-4">Job Description</h4>
              <div className="prose prose-invert text-white/80 text-sm">
                <pre className="whitespace-pre-wrap font-sans">
                  {job.full_description || job.description}
                </pre>
              </div>
            </motion.div>
          )}

          {/* Match Analysis */}
          {expandedSection === 'match' && (
            <motion.div
              key="match"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h4 className="text-lg font-semibold text-white mb-4">Match Analysis</h4>
              {sessionId ? (
                matchAnalysis ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-3">
                      {React.createElement(getMatchIcon(matchAnalysis.score), {
                        className: `h-5 w-5 ${getMatchColor(matchAnalysis.score)}`
                      })}
                      <span className={`font-medium ${getMatchColor(matchAnalysis.score)}`}>
                        {matchAnalysis.score >= 0.8 ? 'Excellent Match' :
                         matchAnalysis.score >= 0.6 ? 'Good Match' : 'Fair Match'}
                      </span>
                    </div>
                    <pre className="text-white/80 text-sm whitespace-pre-wrap font-sans">
                      {matchAnalysis.analysis}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 text-primary-400 animate-spin mx-auto mb-3" />
                    <p className="text-white/70">Analyzing job match...</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70 mb-4">Upload your resume to see match analysis</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Cover Letter */}
          {expandedSection === 'cover' && (
            <motion.div
              key="cover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Cover Letter</h4>
                {sessionId && (
                  <motion.button
                    onClick={generateCoverLetter}
                    disabled={isGeneratingCoverLetter}
                    className="flex items-center space-x-2 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isGeneratingCoverLetter ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>Generate</span>
                  </motion.button>
                )}
              </div>

              {coverLetter ? (
                <div className="space-y-4">
                  <pre className="text-white/80 text-sm whitespace-pre-wrap font-sans bg-white/5 p-4 rounded-lg">
                    {coverLetter}
                  </pre>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => navigator.clipboard.writeText(coverLetter)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      Copy
                    </motion.button>
                    <motion.button
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                      whileHover={{ scale: 1.05 }}
                    >
                      Download
                    </motion.button>
                  </div>
                </div>
              ) : sessionId ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70 mb-4">Generate a personalized cover letter for this job</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70 mb-4">Upload your resume to generate cover letters</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Interview Tips */}
          {expandedSection === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">Interview Tips</h4>
                {sessionId && (
                  <motion.button
                    onClick={generateInterviewTips}
                    disabled={isGeneratingTips}
                    className="flex items-center space-x-2 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isGeneratingTips ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                    <span>Generate</span>
                  </motion.button>
                )}
              </div>

              {interviewTips ? (
                <div className="space-y-4">
                  <pre className="text-white/80 text-sm whitespace-pre-wrap font-sans bg-white/5 p-4 rounded-lg">
                    {interviewTips}
                  </pre>
                  <motion.button
                    onClick={() => navigator.clipboard.writeText(interviewTips)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                    whileHover={{ scale: 1.05 }}
                  >
                    Copy Tips
                  </motion.button>
                </div>
              ) : sessionId ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70 mb-4">Get personalized interview preparation tips</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/70 mb-4">Upload your resume to get interview tips</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default JobDetails;

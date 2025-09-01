import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Brain,
  TrendingUp,
  Award,
  MapPin,
  Mail,
  Phone,
  Code,
  Briefcase,
  GraduationCap,
  Star,
  AlertTriangle,
  Globe,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Share2
} from 'lucide-react';
import toast from 'react-hot-toast';

const ResumeAnalysis = ({ analysis, filename }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // Parse analysis text into structured data (simplified parsing)
  const parseAnalysis = (analysisText) => {
    const sections = {
      personalInfo: '',
      skills: '',
      experience: '',
      education: '',
      strengths: '',
      improvements: '',
      positioning: ''
    };

    // Simple text parsing - in real app, you might want more sophisticated parsing
    const lines = analysisText.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.includes('PERSONAL INFORMATION')) currentSection = 'personalInfo';
      else if (line.includes('TECHNICAL SKILLS')) currentSection = 'skills';
      else if (line.includes('EXPERIENCE ANALYSIS')) currentSection = 'experience';
      else if (line.includes('EDUCATION')) currentSection = 'education';
      else if (line.includes('STRENGTHS')) currentSection = 'strengths';
      else if (line.includes('IMPROVEMENT')) currentSection = 'improvements';
      else if (line.includes('MARKET POSITIONING')) currentSection = 'positioning';
      else if (currentSection && line.trim()) {
        sections[currentSection] += line + '\n';
      }
    });

    return sections;
  };

  const parsedAnalysis = parseAnalysis(analysis);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'skills', name: 'Skills', icon: Code },
    { id: 'experience', name: 'Experience', icon: Briefcase },
    { id: 'insights', name: 'Insights', icon: Brain },
  ];

  const analysisCards = [
    {
      title: 'Skills Analysis',
      icon: Code,
      content: parsedAnalysis.skills,
      color: 'from-blue-500 to-purple-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Experience Overview',
      icon: Briefcase,
      content: parsedAnalysis.experience,
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Education & Certifications',
      icon: GraduationCap,
      content: parsedAnalysis.education,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Key Strengths',
      icon: Star,
      content: parsedAnalysis.strengths,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'Improvement Areas',
      icon: AlertTriangle,
      content: parsedAnalysis.improvements,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Market Positioning',
      icon: Globe,
      content: parsedAnalysis.positioning,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-500/10'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Resume Analysis</h2>
              <p className="text-white/70">{filename}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => copyToClipboard(analysis)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </motion.button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/5 rounded-xl p-1">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <tab.icon className="h-4 w-4" />
              <span className="font-medium">{tab.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {analysisCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6 hover-lift"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                </div>
                
                <div className="space-y-2">
                  <p className="text-white/80 text-sm line-clamp-4">
                    {card.content || 'Analysis content will appear here...'}
                  </p>
                  
                  <motion.button
                    onClick={() => toggleSection(card.title)}
                    className="flex items-center space-x-1 text-primary-400 hover:text-primary-300 text-sm transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <span>
                      {expandedSections[card.title] ? 'Show Less' : 'Read More'}
                    </span>
                    {expandedSections[card.title] ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {expandedSections[card.title] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <pre className="text-white/70 text-sm whitespace-pre-wrap">
                        {card.content}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'skills' && (
          <motion.div
            key="skills"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">Technical Skills Analysis</h3>
            <pre className="text-white/80 whitespace-pre-wrap">
              {parsedAnalysis.skills || 'Skills analysis will appear here...'}
            </pre>
          </motion.div>
        )}

        {activeTab === 'experience' && (
          <motion.div
            key="experience"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">Experience Analysis</h3>
            <pre className="text-white/80 whitespace-pre-wrap">
              {parsedAnalysis.experience || 'Experience analysis will appear here...'}
            </pre>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Key Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-green-400 mb-3">Strengths</h4>
                  <pre className="text-white/80 text-sm whitespace-pre-wrap">
                    {parsedAnalysis.strengths}
                  </pre>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-orange-400 mb-3">Areas for Improvement</h4>
                  <pre className="text-white/80 text-sm whitespace-pre-wrap">
                    {parsedAnalysis.improvements}
                  </pre>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Market Positioning</h3>
              <pre className="text-white/80 whitespace-pre-wrap">
                {parsedAnalysis.positioning}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Analysis */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Complete Analysis</h3>
          <motion.button
            onClick={() => toggleSection('fullAnalysis')}
            className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            <span>
              {expandedSections.fullAnalysis ? 'Collapse' : 'Expand'}
            </span>
            {expandedSections.fullAnalysis ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </motion.button>
        </div>

        <AnimatePresence>
          {expandedSections.fullAnalysis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <pre className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                {analysis}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ResumeAnalysis;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain,
  TrendingUp,
  Briefcase,
  BookmarkCheck,
  Users,
  Target,
  Sparkles,
  FileText,
  Search,
  MessageSquare,
  BarChart3,
  Star,
  Plus
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import ActivityFeed from '../components/ActivityFeed';
import JobRecommendations from '../components/JobRecommendations';
import ProfileProgress from '../components/ProfileProgress';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [sessionId] = useState(localStorage.getItem('sessionId'));
  const [savedJobs] = useState(JSON.parse(localStorage.getItem('savedJobs') || '[]'));
  const [dashboardData, setDashboardData] = useState({
    profileStrength: 75,
    jobsApplied: 12,
    jobsViewed: 48,
    profileViews: 156,
    responseRate: 25,
    avgMatchScore: 82,
    skillsIdentified: 15,
    interviewsScheduled: 3
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'job_view',
      title: 'Viewed Senior Developer at TechCorp',
      description: 'Match score: 85%',
      timestamp: '2 hours ago',
      icon: Briefcase,
      color: 'text-blue-400'
    },
    {
      id: 2,
      type: 'resume_analysis',
      title: 'Resume analyzed successfully',
      description: 'Found 15 technical skills',
      timestamp: '1 day ago',
      icon: Brain,
      color: 'text-green-400'
    },
    {
      id: 3,
      type: 'job_save',
      title: 'Saved Frontend Developer position',
      description: 'At StartupX',
      timestamp: '2 days ago',
      icon: BookmarkCheck,
      color: 'text-purple-400'
    },
    {
      id: 4,
      type: 'cover_letter',
      title: 'Generated cover letter',
      description: 'For React Developer role',
      timestamp: '3 days ago',
      icon: MessageSquare,
      color: 'text-orange-400'
    }
  ]);

  const stats = [
    {
      title: 'Profile Strength',
      value: dashboardData.profileStrength,
      unit: '%',
      change: +5,
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      description: 'Based on profile completeness'
    },
    {
      title: 'Jobs Applied',
      value: dashboardData.jobsApplied,
      unit: '',
      change: +3,
      icon: Briefcase,
      color: 'from-green-500 to-green-600',
      description: 'This month'
    },
    {
      title: 'Profile Views',
      value: dashboardData.profileViews,
      unit: '',
      change: +12,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      description: 'Last 30 days'
    },
    {
      title: 'Avg Match Score',
      value: dashboardData.avgMatchScore,
      unit: '%',
      change: +8,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      description: 'For viewed jobs'
    }
  ];

  const quickActions = [
    {
      title: 'Upload New Resume',
      description: 'Update your profile with latest resume',
      icon: FileText,
      color: 'from-blue-500 to-purple-500',
      action: () => window.location.href = '/'
    },
    {
      title: 'Search Jobs',
      description: 'Find your next opportunity',
      icon: Search,
      color: 'from-green-500 to-teal-500',
      action: () => window.location.href = '/jobs'
    },
    {
      title: 'Practice Interview',
      description: 'Prepare with AI-generated questions',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
      action: () => toast.info('Interview practice coming soon!')
    },
    {
      title: 'Skill Assessment',
      description: 'Test your technical skills',
      icon: Brain,
      color: 'from-orange-500 to-red-500',
      action: () => toast.info('Skill assessment coming soon!')
    }
  ];

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-white/70 text-lg">
                Here's your job search progress and recommendations
              </p>
            </div>

            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="7d" className="bg-gray-900">Last 7 days</option>
                <option value="30d" className="bg-gray-900">Last 30 days</option>
                <option value="90d" className="bg-gray-900">Last 90 days</option>
              </select>

              <motion.button
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="h-4 w-4" />
                <span>New Application</span>
              </motion.button>
            </div>
          </div>

          {/* Session Status */}
          {sessionId && (
            <div className="flex items-center space-x-2 px-4 py-2 glass rounded-xl w-fit">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm">AI Assistant Active</span>
              <Sparkles className="h-4 w-4 text-primary-400" />
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <StatsCard stat={stat} />
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    onClick={action.action}
                    className="glass rounded-xl p-6 cursor-pointer hover-lift group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color} group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-primary-300 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-white/70 text-sm">{action.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Job Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <JobRecommendations sessionId={sessionId} />
            </motion.div>

            {/* Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Activity Overview</h2>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary-400" />
                  <span className="text-white/60 text-sm">Last 7 days</span>
                </div>
              </div>

              {/* Simple Chart Placeholder */}
              <div className="space-y-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const height = Math.random() * 100 + 20;
                  return (
                    <div key={day} className="flex items-center space-x-4">
                      <span className="text-white/60 text-sm w-8">{day}</span>
                      <div className="flex-1 bg-white/10 rounded-full h-6 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${height}%` }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                        />
                      </div>
                      <span className="text-white/40 text-xs w-8">{Math.round(height/10)}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Profile Progress */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ProfileProgress profileStrength={dashboardData.profileStrength} sessionId={sessionId} />
            </motion.div>

            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <ActivityFeed activities={recentActivity} />
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">AI Insights</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-white font-medium text-sm">Top Skill</span>
                  </div>
                  <p className="text-white/70 text-sm">React.js appears in 85% of your target jobs</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-white font-medium text-sm">Trending</span>
                  </div>
                  <p className="text-white/70 text-sm">Full-stack roles are up 23% this month</p>
                </div>

                <div className="p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-blue-400" />
                    <span className="text-white font-medium text-sm">Recommendation</span>
                  </div>
                  <p className="text-white/70 text-sm">Add TypeScript to boost match scores by 15%</p>
                </div>
              </div>
            </motion.div>

            {/* Saved Jobs Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Saved Jobs</h3>
                <BookmarkCheck className="h-5 w-5 text-primary-400" />
              </div>

              <div className="text-center py-6">
                <div className="text-3xl font-bold text-white mb-2">
                  {savedJobs.length}
                </div>
                <p className="text-white/70 text-sm mb-4">Jobs saved for later</p>
                
                <motion.button
                  onClick={() => window.location.href = '/jobs'}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View All
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

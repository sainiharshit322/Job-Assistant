import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  SlidersHorizontal,
  Briefcase,
  Brain,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import JobCard from '../components/JobCard';
import JobFilters from '../components/JobFilters';
import JobDetails from '../components/JobDetails';
import { jobAssistantAPI } from '../services/api';
import toast from 'react-hot-toast';

const JobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId'));
  const [matchAnalysis, setMatchAnalysis] = useState({});
  const [savedJobs, setSavedJobs] = useState(new Set());
  
  const [filters, setFilters] = useState({
    jobType: '',
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
    remote: false,
    sortBy: 'relevance'
  });

useEffect(() => {
  // Auto-search when coming from homepage
  const shouldAutoSearch = localStorage.getItem('autoSearch');
  const defaultQuery = localStorage.getItem('defaultSearchQuery');
  
  if (shouldAutoSearch === 'true' && sessionId && defaultQuery) {
    setSearchQuery(defaultQuery);
    // Clear the flags
    localStorage.removeItem('autoSearch');
    localStorage.removeItem('defaultSearchQuery');
    
    // Trigger search automatically
    handleSearchWithQuery(defaultQuery);
  }
}, [sessionId]);

// Add this helper function before the return statement
const handleSearchWithQuery = async (query) => {
  if (!sessionId) {
    toast.error('Please upload your resume first to search for jobs');
    return;
  }

  if (!query.trim()) {
    toast.error('Please enter a search query');
    return;
  }

  setIsLoading(true);
  try {
    const response = await jobAssistantAPI.searchJobs(sessionId, query);
    
    if (response.data.success) {
      setJobs(response.data.jobs);
      setFilteredJobs(response.data.jobs);
      setLocation(response.data.location);
      toast.success(`Found ${response.data.jobs.length} jobs matching your profile!`);
    }
  } catch (error) {
    console.error('Search error:', error);
    toast.error(error.response?.data?.error || 'Failed to search jobs');
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
    // Load saved jobs from localStorage
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    setSavedJobs(new Set(saved));
  }, []);

  const handleSearch = async () => {
    if (!sessionId) {
      toast.error('Please upload your resume first to search for jobs');
      return;
    }

    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsLoading(true);
    try {
      const response = await jobAssistantAPI.searchJobs(sessionId, searchQuery);
      
      if (response.data.success) {
        setJobs(response.data.jobs);
        setFilteredJobs(response.data.jobs);
        setLocation(response.data.location);
        toast.success(`Found ${response.data.jobs.length} jobs`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.error || 'Failed to search jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    
    // Get match analysis if we have a session
    if (sessionId) {
      try {
        const response = await jobAssistantAPI.analyzeMatch(sessionId, job.id);
        if (response.data.success) {
          setMatchAnalysis({
            ...matchAnalysis,
            [job.id]: {
              score: response.data.match_score,
              analysis: response.data.match_analysis
            }
          });
        }
      } catch (error) {
        console.error('Match analysis error:', error);
      }
    }
  };

  const handleSaveJob = (jobId) => {
    const newSavedJobs = new Set(savedJobs);
    if (savedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
      toast.success('Job removed from saved list');
    } else {
      newSavedJobs.add(jobId);
      toast.success('Job saved successfully');
    }
    setSavedJobs(newSavedJobs);
    localStorage.setItem('savedJobs', JSON.stringify([...newSavedJobs]));
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    if (filters.jobType) {
      filtered = filtered.filter(job => 
        job.contract_type.toLowerCase().includes(filters.jobType.toLowerCase())
      );
    }

    if (filters.salaryMin) {
      filtered = filtered.filter(job => 
        !job.salary_min || job.salary_min >= parseInt(filters.salaryMin)
      );
    }

    if (filters.salaryMax) {
      filtered = filtered.filter(job => 
        !job.salary_max || job.salary_max <= parseInt(filters.salaryMax)
      );
    }

    if (filters.remote) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes('remote') || 
        job.contract_type.toLowerCase().includes('remote')
      );
    }

    // Sort jobs
    if (filters.sortBy === 'salary_high') {
      filtered.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0));
    } else if (filters.sortBy === 'salary_low') {
      filtered.sort((a, b) => (a.salary_min || 0) - (b.salary_min || 0));
    } else if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.posted_date) - new Date(a.posted_date));
    }

    setFilteredJobs(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filters, jobs]);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Find Your Dream Job</h1>
              <p className="text-white/70 text-lg">
                {jobs.length > 0 ? `${filteredJobs.length} jobs found` : 'Search for jobs tailored to your profile'}
              </p>
            </div>
            
            {sessionId && (
              <div className="flex items-center space-x-2 px-4 py-2 glass rounded-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white/80 text-sm">Resume Analyzed</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="glass rounded-2xl p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Job title, skills, or company"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full md:w-64 pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <motion.button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <SlidersHorizontal className="h-5 w-5" />
                  <span className="hidden sm:block">Filters</span>
                </motion.button>

                <motion.button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLoading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                  <span>Search</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <JobFilters filters={filters} setFilters={setFilters} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Jobs List */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="glass rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-white/20 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-white/10 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-white/10 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : filteredJobs.length > 0 ? (
              <AnimatePresence>
                {filteredJobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <JobCard
                      job={job}
                      isSelected={selectedJob?.id === job.id}
                      isSaved={savedJobs.has(job.id)}
                      matchScore={matchAnalysis[job.id]?.score}
                      onSelect={() => handleJobSelect(job)}
                      onSave={() => handleSaveJob(job.id)}
                      sessionId={sessionId}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : jobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-12 text-center"
              >
                <div className="mb-6">
                  <div className="p-4 rounded-full bg-primary-500/20 inline-block mb-4">
                    <Search className="h-12 w-12 text-primary-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Ready to Find Your Next Role?</h3>
                  <p className="text-white/70">
                    {sessionId 
                      ? 'Enter a job title or skill to start searching for personalized job matches'
                      : 'Upload your resume first to get AI-powered job recommendations'
                    }
                  </p>
                </div>
                
                {!sessionId && (
                  <motion.button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Brain className="h-5 w-5" />
                    <span>Upload Resume</span>
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-8 text-center"
              >
                <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No jobs match your filters</h3>
                <p className="text-white/70 mb-4">Try adjusting your search criteria or filters</p>
                <motion.button
                  onClick={() => setFilters({
                    jobType: '',
                    experienceLevel: '',
                    salaryMin: '',
                    salaryMax: '',
                    remote: false,
                    sortBy: 'relevance'
                  })}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Clear Filters
                </motion.button>
              </motion.div>
            )}
          </div>

          {/* Job Details */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {selectedJob ? (
                <JobDetails
                  job={selectedJob}
                  matchAnalysis={matchAnalysis[selectedJob.id]}
                  sessionId={sessionId}
                  isSaved={savedJobs.has(selectedJob.id)}
                  onSave={() => handleSaveJob(selectedJob.id)}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-8 text-center"
                >
                  <div className="p-4 rounded-full bg-white/10 inline-block mb-4">
                    <Briefcase className="h-8 w-8 text-white/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Select a Job</h3>
                  <p className="text-white/70 text-sm">
                    Click on a job from the list to view details and get AI-powered match analysis
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;

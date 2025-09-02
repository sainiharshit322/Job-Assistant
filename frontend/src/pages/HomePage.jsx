import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Add this import
import { 
  Brain, 
  Sparkles, 
  ArrowRight, 
  CheckCircle,
  Users,
  Award,
  Globe,
  Zap,
  Target,
  TrendingUp,
  Search,
  FileText,
  MessageSquare
} from 'lucide-react';
import ResumeUpload from '../components/ResumeUpload';
import ResumeAnalysis from '../components/ResumeAnalysis';
import { jobAssistantAPI } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const HomePage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisData, setAnalysisData] = useState(null);
  const [apiStatus, setApiStatus] = useState('checking');
  const navigate = useNavigate(); // Add this hook

  useEffect(() => {
    checkAPIStatus();
    // Check if we have existing session data
    const existingSessionId = localStorage.getItem('sessionId');
    const existingAnalysis = localStorage.getItem('resumeAnalysis');
    const existingFilename = localStorage.getItem('resumeFilename');
    
    if (existingSessionId && existingAnalysis) {
      setAnalysisData({
        sessionId: existingSessionId,
        analysis: existingAnalysis,
        filename: existingFilename || 'Previous Resume'
      });
      setCurrentStep(2);
    }
  }, []);

  const checkAPIStatus = async () => {
    try {
      await jobAssistantAPI.healthCheck();
      setApiStatus('online');
    } catch (error) {
      console.error('API health check failed:', error);
      setApiStatus('offline');
      toast.error('Backend service is offline. Please start the Flask server.');
    }
  };

  const handleAnalysisComplete = (data) => {
    // Store data in localStorage for persistence
    localStorage.setItem('sessionId', data.sessionId);
    localStorage.setItem('resumeAnalysis', data.analysis);
    localStorage.setItem('resumeFilename', data.filename);
    
    setAnalysisData(data);
    setCurrentStep(2);
    toast.success('Resume analysis completed!');
  };

  const handleFindJobs = () => {
    if (!analysisData || !analysisData.sessionId) {
      toast.error('Please complete resume analysis first');
      return;
    }

    localStorage.setItem('autoSearch', 'true'); 
    localStorage.setItem('defaultSearchQuery', 'developer'); 
    
    navigate('/jobs');
    toast.success('Redirecting to job search...');
  };

  const steps = [
    { number: 1, title: 'Upload Resume', description: 'Upload your PDF resume for AI analysis' },
    { number: 2, title: 'Get Analysis', description: 'Receive detailed insights about your profile' },
    { number: 3, title: 'Find Jobs', description: 'Discover matching job opportunities' },
    { number: 4, title: 'Apply Smart', description: 'Generate cover letters and prep for interviews' }
  ];

  return (
    <div className="min-h-screen">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      />

      {/* Hero Section */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-2xl"
                >
                  <Brain className="h-12 w-12 text-white" />
                </motion.div>
              </div>

              <h1 className="text-5xl md:text-7xl font-black mb-6">
                <span className="gradient-text">AI Job Assistant</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                Transform your job search with AI-powered resume analysis, 
                personalized job matching, and intelligent career guidance
              </p>
            </motion.div>

            {/* API Status Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex justify-center mb-8"
            >
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full glass ${
                apiStatus === 'online' ? 'border-green-500/50' : 
                apiStatus === 'offline' ? 'border-red-500/50' : 'border-yellow-500/50'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus === 'online' ? 'bg-green-500 animate-pulse' : 
                  apiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                }`} />
                <span className="text-sm text-white/80">
                  {apiStatus === 'online' ? 'AI Service Online' : 
                   apiStatus === 'offline' ? 'Service Offline' : 'Checking Service...'}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Get started with our AI-powered job assistant in just a few simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative text-center ${
                  currentStep >= step.number ? 'opacity-100' : 'opacity-70'
                }`}
              >
                <div className={`relative z-10 glass rounded-2xl p-6 hover-lift ${
                  currentStep === step.number ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/20' : ''
                }`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    currentStep >= step.number 
                      ? 'bg-gradient-to-br from-primary-500 to-accent-500' 
                      : 'bg-white/10'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-8 w-8 text-white" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{step.number}</span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-white/70 text-sm">{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-0">
                    <ArrowRight className="h-6 w-6 text-white/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Action Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Upload Your Resume
                  </h2>
                  <p className="text-white/70 text-lg">
                    Get started by uploading your resume for AI-powered analysis
                  </p>
                </div>
                <ResumeUpload onAnalysisComplete={handleAnalysisComplete} />
              </motion.div>
            )}

            {currentStep === 2 && analysisData && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Your Resume Analysis
                  </h2>
                  <p className="text-white/70 text-lg">
                    Here's what our AI discovered about your profile
                  </p>
                </div>
                <ResumeAnalysis 
                  analysis={analysisData.analysis} 
                  filename={analysisData.filename}
                />
                
                <div className="mt-8 text-center space-y-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFindJobs}
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    <span>Find Matching Jobs</span>
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                  
                  <div className="text-white/60 text-sm">
                    We'll search for jobs that match your profile and skills
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

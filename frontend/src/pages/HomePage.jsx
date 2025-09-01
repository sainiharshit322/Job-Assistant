import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    checkAPIStatus();
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
    setAnalysisData(data);
    setCurrentStep(2);
    toast.success('Resume analysis completed!');
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI analyzes your resume to identify strengths, skills, and improvement areas.',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: Search,
      title: 'Smart Job Matching',
      description: 'Find the most relevant jobs based on your profile and career goals.',
      color: 'from-green-500 to-teal-600'
    },
    {
      icon: FileText,
      title: 'Cover Letter Generator',
      description: 'Generate personalized cover letters tailored to specific job applications.',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: MessageSquare,
      title: 'Interview Preparation',
      description: 'Get customized interview tips and practice questions for your target roles.',
      color: 'from-orange-500 to-red-600'
    }
  ];

  const stats = [
    { icon: Users, value: '50K+', label: 'Users Helped', color: 'text-blue-400' },
    { icon: Award, value: '95%', label: 'Success Rate', color: 'text-green-400' },
    { icon: Globe, value: '150+', label: 'Countries', color: 'text-purple-400' },
    { icon: Zap, value: '24/7', label: 'AI Support', color: 'text-orange-400' }
  ];

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

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  className="glass rounded-xl p-6 hover-lift"
                >
                  <div className="flex flex-col items-center">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-white/10 to-white/5 mb-3">
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-white/60">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
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
                
                <div className="mt-8 text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentStep(3)}
                    className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                  >
                    <span>Find Matching Jobs</span>
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Everything you need to supercharge your job search with AI
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass rounded-2xl p-6 hover-lift group"
              >
                <div className={`p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="glass rounded-3xl p-12"
          >
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="p-4 rounded-full bg-gradient-to-br from-primary-500 to-accent-500"
              >
                <Sparkles className="h-12 w-12 text-white" />
              </motion.div>
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Job Search?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have found their dream jobs 
              with our AI-powered assistance. Your next career breakthrough awaits.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                document.querySelector('#fileInput')?.click();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-lg font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <Brain className="h-6 w-6" />
              <span>Start Your Analysis</span>
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

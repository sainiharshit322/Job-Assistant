import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  X,
  Brain,
  Sparkles,
  Download,
  Eye,
  Loader2,
  Cloud,
  Shield
} from 'lucide-react';
import { jobAssistantAPI } from '../services/api';
import toast from 'react-hot-toast';

const ResumeUpload = ({ onAnalysisComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only');
      toast.error('Only PDF files are supported');
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      setError('File size must be less than 16MB');
      toast.error('File too large. Maximum size is 16MB');
      return;
    }

    setUploadedFile(file);
    setError(null);
    uploadResume(file);
  };

  const uploadResume = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await jobAssistantAPI.uploadResume(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        setSessionId(response.data.session_id);
        setAnalysis(response.data.resume_analysis);
        
        toast.success('Resume analyzed successfully!');
        
        if (onAnalysisComplete) {
          onAnalysisComplete({
            sessionId: response.data.session_id,
            analysis: response.data.resume_analysis,
            filename: response.data.filename
          });
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload resume');
      toast.error(err.response?.data?.error || 'Failed to upload resume');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setAnalysis(null);
    setSessionId(null);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
            ${dragActive ? 'border-primary-400 bg-primary-50/10 scale-105' : 'border-white/30 hover:border-white/50'}
            ${uploadedFile && !isUploading ? 'border-green-400 bg-green-50/10' : ''}
            ${error ? 'border-red-400 bg-red-50/10' : ''}
            glass hover-lift
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !uploadedFile && document.getElementById('fileInput').click()}
        >
          {/* Background Effects */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute top-4 right-4 w-20 h-20 bg-primary-500/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-accent-500/10 rounded-full blur-xl animate-pulse" />
          </div>

          <div className="relative z-10">
            {!uploadedFile ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="space-y-4"
              >
                <div className="flex justify-center">
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0] 
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }}
                    className="p-6 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 backdrop-blur-sm"
                  >
                    <Cloud className="h-12 w-12 text-white" />
                  </motion.div>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Upload Your Resume
                  </h3>
                  <p className="text-white/70 mb-4">
                    Drag and drop your PDF resume here, or click to browse
                  </p>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                  >
                    <Upload className="h-5 w-5" />
                    <span>Choose File</span>
                  </motion.button>
                </div>

                <div className="flex items-center justify-center space-x-6 text-sm text-white/60">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>Secure Upload</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>PDF Only</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Brain className="h-4 w-4" />
                    <span>AI Analysis</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="p-3 rounded-full bg-green-500/20">
                    <FileText className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-medium">{uploadedFile.name}</h4>
                    <p className="text-white/60 text-sm">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile();
                    }}
                    className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>Analyzing resume...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>

          <input
            id="fileInput"
            type="file"
            accept="application/pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center space-x-2 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
            >
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Loading State */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6 text-center"
          >
            <div className="flex flex-col items-center space-y-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="p-4 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20"
              >
                <Brain className="h-8 w-8 text-white" />
              </motion.div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  AI is analyzing your resume...
                </h3>
                <p className="text-white/70 text-sm">
                  This may take a few seconds. We're extracting key information and skills.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-sm text-white/60">
                <Sparkles className="h-4 w-4" />
                <span>Powered by Advanced AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success State */}
      <AnimatePresence>
        {uploadedFile && !isUploading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 rounded-full bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Resume uploaded successfully!
              </h3>
            </div>
            
            <p className="text-white/70 mb-4">
              Your resume has been analyzed and is ready for job matching. 
              You can now search for jobs or view your detailed analysis.
            </p>

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>View Analysis</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResumeUpload;

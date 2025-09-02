import React from 'react';
import { motion } from 'framer-motion';
import { X, SlidersHorizontal } from 'lucide-react';

const JobFilters = ({ filters, setFilters }) => {
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      jobType: '',
      experienceLevel: '',
      salaryMin: '',
      salaryMax: '',
      remote: false,
      sortBy: 'relevance'
    });
  };

  const jobTypes = [
    { value: '', label: 'All Types' },
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'internship', label: 'Internship' }
  ];

  const experienceLevels = [
    { value: '', label: 'All Levels' },
    { value: 'entry', label: 'Entry Level' },
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead/Principal' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'date', label: 'Most Recent' },
    { value: 'salary_high', label: 'Salary: High to Low' },
    { value: 'salary_low', label: 'Salary: Low to High' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="h-5 w-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        
        <motion.button
          onClick={clearFilters}
          className="flex items-center space-x-1 px-3 py-1 text-sm text-white/70 hover:text-white transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="h-4 w-4" />
          <span>Clear All</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Job Type
          </label>
          <select
            value={filters.jobType}
            onChange={(e) => updateFilter('jobType', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {jobTypes.map((type) => (
              <option key={type.value} value={type.value} className="bg-gray-900">
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Experience
          </label>
          <select
            value={filters.experienceLevel}
            onChange={(e) => updateFilter('experienceLevel', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {experienceLevels.map((level) => (
              <option key={level.value} value={level.value} className="bg-gray-900">
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Salary Min */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Min Salary
          </label>
          <input
            type="number"
            placeholder="50000"
            value={filters.salaryMin}
            onChange={(e) => updateFilter('salaryMin', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Salary Max */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Max Salary
          </label>
          <input
            type="number"
            placeholder="150000"
            value={filters.salaryMax}
            onChange={(e) => updateFilter('salaryMax', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-gray-900">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Remote Work Toggle */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.remote}
            onChange={(e) => updateFilter('remote', e.target.checked)}
            className="w-4 h-4 text-primary-500 bg-white/10 border-white/20 rounded focus:ring-primary-500 focus:ring-2"
          />
          <span className="text-white/80">Remote work only</span>
        </label>
      </div>
    </motion.div>
  );
};

export default JobFilters;

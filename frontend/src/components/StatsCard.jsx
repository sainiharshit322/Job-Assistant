import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

const StatsCard = ({ stat }) => {
  const isPositive = stat.change > 0;

  return (
    <motion.div
      className="glass rounded-2xl p-6 hover-lift"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
          <stat.icon className="h-6 w-6 text-white" />
        </div>
        
        <div className={`flex items-center space-x-1 text-sm ${
          isPositive ? 'text-green-400' : 'text-red-400'
        }`}>
          {isPositive ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
          <span className="font-medium">
            {Math.abs(stat.change)}{stat.unit}
          </span>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold text-white mb-1">
          {stat.value}{stat.unit}
        </div>
        <h3 className="text-white/80 font-medium">{stat.title}</h3>
      </div>

      <p className="text-white/60 text-sm">{stat.description}</p>
    </motion.div>
  );
};

export default StatsCard;

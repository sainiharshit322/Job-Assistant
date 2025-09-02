import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const ActivityFeed = ({ activities }) => {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Clock className="h-5 w-5 text-primary-400" />
        <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className={`p-2 rounded-lg bg-white/10 ${activity.color}`}>
              <activity.icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm line-clamp-1">
                {activity.title}
              </p>
              <p className="text-white/60 text-xs line-clamp-1">
                {activity.description}
              </p>
              <p className="text-white/40 text-xs mt-1">
                {activity.timestamp}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        className="w-full mt-4 py-2 text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
        whileHover={{ scale: 1.02 }}
      >
        View All Activity
      </motion.button>
    </div>
  );
};

export default ActivityFeed;

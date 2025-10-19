import React from 'react';

const DashboardSkeleton = ({ isNewUser = false }) => {
  if (isNewUser) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Celebration Card Skeleton */}
        <div className="bg-gray-200 rounded-2xl p-8 h-32"></div>
        
        {/* Status Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-xl p-6 h-32"></div>
          ))}
        </div>
        
        {/* Next Steps Skeleton */}
        <div className="bg-gray-200 rounded-xl p-8 h-64"></div>
        
        {/* Performance Preview Skeleton */}
        <div className="bg-gray-200 rounded-xl p-8 h-32"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-pulse">
      {/* Welcome Section Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
      
      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 rounded-xl p-6 h-32"></div>
        ))}
      </div>
      
      {/* Efficiency Calculator Skeleton */}
      <div className="bg-gray-200 rounded-xl p-6 h-48"></div>
      
      {/* Automation Management Skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-xl p-6 h-32"></div>
          ))}
        </div>
      </div>
      
      {/* Recent Activity Skeleton */}
      <div className="bg-gray-200 rounded-xl p-6 h-64"></div>
    </div>
  );
};

export default DashboardSkeleton;


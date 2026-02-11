
import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
      <div className="space-y-6">
        <div className="h-20 bg-slate-100 rounded"></div>
        <div className="h-20 bg-slate-100 rounded"></div>
        <div className="h-32 bg-slate-100 rounded"></div>
      </div>
    </div>
  );
};

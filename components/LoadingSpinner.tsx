import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center space-x-2 animate-pulse">
    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
  </div>
);

import React from 'react';

export const LoadingIndicator: React.FC = () => {
  return (
    <div className="w-full max-w-3xl flex flex-col items-center justify-center p-8 rounded-lg mt-6 text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
      <p className="text-white text-lg mt-6 font-semibold">
        Fetching YouTube Data...
      </p>
      <p className="text-gray-400 text-sm mt-2">
        This might take a moment.
      </p>
    </div>
  );
};

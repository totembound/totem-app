import React from 'react';
import { Link } from 'react-router-dom';

export const ComingSoon: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/tb-logo-180.png" alt="TotemBound" className="h-12 w-12" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Coming Soon
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            We're building something amazing.
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sign-ups opening soon.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;

/**
 * Login Button Component
 *
 * Simple login/signup buttons for unauthenticated users.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export const LoginButton: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/login"
        className="flex items-center gap-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium transition-colors"
      >
        <LogIn size={18} />
        <span className="hidden sm:block">Sign In</span>
      </Link>
      <Link
        to="/signup"
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
      >
        <UserPlus size={18} />
        <span className="hidden md:block">Sign Up</span>
        <span className="block md:hidden">Join</span>
      </Link>
    </div>
  );
};

export default LoginButton;

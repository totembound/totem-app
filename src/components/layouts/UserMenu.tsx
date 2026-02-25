/**
 * User Menu Component
 *
 * Dropdown menu for authenticated users.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { User, LogOut, Settings, ChevronDown, Sparkles, Gem, Shield, GraduationCap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CURRENCY_NAMES } from '../../config/constants';

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { essenceBalance, gemsBalance, tutorialWizardVisible, setTutorialWizardVisible } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    navigate('/');
  };

  // Get tier badge color
  const getTierColor = () => {
    switch (user?.tier) {
      case 'premium':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'vip':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      default: // free
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    }
  };

  const getTierName = () => {
    switch (user?.tier) {
      case 'premium':
        return 'Premium';
      case 'vip':
        return 'VIP';
      default:
        return 'Free';
    }
  };

  // Calculate menu position
  const rect = buttonRef.current?.getBoundingClientRect() || { right: 320 };
  let left = rect.right - 256;
  if (typeof window !== 'undefined' && window.innerWidth < 420) {
    left = 28;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg
          border transition-all duration-200
          bg-white hover:bg-gray-50
          dark:bg-gray-800 dark:hover:bg-gray-700
          border-gray-200 dark:border-gray-700
          text-gray-700 dark:text-gray-300"
      >
        <User size={18} className="text-gray-500 dark:text-gray-400" />
        <span className="font-medium hidden sm:block">
          {user?.displayName || user?.email?.split('@')[0] || 'Account'}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 dark:text-gray-400 transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="fixed right-0 mt-2 w-[calc(100vw-2rem)] sm:w-64
            bg-white dark:bg-gray-800 rounded-lg shadow-lg
            border border-gray-200 dark:border-gray-700
            py-2 z-50"
          style={{ top: '3rem', left: left + 'px' }}
        >
          {/* User Info */}
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {user?.displayName || 'Player'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>

          {/* Tier Badge */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Account Tier
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTierColor()}`}>
                {getTierName()}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

          {/* Currency Balances */}
          <div className="px-4 py-3 space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Currencies
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{CURRENCY_NAMES.SOFT}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {Number(essenceBalance || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gem size={16} className="text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{CURRENCY_NAMES.PREMIUM}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {Number(gemsBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

          {/* Settings Link */}
          <Link
            to="/account/settings"
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 text-left flex items-center gap-2
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-700/50
              transition-colors"
          >
            <Settings size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm">Settings</span>
          </Link>

          {/* Show Tutorial - only when wizard is hidden */}
          {!tutorialWizardVisible && (
            <button
              onClick={() => {
                setTutorialWizardVisible(true);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left flex items-center gap-2
                text-gray-700 dark:text-gray-300
                hover:bg-gray-50 dark:hover:bg-gray-700/50
                transition-colors"
            >
              <GraduationCap size={16} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm">Show Tutorial</span>
            </button>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left flex items-center gap-2
              text-red-600 dark:text-red-400
              hover:bg-red-50 dark:hover:bg-red-900/20
              transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm">Log Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

/**
 * Header Component
 *
 * Main navigation header with email/password auth.
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { LoginButton } from './LoginButton';
import { UserMenu } from './UserMenu';
import NotificationsPanel from '../NotificationsPanel';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { BookOpenText, Flame, Info, MapIcon, TagIcon, X } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { rewardsState, claimDailyReward } = useGame();
  const streakStatus = rewardsState.streakStatus;
  const [showStreakTracker, setShowStreakTracker] = useState<boolean>(true);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  const handleClaimReward = async () => {
    if (isClaiming || !canClaimToday) return;
    setIsClaiming(true);
    try {
      await claimDailyReward();
    } finally {
      setIsClaiming(false);
    }
  };

  // Get streak from user stats (use streakStatus if available, fallback to user stats)
  const streakDays = streakStatus?.streakDays || user?.stats?.loginStreak || 0;
  const canClaimToday = streakStatus?.canClaimToday || false;

  return (
    <>
      {/* Mobile Streak Tracker */}
      {isAuthenticated && showStreakTracker && streakDays > 0 && (
        <div className="md:hidden absolute top-0 left-0 right-0 z-50 bg-purple-500 text-white px-4 py-2 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">
                Day {streakDays} Streak!
              </span>
            </div>
            <div className="flex items-center gap-2">
              {canClaimToday && (
                <button
                  onClick={handleClaimReward}
                  disabled={isClaiming}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium disabled:opacity-50"
                >
                  {isClaiming ? 'Claiming...' : 'Claim Reward'}
                </button>
              )}
              <button
                onClick={() => setShowStreakTracker(false)}
                className="text-white/60 hover:text-white p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-screen-xl w-full mx-auto px-2 sm:px-4 h-14 sm:h-16">
          <div className="flex items-center justify-between h-full text-gray-600 dark:text-gray-400">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/tb-logo-180.png"
                alt="TotemBound"
                className="h-6 w-6 sm:h-8 sm:w-8"
              />
              <span className={`font-bold text-lg sm:text-xl dark:text-white ${isAuthenticated ? 'inline' : 'hidden sm:inline'}`}>
                TotemBound
              </span>
            </Link>

            {/* Public Navigation - Only shown when not authenticated */}
            {!isAuthenticated && (
              <div className="hidden md:flex items-center flex-grow justify-end space-x-2 mr-4 py-4">
                <Link
                  to="/about"
                  className="flex items-center gap-2 px-2 md:px-3 py-1 rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 font-medium"
                >
                  About
                </Link>
                <span>|</span>
                <Link
                  to="/guides"
                  className="flex items-center gap-2 px-2 md:px-3 py-1 rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 font-medium"
                >
                  Guides
                </Link>
                <span>|</span>
                <Link
                  to="/plans"
                  className="flex items-center gap-2 px-2 md:px-3 py-1 rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 font-medium"
                >
                  Plans
                </Link>
                <span>|</span>
                <Link
                  to="/roadmap"
                  className="flex items-center gap-2 px-2 md:px-3 py-1 rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 font-medium"
                >
                  Roadmap
                </Link>
              </div>
            )}

            {/* Mobile Public Nav - Only shown when not authenticated */}
            {!isAuthenticated && (
              <div className="flex md:hidden items-center space-x-2">
                <Link
                  to="/about"
                  className="text-gray-600 dark:text-gray-300 p-2"
                  aria-label="About"
                >
                  <Info size={20} />
                </Link>
                <Link
                  to="/guides"
                  className="text-gray-600 dark:text-gray-300 p-2"
                  aria-label="Guides"
                >
                  <BookOpenText size={20} />
                </Link>
                <Link
                  to="/plans"
                  className="text-gray-600 dark:text-gray-300 p-2"
                  aria-label="Pricing"
                >
                  <TagIcon size={20} />
                </Link>
                <Link
                  to="/roadmap"
                  className="text-gray-600 dark:text-gray-300 p-2"
                  aria-label="Roadmap"
                >
                  <MapIcon size={20} />
                </Link>
              </div>
            )}

            {/* Desktop Streak Tracker */}
            {isAuthenticated && showStreakTracker && streakDays > 0 && (
              <div className="hidden md:flex items-center gap-3 bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/50 text-purple-900 px-3 py-1 rounded-md">
                <span className="font-bold text-purple-900 dark:text-purple-200">
                  <Flame className="w-4 h-4 inline mr-1 mb-1" />
                  Day {streakDays} Streak!
                </span>
                {canClaimToday && (
                  <button
                    onClick={handleClaimReward}
                    disabled={isClaiming}
                    className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-700 dark:hover:bg-purple-600 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
                  >
                    {isClaiming ? 'Claiming...' : 'Claim Reward'}
                  </button>
                )}
                <button
                  onClick={() => setShowStreakTracker(false)}
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-1"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Right side: Theme toggle, notifications, user menu/login */}
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              {isAuthenticated && <NotificationsPanel />}
              {isAuthenticated ? <UserMenu /> : <LoginButton />}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;

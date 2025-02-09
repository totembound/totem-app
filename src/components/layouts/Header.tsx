import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { WalletButton } from './WalletButton';
import { UserMenu } from './UserMenu';
import NotificationsPanel from '../NotificationsPanel';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { Flame, X } from 'lucide-react';

const Header: React.FC = () => {
  const { isConnected, isSignedUp, address, streakStatus, isClaimLoading, claimDailyReward, isTokenApproved } = useUser();
  const [showStreakTracker, setShowStreakTracker] = useState<boolean>(true);
  const disabledStyle = !streakStatus?.canClaimToday ? 'opacity-50 cursor-not-allowed' : '';

  const handleClaimReward = async () => {
      if (!streakStatus?.canClaimToday || isClaimLoading) return;
    
      const success = await claimDailyReward();
      if (success) {
        setShowStreakTracker(false);
      }
  };

  return (<>
    {isConnected && isSignedUp && isTokenApproved && showStreakTracker && (
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-purple-500 text-white px-4 py-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">Day {streakStatus?.streakDays} Streak!</span>
          </div>
          <div className="flex items-center gap-2">
            {streakStatus?.canClaimToday && (
              <button 
                onClick={handleClaimReward}
                className={`bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium ${disabledStyle}`}
                disabled={!streakStatus?.canClaimToday || isClaimLoading}
              >
                {isClaimLoading ? 'Claiming...' : streakStatus?.canClaimToday ? 'Claim Reward' : 'Already Claimed'}
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

    <header className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 
        dark:border-gray-700 shadow-sm">
        <div className="max-w-screen-xl w-full mx-auto px-2 sm:px-4 h-14 sm:h-16">
            <div className="flex items-center justify-between h-full">
                <Link to="/" className="flex items-center gap-2">
                    <img 
                    src="/tb-logo-180.png" 
                    alt="TotemBound" 
                    className="h-6 w-6 sm:h-8 sm:w-8" 
                    />
                    <span className="font-bold text-lg sm:text-xl dark:text-white">TotemBound</span>
                </Link>

                {/* Desktop Streak Tracker */}
                {isConnected && isSignedUp && isTokenApproved && showStreakTracker && (
                    <div className="hidden md:flex items-center gap-3 bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/50 text-purple-900 px-3 py-1 rounded-md">
                        <span className="font-bold text-purple-900 dark:text-purple-200">
                        <Flame className="w-4 h-4 inline mr-1 mb-1" />
                        Day {streakStatus?.streakDays} Streak!
                        </span>
                        {streakStatus?.canClaimToday && (
                        <button 
                            onClick={handleClaimReward}
                            className={`bg-purple-500 hover:bg-purple-600 dark:bg-purple-700 dark:hover:bg-purple-600 text-white px-2 py-1 rounded text-sm ${disabledStyle}`}
                            disabled={!streakStatus?.canClaimToday || isClaimLoading}
                        >
                            {isClaimLoading ? 'Claiming...' : streakStatus?.canClaimToday ? 'Claim Reward' : 'Already Claimed'}
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

                <div className="flex items-center gap-2 sm:gap-4">
                    <ThemeToggle />
                    {isConnected && isSignedUp && <NotificationsPanel userAddress={address} />}
                    {isConnected ? (
                    <UserMenu />
                    ) : (
                    <WalletButton />
                    )}
                </div>
            </div>
        </div>
    </header>
  </>);
};

export default Header;
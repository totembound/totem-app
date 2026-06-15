import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, ShoppingBag, Trophy, Swords, Gift, PawPrint,
  MoreHorizontal, Settings, LogOut, Sparkles, Gem, Map, BookOpenText,
  LucideIcon, FileText, ShieldCheck, GraduationCap, Hammer, Crown
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { CURRENCY_NAMES } from '../../config/constants';

const MobileNavigation: React.FC = () => {
  const {
    isSignedUp,
    essenceBalance,
    gemsBalance,
    tutorialWizardVisible,
    setTutorialWizardVisible
  } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const mainNavItems = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/totems', label: 'Totems', icon: PawPrint },
    { to: '/rewards', label: 'Rewards', icon: Gift },
    { to: '/shop', label: 'Shop', icon: ShoppingBag }
  ];

  const moreNavItems = [
    { to: '/challenges', label: 'Challenges', icon: Swords },
    { to: '/expeditions', label: 'Expeditions', icon: Map },
    { to: '/forge', label: 'Forge', icon: Hammer },
    { to: '/sanctum', label: 'Sanctum', icon: Crown },
    { to: '/achievements', label: 'Achievements', icon: Trophy },
    { to: '/guides', label: 'Guides', icon: BookOpenText },
  ];

  // Close menu when tapping/clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const MoreMenuItem = ({
    label,
    icon: Icon,
    onClick
  }: {
    label: string,
    icon: LucideIcon,
    onClick?: () => void
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 
        text-gray-700 dark:text-gray-300
        hover:bg-gray-50 dark:hover:bg-gray-800 
        transition-colors"
    >
      <Icon size={20} className="text-gray-500 dark:text-gray-400" />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-[55] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="relative flex justify-between items-center h-16 px-1">
        {mainNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full min-h-[48px] py-2 transition-colors
              ${isActive
                ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/50'
                : 'text-gray-600 dark:text-gray-300 active:text-purple-600 dark:active:text-purple-400 active:bg-purple-50 dark:active:bg-purple-900/50'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-xs mt-0.5">{label}</span>
          </NavLink>
        ))}

        {/* More Menu */}
        <div className="relative flex items-center h-full" ref={moreMenuRef}>
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] flex-1 px-3 py-2 transition-colors
            ${isMoreMenuOpen || moreNavItems.some(item => location.pathname.startsWith(item.to))
                ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/50'
                : 'text-gray-600 dark:text-gray-300 active:text-purple-600 dark:active:text-purple-400 active:bg-purple-50 dark:active:bg-purple-900/50'
              }`}
          >
            <MoreHorizontal size={22} />
            <span className="text-xs mt-0.5">More</span>
          </button>

          {isMoreMenuOpen && (
            <div className="absolute bottom-full right-0 w-[calc(100vw-2rem)] max-w-xs 
              bg-white dark:bg-gray-900 
              rounded-t-lg shadow-lg 
              border border-gray-200 dark:border-gray-700
              overflow-hidden mb-2">
              {/* Balances Section */}
              {isSignedUp && (
                <>
                  <div className="px-4 py-3 space-y-1 bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Balances
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-yellow-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{CURRENCY_NAMES.SOFT}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {Number(essenceBalance).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <Gem size={16} className="text-purple-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{CURRENCY_NAMES.PREMIUM}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {Number(gemsBalance).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700" />
                </>
              )}

              {/* More Menu Items */}
              {moreNavItems.map(({ to, label, icon: Icon }) => (
                <MoreMenuItem
                  key={to}
                  label={label}
                  icon={Icon}
                  onClick={() => {
                    navigate(to);
                    setIsMoreMenuOpen(false);
                  }}
                />
              ))}

              {isSignedUp && !tutorialWizardVisible && (
                <MoreMenuItem
                  label="Show Tutorial"
                  icon={GraduationCap}
                  onClick={() => {
                    setTutorialWizardVisible(true);
                    setIsMoreMenuOpen(false);
                  }}
                />
              )}
              <MoreMenuItem
                label="Account Settings"
                icon={Settings}
                onClick={() => {
                  navigate('/account/settings');
                  setIsMoreMenuOpen(false);
                }}
              />
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <MoreMenuItem
                label="Terms"
                icon={FileText}
                onClick={() => {
                  navigate('/terms');
                  setIsMoreMenuOpen(false);
                }}
              />
              <MoreMenuItem
                label="Privacy"
                icon={ShieldCheck}
                onClick={() => {
                  navigate('/privacy');
                  setIsMoreMenuOpen(false);
                }}
              />
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <MoreMenuItem
                label="Log Out"
                icon={LogOut}
                onClick={() => {
                  logout();
                  setIsMoreMenuOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default MobileNavigation;

/**
 * User Menu Component
 *
 * Dropdown menu for authenticated users.
 *
 * Trigger: avatar (size=xs) + displayName + chevron.
 * Dropdown header: banner strip + overlapping avatar + name (with inline tier
 * badge) + email — mirrors the public profile page so the visual language is
 * consistent across header menu, AccountSettings hero, and PublicPlayerProfile.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { Award, ChevronDown, Crown, Gem, GraduationCap, LogOut, Settings, Shield, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { CURRENCY_NAMES } from '../../config/constants';
import { Avatar } from '../profile/Avatar';
import { resolveBannerImage } from '../../utils/avatar';

// Tier badge config — Free shows green Shield (informational, only for the
// signed-in user's own menu — public profile hides Free per product call).
// Premium = purple, VIP = amber/gold. Mirrors PublicPlayerProfile classes.
// Tier badge config — only governs the inline pill next to the displayName.
// Avatar ring is intentionally tier-agnostic (neutral white/gray-800) so the
// ring acts as a "cutout" against the dropdown surface, never as a tier signal.
const TIER_BADGE: Record<string, { label: string; className: string; Icon: typeof Crown }> = {
  vip: {
    label: 'VIP',
    className: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700',
    Icon: Crown,
  },
  premium: {
    label: 'Premium',
    className: 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
    Icon: Award,
  },
  free: {
    label: 'Free',
    className: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700',
    Icon: Shield,
  },
};

export const UserMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const { essenceBalance, gemsBalance, setTutorialWizardVisible } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Account';
  const avatar = user?.profile?.avatar ?? null;
  const banner = user?.profile?.banner ?? null;
  const bannerSrc = resolveBannerImage(banner);
  const tierKey = user?.tier && TIER_BADGE[user.tier] ? user.tier : 'free';
  const tier = TIER_BADGE[tierKey];

  return (
    <div className="relative sm:static" ref={menuRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg
          border transition-all duration-200
          bg-white hover:bg-gray-50
          dark:bg-gray-800 dark:hover:bg-gray-700
          border-gray-200 dark:border-gray-700
          text-gray-700 dark:text-gray-300"
      >
        <Avatar avatar={avatar} displayName={displayName} size="sm" />
        <span className="font-medium hidden sm:block">
          {displayName}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-500 dark:text-gray-400 transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="fixed top-12 right-4 left-4 sm:absolute sm:top-full sm:left-auto sm:right-0 mt-2 sm:w-72
            bg-white dark:bg-gray-800 rounded-lg shadow-lg
            border border-gray-200 dark:border-gray-700
            overflow-hidden z-50"
        >
          {/* Banner strip with overlapping avatar */}
          <div className="relative h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            {bannerSrc && (
              <img
                src={bannerSrc}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <Avatar
              avatar={avatar}
              displayName={displayName}
              size="md"
              className="absolute -bottom-6 left-3 shadow-lg ring-2 ring-white dark:ring-gray-800"
            />
          </div>

          {/* Identity — name + tier badge inline, email below.
              pt-7 reserves room for the half-overhanging avatar (md = 48px / 2 = 24px). */}
          <div className="pt-7 px-4 pb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-gray-900 dark:text-white truncate">
                {user?.displayName || 'Player'}
              </p>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${tier.className}`}
              >
                <tier.Icon className="w-3 h-3" />
                {tier.label}
              </span>
            </div>
            {user?.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {user.email}
              </p>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

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

          <div className="border-t border-gray-200 dark:border-gray-700" />

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

          {/* Show Tutorial */}
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

          <div className="border-t border-gray-200 dark:border-gray-700" />

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

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
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import { withVillagePrefix } from '../village/villagePath';
import { Award, ChevronDown, Crown, Gem, GraduationCap, LogOut, MapPinned, Settings, Shield, Sparkles, Target } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const { setDailyQuestWizardVisible } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Dropdown is portal'd to document.body so it escapes the header's stacking
  // context — otherwise the tutorial wizard (z-50, root child) renders on top
  // of UserMenu (z-[60] but bounded by header's stacking context). Click-
  // outside has to also exclude the portal'd dropdown since it's no longer a
  // descendant of menuRef in the DOM.
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Anchor to the trigger button's right + bottom (avatar). The
  // NotificationsPanel anchors to this same button so both dropdowns share
  // the same x and y. clientWidth (not innerWidth) avoids the scrollbar
  // offset on Chrome.
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const recalc = () => {
      const r = buttonRef.current?.getBoundingClientRect();
      if (!r) return;
      const docWidth = document.documentElement.clientWidth;
      setCoords({ top: r.bottom + 8, right: Math.max(8, docWidth - r.right) });
    };
    recalc();
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);
    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger = menuRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideDropdown) setIsOpen(false);
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
    <div className="relative" ref={menuRef}>
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

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          // Portal'd to body, fixed-positioned via inline coords. Width fixed
          // at 288px (w-72) on every viewport with a small viewport-clamp so
          // it doesn't overflow on very narrow screens.
          className="fixed w-72 max-w-[calc(100vw-1rem)]
            bg-white dark:bg-gray-800 rounded-lg shadow-lg
            border border-gray-200 dark:border-gray-700
            overflow-hidden z-[60]"
          style={coords ? { top: coords.top, right: coords.right } : undefined}
        >
          {/* Banner strip with overlapping avatar */}
          <div className="relative h-20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-slate-700 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-950" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(168,85,247,0.15),transparent_70%)]" />
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
              className="absolute -bottom-6 left-3 shadow-lg ring-2 ring-slate-200 dark:ring-gray-800"
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

          {/* Keeper's Village — primary entry to the hub. Hidden when already
              inside village (where it'd be a no-op). Divider after separates
              navigation (where to go) from config/help actions below. */}
          {!location.pathname.startsWith('/keepers-village') && (
            <>
              <Link
                to="/keepers-village"
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 text-left flex items-center gap-2
                  text-gray-700 dark:text-gray-300
                  hover:bg-gray-50 dark:hover:bg-gray-700/50
                  transition-colors"
              >
                <MapPinned size={16} className="text-gray-500 dark:text-gray-400" />
                <span className="text-sm">Keeper's Village</span>
              </Link>
              <div className="border-t border-gray-200 dark:border-gray-700" />
            </>
          )}

          {/* Account Settings — in village, route to /keepers-village/profile
              which mounts AccountSettings inside the Hearthstone modal so the
              user stays in the hub. Standalone routes use /account/settings. */}
          <Link
            to={location.pathname.startsWith('/keepers-village') ? '/keepers-village/profile' : '/account/settings'}
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 text-left flex items-center gap-2
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-700/50
              transition-colors"
          >
            <Settings size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm">Account Settings</span>
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

          {/* Show Daily Quests Wizard */}
          <button
            onClick={() => {
              setDailyQuestWizardVisible(true);
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-2
              text-gray-700 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-700/50
              transition-colors"
          >
            <Target size={16} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm">Show Daily Quests</span>
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

          {/* Footer-rows: discoverability for marketing + legal + community
              links that the global Footer normally surfaces. Repeated here so
              users in the village hub (where Footer is hidden) can still reach
              them. Split into two semantic rows so the dot-separated lists
              don't wrap awkwardly. */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-1 px-4 pt-2.5 pb-2 text-[11px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-x-2 gap-y-1">
              <Link to={withVillagePrefix(location.pathname, '/about')} onClick={() => setIsOpen(false)} className="hover:text-gray-700 dark:hover:text-gray-200">About</Link>
              <span aria-hidden>·</span>
              <Link to={withVillagePrefix(location.pathname, '/roadmap')} onClick={() => setIsOpen(false)} className="hover:text-gray-700 dark:hover:text-gray-200">Roadmap</Link>
              <span aria-hidden>·</span>
              <Link to={withVillagePrefix(location.pathname, '/terms')} onClick={() => setIsOpen(false)} className="hover:text-gray-700 dark:hover:text-gray-200">Terms</Link>
              <span aria-hidden>·</span>
              <Link to={withVillagePrefix(location.pathname, '/privacy')} onClick={() => setIsOpen(false)} className="hover:text-gray-700 dark:hover:text-gray-200">Privacy</Link>
            </div>
            <div className="flex items-center gap-x-2 gap-y-1 mt-1">
              <a href="https://discord.gg/MhKQC5E6xe" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200">Discord</a>
              <span aria-hidden>·</span>
              <a href="https://github.com/totembound" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200">GitHub</a>
              <span aria-hidden>·</span>
              <a href="https://x.com/totemboundhq" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-200">X</a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserMenu;

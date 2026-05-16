import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Castle,
  Compass,
  Crown,
  Hammer,
  Home,
  Lock,
  ScrollText,
  ShoppingBag,
  Swords,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useBuildingStats } from './useBuildingStats';
import { useVillageBadges } from './useVillageBadges';

interface BuildingMeta {
  id: string;
  name: string;
  modalPath?: string;
  Icon: LucideIcon;
  /** Tailwind color class for the building's accent dot/icon. */
  accentClass: string;
  /** CTA verb shown on the Enter button — building-flavored. */
  ctaVerb: string;
}

const BUILDING_META: Record<string, Omit<BuildingMeta, 'id'>> = {
  'library':         { name: 'Library',         modalPath: 'guides',       Icon: BookOpen,    accentClass: 'text-amber-300',  ctaVerb: 'Browse' },
  'shrine':          { name: 'Shrine',          modalPath: 'rewards',      Icon: ScrollText,  accentClass: 'text-yellow-300', ctaVerb: 'Claim' },
  'hall-of-legends': { name: 'Hall of Legends', modalPath: 'achievements', Icon: Trophy,      accentClass: 'text-purple-300', ctaVerb: 'View' },
  'bazaar':          { name: 'Bazaar',          modalPath: 'shop',         Icon: ShoppingBag, accentClass: 'text-emerald-300',ctaVerb: 'Shop' },
  'sanctuary':       { name: 'Sanctuary',       modalPath: 'totems',       Icon: Castle,      accentClass: 'text-blue-300',   ctaVerb: 'View' },
  'hearthstone':     { name: 'Hearthstone',     modalPath: 'profile',      Icon: Home,        accentClass: 'text-orange-300', ctaVerb: 'Open' },
  'forge':           { name: 'Totem Forge',     modalPath: 'forge',        Icon: Hammer,      accentClass: 'text-red-300',    ctaVerb: 'Forge' },
  'elder-tower':     { name: 'Elder Tower',     modalPath: 'sanctum',      Icon: Crown,       accentClass: 'text-violet-300', ctaVerb: 'Enter' },
  'arena':           { name: 'Arena',           modalPath: 'challenges',   Icon: Swords,      accentClass: 'text-rose-300',   ctaVerb: 'Pick' },
  'trailhead':       { name: 'Trailhead',       modalPath: 'expeditions',  Icon: Compass,     accentClass: 'text-teal-300',   ctaVerb: 'Send' },
};

interface VillageBuildingStripProps {
  /** Currently focused building (driven by KeepersVillage's `nearest` state). */
  buildingId: string;
}

const VillageBuildingStrip: React.FC<VillageBuildingStripProps> = ({ buildingId }) => {
  const navigate = useNavigate();
  const meta = BUILDING_META[buildingId];
  const stats = useBuildingStats(buildingId);
  const liveBadge = useVillageBadges()[buildingId] ?? {};

  if (!meta) return null;

  const Icon = meta.Icon;
  const isLocked = !!liveBadge.locked;
  const badge = liveBadge.badge;

  const onEnter = () => {
    if (isLocked || !meta.modalPath) return;
    navigate(`/keepers-village/${meta.modalPath}`);
  };

  return (
    <div
      className="shrink-0 w-full bg-slate-900/95 border-t border-slate-700/60 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-3">
        {/* Building icon — colored to match accent */}
        <div className={`shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-800/80 ring-1 ring-slate-700 flex items-center justify-center ${meta.accentClass}`}>
          {isLocked ? <Lock className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
        </div>

        {/* Name + stat summary OR lock reason */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm sm:text-base truncate">
              {meta.name}
            </span>
            {!isLocked && typeof badge === 'number' && badge > 0 && (
              <span className="shrink-0 inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-amber-500 text-slate-950">
                {badge}
              </span>
            )}
            {isLocked && (
              <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-slate-700 text-slate-300">
                Locked
              </span>
            )}
          </div>
          <div className="text-xs sm:text-sm text-slate-300 truncate">
            {isLocked ? stats.lockReason ?? stats.summary : stats.summary}
          </div>
        </div>

        {/* CTA — disabled when locked */}
        <button
          type="button"
          onClick={onEnter}
          disabled={isLocked || !meta.modalPath}
          aria-label={isLocked ? `${meta.name} (locked)` : `${meta.ctaVerb} ${meta.name}`}
          className={
            isLocked || !meta.modalPath
              ? 'shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300'
          }
        >
          <span className="hidden sm:inline">{isLocked ? 'Locked' : meta.ctaVerb}</span>
          <span className="sm:hidden">{isLocked ? 'Locked' : meta.ctaVerb}</span>
          {!isLocked && meta.modalPath && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};

export default VillageBuildingStrip;

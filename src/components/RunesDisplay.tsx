import React from 'react';
import { Diamond } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

interface RuneIconProps {
  type: 'lesser' | 'greater' | 'ancient';
}

const RuneIcon: React.FC<RuneIconProps> = ({ type }) => {
    switch (type) {
      case 'lesser':
        return <div className="w-6 h-6 bg-blue-200 dark:bg-blue-700/30 rounded-lg flex items-center justify-center">
                  <img
                    src="/runes/lesser-rune.png"
                    alt="Lesser Rune"
                    className="w-full h-full object-contain"
                    width={24}
                    height={24}
                  />
                </div>;
      case 'greater':
        return <div className="w-6 h-6 p-0.5 bg-amber-200 dark:bg-amber-700/30 rounded-lg flex items-center justify-center">
                  <img
                    src="/runes/greater-rune.png"
                    alt="Greater Rune"
                    className="w-full h-full object-contain"
                    width={24}
                    height={24}
                  />
                </div>;
      case 'ancient':
        return <div className="w-6 h-6 p-0.5 bg-purple-200 dark:bg-purple-700/30 rounded-lg flex items-center justify-center">
                  <img
                    src="/runes/ancient-rune.png"
                    alt="Ancient Rune"
                    className="w-full h-full object-contain"
                    width={24}
                    height={24}
                  />
                </div>;
      default:
        return <Diamond className="w-4 h-4 text-gray-500 fill-gray-500" />;
    }
};

// Spirit Stones - Highlighted borders with labels
const RunesDisplayOptionB: React.FC = () => {
    const { runeBalances } = useGame();

    return (
        <div className="bg-gradient-to-b from-gray-100 via-gray-50 to-white dark:from-gray-900 dark:via-slate-900 dark:to-gray-950 rounded-xl p-4 border border-gray-200 dark:border-slate-700/50">
            <div className="flex items-end justify-center gap-5">
                {/* Lesser */}
                <div className="flex flex-col items-center group cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/80 dark:to-blue-950 rounded-xl flex items-center justify-center border-2 border-blue-400 dark:border-blue-500/60 ring-2 ring-blue-300/50 dark:ring-blue-400/30 transition-all duration-200 group-hover:ring-blue-400/70 dark:group-hover:ring-blue-300/50 group-hover:border-blue-500 dark:group-hover:border-blue-400">
                        <img src="/runes/lesser-rune.png" alt="Lesser" className="w-8 h-8" width={32} height={32} />
                    </div>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-300 mt-2 min-w-[2ch] tabular-nums">{runeBalances.lesser}</span>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Lesser</span>
                </div>

                {/* Greater */}
                <div className="flex flex-col items-center group cursor-pointer">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/80 dark:to-amber-950 rounded-xl flex items-center justify-center border-2 border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-300/50 dark:ring-amber-400/30 transition-all duration-200 group-hover:ring-amber-400/70 dark:group-hover:ring-amber-300/50 group-hover:border-amber-500 dark:group-hover:border-amber-400">
                        <img src="/runes/greater-rune.png" alt="Greater" className="w-9 h-9" width={36} height={36} />
                    </div>
                    <span className="text-lg font-bold text-amber-600 dark:text-amber-300 mt-2 min-w-[2ch] tabular-nums">{runeBalances.greater}</span>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Greater</span>
                </div>

                {/* Ancient */}
                <div className="flex flex-col items-center group cursor-pointer">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/80 dark:to-violet-950 rounded-xl flex items-center justify-center border-2 border-purple-400 dark:border-purple-400/60 ring-2 ring-purple-300/50 dark:ring-purple-400/30 transition-all duration-200 group-hover:ring-purple-400/70 dark:group-hover:ring-purple-300/50 group-hover:border-purple-500 dark:group-hover:border-purple-300">
                        <img src="/runes/ancient-rune.png" alt="Ancient" className="w-10 h-10" width={40} height={40} />
                    </div>
                    <span className="text-xl font-bold text-purple-600 dark:text-purple-300 mt-2 min-w-[2ch] tabular-nums">{runeBalances.ancient}</span>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Ancient</span>
                </div>
            </div>
        </div>
    );
};

// Style A: Pill badges (matches filter height ~40px)
const RunesDisplayStyleA: React.FC = () => {
    const { runeBalances } = useGame();

    const runes = [
        { type: 'lesser', count: runeBalances.lesser, bg: 'bg-blue-50 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-600', text: 'text-blue-700 dark:text-blue-300', label: 'text-blue-600 dark:text-blue-400' },
        { type: 'greater', count: runeBalances.greater, bg: 'bg-amber-50 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-600', text: 'text-amber-700 dark:text-amber-300', label: 'text-amber-600 dark:text-amber-400' },
        { type: 'ancient', count: runeBalances.ancient, bg: 'bg-purple-50 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-600', text: 'text-purple-700 dark:text-purple-300', label: 'text-purple-600 dark:text-purple-400' },
    ];

    return (
        <div className="flex items-center gap-2">
            {runes.map(({ type, count, bg, border, text, label }) => (
                <div
                    key={type}
                    className={`${bg} ${border} border rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer group hover:brightness-95 dark:hover:brightness-110 transition-all`}
                >
                    <span className={`text-sm font-bold ${text} tabular-nums`}>{count}</span>
                    <img src={`/runes/${type}-rune.png`} alt={type} className="w-5 h-5" width={20} height={20} />
                    <span className={`text-xs ${label} capitalize hidden sm:inline`}>{type}</span>
                </div>
            ))}
        </div>
    );
};

// Style B: Minimal inline with dividers (matches filter height)
const RunesDisplayStyleB: React.FC = () => {
    const { runeBalances } = useGame();

    const runes = [
        { type: 'lesser', count: runeBalances.lesser, text: 'text-blue-600 dark:text-blue-400' },
        { type: 'greater', count: runeBalances.greater, text: 'text-amber-600 dark:text-amber-400' },
        { type: 'ancient', count: runeBalances.ancient, text: 'text-purple-600 dark:text-purple-400' },
    ];

    return (
        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-1 py-1">
            {runes.map(({ type, count, text }, index) => (
                <div key={type} className="flex items-center">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                        <img src={`/runes/${type}-rune.png`} alt={type} className="w-5 h-5" width={20} height={20} />
                        <span className={`text-sm font-semibold ${text} tabular-nums`}>{count}</span>
                    </div>
                    {index < runes.length - 1 && (
                        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
                    )}
                </div>
            ))}
        </div>
    );
};

// Style C: Gaming HUD style (matches filter height)
const RunesDisplayStyleC: React.FC = () => {
    const { runeBalances } = useGame();

    const runes = [
        { type: 'lesser', count: runeBalances.lesser, gradient: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/30' },
        { type: 'greater', count: runeBalances.greater, gradient: 'from-amber-500 to-amber-600', glow: 'shadow-amber-500/30' },
        { type: 'ancient', count: runeBalances.ancient, gradient: 'from-purple-500 to-purple-600', glow: 'shadow-purple-500/30' },
    ];

    return (
        <div className="flex items-center gap-1">
            {runes.map(({ type, count, gradient, glow }) => (
                <div
                    key={type}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r ${gradient} rounded-lg shadow-md ${glow} cursor-pointer hover:brightness-110 transition-all`}
                >
                    <img src={`/runes/${type}-rune.png`} alt={type} className="w-5 h-5 drop-shadow" width={20} height={20} />
                    <span className="text-sm font-bold text-white tabular-nums drop-shadow">{count}</span>
                </div>
            ))}
        </div>
    );
};

// Style D: Clean cards row (matches filter height)
const RunesDisplayStyleD: React.FC = () => {
    const { runeBalances } = useGame();

    const runes = [
        { type: 'lesser', count: runeBalances.lesser, accent: 'border-l-blue-500', text: 'text-blue-600 dark:text-blue-400', label: 'L' },
        { type: 'greater', count: runeBalances.greater, accent: 'border-l-amber-500', text: 'text-amber-600 dark:text-amber-400', label: 'G' },
        { type: 'ancient', count: runeBalances.ancient, accent: 'border-l-purple-500', text: 'text-purple-600 dark:text-purple-400', label: 'A' },
    ];

    return (
        <div className="flex items-center gap-2">
            {runes.map(({ type, count, accent, text, label }) => (
                <div
                    key={type}
                    className={`flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${accent} border-l-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors`}
                >
                    <img src={`/runes/${type}-rune.png`} alt={type} className="w-5 h-5" width={20} height={20} />
                    <div className="flex items-baseline gap-1">
                        <span className={`text-sm font-bold ${text} tabular-nums`}>{count}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Compact Horizontal Display - Current default
const RunesDisplayCompact: React.FC = () => {
    const { runeBalances } = useGame();

    const runes = [
        { type: 'lesser', count: runeBalances.lesser, iconRing: 'ring-blue-400/60 dark:ring-blue-500/50 group-hover:ring-blue-500 dark:group-hover:ring-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/60', text: 'text-blue-700 dark:text-blue-300', label: 'text-blue-600 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300' },
        { type: 'greater', count: runeBalances.greater, iconRing: 'ring-amber-400/60 dark:ring-amber-500/50 group-hover:ring-amber-500 dark:group-hover:ring-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/60', text: 'text-amber-700 dark:text-amber-300', label: 'text-amber-600 dark:text-amber-400 group-hover:text-amber-500 dark:group-hover:text-amber-300' },
        { type: 'ancient', count: runeBalances.ancient, iconRing: 'ring-purple-400/60 dark:ring-purple-500/50 group-hover:ring-purple-500 dark:group-hover:ring-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/60', text: 'text-purple-700 dark:text-purple-300', label: 'text-purple-600 dark:text-purple-400 group-hover:text-purple-500 dark:group-hover:text-purple-300' },
    ];

    return (
        <div className="flex items-center gap-4">
            {runes.map(({ type, count, iconRing, iconBg, text, label }) => (
                <div
                    key={type}
                    className="flex items-center gap-2 cursor-pointer group"
                >
                    {/* Icon with ring highlight */}
                    <div className={`${iconBg} ${iconRing} ring-2 p-1.5 rounded-lg transition-all duration-200`}>
                        <img src={`/runes/${type}-rune.png`} alt={type} className="w-6 h-6" width={24} height={24} />
                    </div>
                    {/* Count and label */}
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-bold ${text} min-w-[2ch] tabular-nums`}>{count}</span>
                        <span className={`text-xs font-medium ${label} capitalize transition-colors duration-200`}>{type}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// =============================================================================
// NEW GAME-INSPIRED STYLES
// =============================================================================

// Style 1: Diablo/PoE Socket Style - Hexagonal gem sockets with glow
const RunesDisplayDiablo: React.FC = () => {
    const { runeBalances } = useGame();

    const runes = [
        { type: 'lesser', count: runeBalances.lesser, glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]', border: 'border-blue-400', bg: 'bg-gradient-to-br from-blue-950 to-slate-900' },
        { type: 'greater', count: runeBalances.greater, glow: 'shadow-[0_0_15px_rgba(217,179,32,0.5)]', border: 'border-amber-400', bg: 'bg-gradient-to-br from-amber-950 to-slate-900' },
        { type: 'ancient', count: runeBalances.ancient, glow: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]', border: 'border-purple-400', bg: 'bg-gradient-to-br from-purple-950 to-slate-900' },
    ];

    return (
        <div className="flex items-center gap-1 bg-slate-900/80 rounded-lg p-1.5 border border-slate-700">
            {runes.map(({ type, count, glow, border, bg }) => (
                <div key={type} className="relative group cursor-pointer">
                    {/* Socket */}
                    <div className={`w-11 h-11 ${bg} ${border} border-2 rounded-lg ${glow} flex items-center justify-center transition-all duration-200 hover:scale-105`}>
                        <img src={`/runes/${type}-rune.png`} alt={type} className="w-7 h-7 drop-shadow-lg" width={28} height={28} />
                    </div>
                    {/* Count badge */}
                    <div className="absolute -bottom-1 -right-1 bg-slate-800 border border-slate-600 rounded px-1.5 min-w-[20px] text-center">
                        <span className="text-xs font-bold text-white tabular-nums">{count}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Style 2: Destiny 2 Materials Style - Sleek horizontal with large counts
const RunesDisplayDestiny: React.FC = () => {
    const { runeBalances } = useGame();

    const runes = [
        { type: 'lesser', count: runeBalances.lesser, color: 'text-cyan-400', bg: 'from-cyan-500/20 to-transparent' },
        { type: 'greater', count: runeBalances.greater, color: 'text-amber-400', bg: 'from-amber-500/20 to-transparent' },
        { type: 'ancient', count: runeBalances.ancient, color: 'text-fuchsia-400', bg: 'from-fuchsia-500/20 to-transparent' },
    ];

    return (
        <div className="flex items-center bg-black/60 backdrop-blur-sm rounded border border-white/10">
            {runes.map(({ type, count, color, bg }, index) => (
                <div key={type} className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${bg} ${index < runes.length - 1 ? 'border-r border-white/10' : ''} cursor-pointer hover:bg-white/5 transition-colors`}>
                    <img src={`/runes/${type}-rune.png`} alt={type} className="w-6 h-6" width={24} height={24} />
                    <span className={`text-lg font-light ${color} tabular-nums tracking-wide`}>{count}</span>
                </div>
            ))}
        </div>
    );
};

// Style 3: WoW Bag Slot Style - Square slots with corner quantity
const RunesDisplayWoW: React.FC = () => {
    const { runeBalances } = useGame();

    const runes = [
        { type: 'lesser', count: runeBalances.lesser, quality: 'border-blue-500 hover:border-blue-400', qualityBg: 'bg-blue-500/10' },
        { type: 'greater', count: runeBalances.greater, quality: 'border-amber-500 hover:border-amber-400', qualityBg: 'bg-amber-500/10' },
        { type: 'ancient', count: runeBalances.ancient, quality: 'border-purple-500 hover:border-purple-400', qualityBg: 'bg-purple-500/10' },
    ];

    return (
        <div className="flex items-center gap-0.5 bg-stone-800/90 p-1 rounded border border-stone-600">
            {runes.map(({ type, count, quality, qualityBg }) => (
                <div key={type} className={`relative w-10 h-10 ${qualityBg} ${quality} border-2 rounded cursor-pointer transition-all hover:brightness-125`}>
                    <img src={`/runes/${type}-rune.png`} alt={type} className="w-full h-full p-1.5 object-contain" width={40} height={40} />
                    {/* Quantity in corner */}
                    <span className="absolute bottom-0 right-0.5 text-[11px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] tabular-nums">{count}</span>
                </div>
            ))}
        </div>
    );
};

// Style 4: Genshin Impact Crystal Style - Floating with glow particles
const RunesDisplayGenshin: React.FC = () => {
    const { runeBalances } = useGame();

    const runes = [
        { type: 'lesser', count: runeBalances.lesser, glow: 'bg-blue-500/20', ring: 'ring-blue-400/40', text: 'text-blue-200' },
        { type: 'greater', count: runeBalances.greater, glow: 'bg-amber-500/20', ring: 'ring-amber-400/40', text: 'text-amber-200' },
        { type: 'ancient', count: runeBalances.ancient, glow: 'bg-purple-500/20', ring: 'ring-purple-400/40', text: 'text-purple-200' },
    ];

    return (
        <div className="flex items-center gap-3">
            {runes.map(({ type, count, glow, ring, text }) => (
                <div key={type} className="flex items-center gap-1.5 cursor-pointer group">
                    {/* Glowing orb container */}
                    <div className={`relative w-9 h-9 ${glow} ${ring} ring-2 rounded-full flex items-center justify-center backdrop-blur-sm transition-all group-hover:ring-4 group-hover:scale-110`}>
                        <img src={`/runes/${type}-rune.png`} alt={type} className="w-6 h-6 drop-shadow-lg" width={24} height={24} />
                        {/* Particle effect (pseudo) */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className={`text-base font-medium ${text} tabular-nums`}>×{count}</span>
                </div>
            ))}
        </div>
    );
};

// Style 5: Pouch Style - Matches currency display pattern: Icon Label: Count
const RunesDisplayPouch: React.FC = () => {
    const { runeBalances } = useGame();

    const runes = [
        { type: 'lesser', count: runeBalances.lesser, name: 'Lesser', border: 'border-blue-200 dark:border-blue-800', accent: 'bg-blue-500' },
        { type: 'greater', count: runeBalances.greater, name: 'Greater', border: 'border-amber-200 dark:border-amber-800', accent: 'bg-amber-500' },
        { type: 'ancient', count: runeBalances.ancient, name: 'Ancient', border: 'border-purple-200 dark:border-purple-800', accent: 'bg-purple-500' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-1">
            {runes.map(({ type, count, name, border }) => (
                <div key={type} className={`flex items-center bg-white dark:bg-gray-800 rounded-lg p-2 border ${border} cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all`}>
                    <img src={`/runes/${type}-rune.png`} alt={type} className="w-5 h-5 shrink-0" width={20} height={20} />
                    <span className="text-sm text-gray-700 dark:text-gray-300 ml-1">{name}:</span>
                    <span className="font-bold text-gray-900 dark:text-white ml-1 min-w-[1.5ch] tabular-nums">{count}</span>
                </div>
            ))}
        </div>
    );
};

// Style 5 Large: Pouch Style - Large version for Codex pages
interface RunesDisplayPouchLargeProps {
    showUserCounts?: boolean; // If true, shows user's rune counts; if false, shows static display
}

const RunesDisplayPouchLarge: React.FC<RunesDisplayPouchLargeProps> = ({ showUserCounts = true }) => {
    const { runeBalances } = useGame();

    const runes = [
        {
            type: 'lesser',
            count: showUserCounts ? runeBalances.lesser : null,
            name: 'Lesser Rune',
            description: 'Common spiritual fragments from any expedition.',
            bg: 'bg-gradient-to-r from-blue-50 to-slate-100 dark:from-slate-700 dark:to-slate-800',
            border: 'border-blue-200 dark:border-slate-600',
            accent: 'bg-blue-500',
            accentText: 'text-blue-600 dark:text-blue-400',
            countText: 'text-blue-700 dark:text-white',
            descText: 'text-gray-600 dark:text-slate-400'
        },
        {
            type: 'greater',
            count: showUserCounts ? runeBalances.greater : null,
            name: 'Greater Rune',
            description: 'Rare finds from longer expeditions.',
            bg: 'bg-gradient-to-r from-amber-50 to-slate-100 dark:from-slate-700 dark:to-slate-800',
            border: 'border-amber-200 dark:border-slate-600',
            accent: 'bg-amber-500',
            accentText: 'text-amber-600 dark:text-amber-400',
            countText: 'text-amber-700 dark:text-white',
            descText: 'text-gray-600 dark:text-slate-400'
        },
        {
            type: 'ancient',
            count: showUserCounts ? runeBalances.ancient : null,
            name: 'Ancient Rune',
            description: 'Legendary relics from the spirit world.',
            bg: 'bg-gradient-to-r from-purple-50 to-slate-100 dark:from-slate-700 dark:to-slate-800',
            border: 'border-purple-200 dark:border-slate-600',
            accent: 'bg-purple-500',
            accentText: 'text-purple-600 dark:text-purple-400',
            countText: 'text-purple-700 dark:text-white',
            descText: 'text-gray-600 dark:text-slate-400'
        },
    ];

    return (
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
            {runes.map(({ type, count, name, description, bg, border, accent, accentText, countText, descText }) => (
                <div key={type} className={`${bg} ${border} flex-1 rounded-lg overflow-hidden cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition-all border flex`}>
                    {/* Accent bar */}
                    <div className={`w-2 ${accent}`} />
                    {/* Content */}
                    <div className="flex items-center gap-4 p-4 flex-1">
                        <img src={`/runes/${type}-rune.png`} alt={type} className="w-12 h-12" width={48} height={48} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`text-lg font-bold ${accentText}`}>{name}</span>
                                {count !== null && (
                                    <span className={`text-xl font-bold ${countText} tabular-nums`}>×{count}</span>
                                )}
                            </div>
                            <p className={`text-sm ${descText} mt-0.5`}>{description}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Default: Spirit Stones Display (full featured with hover)
const RunesDisplay: React.FC = () => {
    return <RunesDisplayOptionB />;
};

export default RunesDisplay;
export {
    RuneIcon,
    RunesDisplayCompact,
    RunesDisplayStyleA,
    RunesDisplayStyleB,
    RunesDisplayStyleC,
    RunesDisplayStyleD,
    // New game-inspired styles
    RunesDisplayDiablo,
    RunesDisplayDestiny,
    RunesDisplayWoW,
    RunesDisplayGenshin,
    RunesDisplayPouch,
    RunesDisplayPouchLarge
};
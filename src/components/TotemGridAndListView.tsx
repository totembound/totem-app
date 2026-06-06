import React from 'react';
import { TotemData, Rarity } from '../types/types';
import { Heart, MapPin, Swords, Landmark, Drumstick, Star, Sparkles } from 'lucide-react';
import { AFFINITY_ICONS, DOMAIN_ICONS, getRarityBorderColor, getRarityFontColor, getRarityGlow, getRarityHaloShadow } from '../utils/totems';
import { IPFS_GATEWAY_URL, STAGE_THRESHOLDS, PRESTIGE_XP_REQUIREMENT } from '../config/constants';
import { computePrestigeLevel } from '../utils/prestige';
import { formatTimeRemaining } from '../utils/formats';
import TraitIconRow from './traits/TraitIconRow';
import Tooltip from './Tooltip';
import { deriveHunger, useFocusNow } from '../utils/hunger';

// Title-case a stat/domain string for tooltips (e.g. "wisdom" → "Wisdom").
const titleCase = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

interface TotemViewProps {
    nft: TotemData;
    onClick: () => void;
    isSelected: boolean;
    isLoading?: boolean;
    isOnExpedition?: boolean;
    expeditionEndTime?: number;
}

// Need bar color signals "needs attention" at a glance: green healthy → amber → red.
const needBarColor = (v: number): string =>
    v >= 60 ? 'bg-green-500' : v >= 30 ? 'bg-amber-500' : 'bg-red-500';

const clampPct = (v: number): number => Math.max(0, Math.min(100, Math.round(v)));

// Resolve the active status (expedition / mission / seated) into icon + label.
// Returns null when the totem is idle. Shared by grid card and list row.
const resolveStatus = (
    nft: TotemData,
    isOnExpedition: boolean,
    expeditionEndTime: number,
): { Icon: typeof MapPin; text: string } | null => {
    if (isOnExpedition && !nft.attributes.sanctum?.seated) {
        return {
            Icon: MapPin,
            text: expeditionEndTime > 0 && expeditionEndTime > Math.floor(Date.now() / 1000)
                ? formatTimeRemaining(expeditionEndTime)
                : 'Expedition complete',
        };
    }
    if (nft.attributes.sanctum?.onMission) {
        return {
            Icon: Swords,
            text: nft.attributes.sanctum.missionEndsAt && new Date(nft.attributes.sanctum.missionEndsAt).getTime() > Date.now()
                ? formatTimeRemaining(Math.floor(new Date(nft.attributes.sanctum.missionEndsAt).getTime() / 1000))
                : nft.attributes.sanctum.missionEndsAt ? 'Mission complete' : 'On Mission',
        };
    }
    if (nft.attributes.sanctum?.seated) {
        return { Icon: Landmark, text: 'Seated' };
    }
    return null;
};

// Info chip — neutral pill holding an icon + label/value. Footer is now neutral
// (rarity lives on the frame + art glow), so chips use a subtle gray surface for
// separation. Icon and text scale up on desktop where players linger.
const Chip: React.FC<{ className?: string; onClick?: (e: React.MouseEvent) => void; children: React.ReactNode }> = ({ className = '', onClick, children }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-1.5 px-1.5 sm:px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/60 min-w-0 ${className}`}
    >
        {children}
    </div>
);

// Evolution stage as 5 star pips (filled = current stage). Hides the stored
// 0-4 / displayed 1-5 offset entirely. Prestige totems (Ascended) show all 5 in
// gold. `size` lets the list row render slightly smaller pips than the grid card.
const StagePips: React.FC<{ stage: number; isPrestige: boolean; size?: number }> = ({ stage, isPrestige, size = 12 }) => {
    const filled = isPrestige ? 5 : stage + 1; // stage is 0-based
    return (
        <div className="flex items-center gap-px sm:gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    size={size}
                    className={i < filled
                        ? (isPrestige ? 'text-amber-400' : 'text-blue-500 dark:text-blue-400')
                        : 'text-gray-300 dark:text-gray-600'}
                    fill={i < filled ? 'currentColor' : 'none'}
                    strokeWidth={2}
                />
            ))}
        </div>
    );
};

// Stage vs. prestige progress. Stage 4 ("5/5") is max — Ascended totems no longer
// gain stages, so we show prestige progress instead, mirroring the detail view
// (TotemStatsPanel): XP past Elder loops every PRESTIGE_XP_REQUIREMENT.
interface StageDisplay {
    label: string;        // "3/5" or "Prestige 2"
    percent: number;      // bar fill 0-100
    isPrestige: boolean;
    canEvolve: boolean;
}
const getStageDisplay = (nft: TotemData): StageDisplay => {
    const { stage, experience } = nft.attributes;
    if (stage === 4) {
        // Prestige is XP-derived (shared with the detail HUD + server), not the
        // stored prestigeLevel field — which is always 0 and made this render "P0".
        const prestigeLevel = computePrestigeLevel(experience, stage);
        const xpSinceElder = experience - STAGE_THRESHOLDS[4];
        const inLevel = ((xpSinceElder % PRESTIGE_XP_REQUIREMENT) / PRESTIGE_XP_REQUIREMENT) * 100;
        return {
            label: prestigeLevel > 0 ? `Prestige ${prestigeLevel}` : 'Prestige',
            percent: clampPct(inLevel),
            isPrestige: true,
            canEvolve: false,
        };
    }
    const cur = STAGE_THRESHOLDS[stage];
    const next = STAGE_THRESHOLDS[stage + 1] || cur;
    return {
        label: `${stage + 1}/5`,
        percent: clampPct(next > cur ? ((experience - cur) / (next - cur)) * 100 : 0),
        isPrestige: false,
        canEvolve: experience >= STAGE_THRESHOLDS[stage + 1],
    };
};

// Compact prestige badge — a single star + "P#" in purple (matches the detail
// view's prestige bar). Used instead of 5 identical filled pips once Ascended (all
// pips would be filled, so they're redundant and cramp the chip on mobile).
const PrestigeBadge: React.FC<{ level: string }> = ({ level }) => (
    <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
        <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="currentColor" strokeWidth={2} />
        <span className="text-[10px] sm:text-xs leading-none font-bold">P{level}</span>
    </span>
);

// Stage/prestige chip — pips (or prestige badge) on top, a thin progress bar below.
// Pips show the discrete stage; the bar shows continuous XP-to-next (or prestige
// progress). Prestige uses a purple bar to match the totem detail view.
const StageChip: React.FC<{ s: StageDisplay; stage: number }> = ({ s, stage }) => {
    const barColor = s.isPrestige
        ? 'bg-purple-500'
        : s.canEvolve ? 'bg-purple-500 animate-pulse' : 'bg-blue-500';
    return (
        <Chip>
            <div className="flex flex-col flex-grow min-w-0 gap-1">
                <div className="flex items-center h-4 gap-1">
                    {s.isPrestige
                        ? <PrestigeBadge level={s.label.replace(/\D/g, '') || '0'} />
                        : <span className="[&_svg]:w-2.5 [&_svg]:h-2.5 sm:[&_svg]:w-3.5 sm:[&_svg]:h-3.5">
                            <StagePips stage={stage} isPrestige={false} />
                          </span>}
                    {/* Ready-to-evolve cue — pairs with the pulsing purple bar below. */}
                    {s.canEvolve && (
                        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-purple-500 dark:text-purple-400 animate-pulse" fill="currentColor" strokeWidth={1.5} />
                    )}
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${s.canEvolve ? 100 : s.percent}%` }} />
                </div>
            </div>
        </Chip>
    );
};

// Need chip with value + meter (Happiness, Hunger). Bar color reflects urgency.
// Larger icon/number on desktop for readability on the showcase page.
const NeedChip: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => {
    const v = clampPct(value);
    return (
        <Chip>
            <span className="flex-shrink-0">{icon}</span>
            <div className="flex flex-col flex-grow min-w-0 gap-1">
                <div className="flex items-baseline justify-between gap-1">
                    <span className="hidden sm:inline text-[11px] leading-none font-medium text-gray-500 dark:text-gray-400 truncate">{label}</span>
                    <span className="text-[11px] sm:text-sm leading-none font-semibold text-gray-700 dark:text-gray-200 ml-auto">{v}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${needBarColor(v)}`} style={{ width: `${v}%` }} />
                </div>
            </div>
        </Chip>
    );
};

export const TotemGridCard: React.FC<TotemViewProps> = ({ nft, onClick, isSelected, isLoading, isOnExpedition = false, expeditionEndTime = 0 }) => {
    const rarityBorderColors = getRarityBorderColor(nft.attributes.rarity);
    const rarityGlow = getRarityGlow(nft.attributes.rarity);
    const rarityHalo = getRarityHaloShadow(nft.attributes.rarity);
    const stageInfo = getStageDisplay(nft);

    // Hunger decays ~1/hour; re-derive from the server snapshot (no refetch).
    const now = useFocusNow();
    const hunger = deriveHunger(nft.attributes, now);
    const status = resolveStatus(nft, isOnExpedition, expeditionEndTime);

    return (
        <div
            onClick={onClick}
            className={`
                bg-white dark:bg-gray-900 rounded-xl border
                ${rarityBorderColors.border}
                ${rarityHalo}
                transition-all duration-200 cursor-pointer
                hover:shadow-lg shadow-sm
                ${isSelected
                    ? `ring-2 ${rarityBorderColors.ring}`
                    : ''
                }
                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                relative hover:z-10 h-full flex flex-col overflow-hidden
            `}
        >
            {/* Image Section — rarity-colored gradient glow behind the art; the card
                border carries the rarity color, so the art itself stays clean.
                Status overlays the image bottom so it never grows the card height. */}
            <div className="aspect-square relative overflow-hidden flex-shrink-0">
                <div className={`absolute inset-0 z-0 bg-gradient-to-t ${rarityGlow} to-transparent`} aria-hidden="true" />
                <img
                    src={nft.image.replace('ipfs://', IPFS_GATEWAY_URL)}
                    alt={nft.name}
                    className="relative z-10 w-full h-full object-cover"
                    loading="lazy"
                />
                {status && (
                    <div className="absolute bottom-0 inset-x-0 z-20 flex items-center justify-center gap-1.5 bg-blue-600/55 backdrop-blur-sm text-white text-[11px] sm:text-sm font-medium px-2 py-1.5 leading-none">
                        <status.Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{status.text}</span>
                    </div>
                )}
            </div>

            {/* Footer — neutral surface; rarity reads from the frame + art glow. */}
            <div className="relative flex-grow flex flex-col gap-2 p-2 sm:p-2.5">
                {/* Name on its own line — both name and rarity can be long, so never share a row. */}
                {/* Custom nickname leads (always visible); species title follows, muted,
                    and truncates first when space is tight. */}
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate min-w-0 px-0.5">
                    {nft.attributes.nickname
                        ? (<>{nft.attributes.nickname}<span className="font-normal text-gray-500 dark:text-gray-400"> · {nft.displayName || nft.name}</span></>)
                        : (nft.displayName || nft.name)}
                </h3>

                {/* Stage + Traits + needs grid. Traits sit beside the Stage chip
                    because both are stage/level-based and change as the totem grows;
                    the fixed affinity/domain drops to the footer below. */}
                <div className="grid grid-cols-2 gap-1.5">
                    {/* Stage pips + XP bar — or prestige once Ascended (stage 5). */}
                    <StageChip s={stageInfo} stage={nft.attributes.stage} />

                    {/* Traits — stage/level-based, so they share the top row with Stage.
                        stopPropagation so tapping a trait tooltip doesn't open the totem. */}
                    <Chip className="justify-center items-center h-full gap-2">
                        {/* leading-none + [&_svg]:block kill the inline line-height gap under
                            the icons so the row's true height is the glyph height and it
                            centers cleanly (same fix the list view uses). */}
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center min-w-0 leading-none [&_svg]:block">
                            {nft.traits
                                ? <TraitIconRow stage={nft.attributes.stage} traits={nft.traits} size={18} showLocked />
                                : <span className="text-[11px] text-gray-400 dark:text-gray-600">No traits</span>}
                        </div>
                    </Chip>

                    {/* Happiness */}
                    <NeedChip label="Happy" icon={<Heart size={16} className="text-pink-500 dark:text-pink-400" />} value={nft.attributes.happiness} />

                    {/* Hunger */}
                    <NeedChip label="Hunger" icon={<Drumstick size={16} className="text-amber-600 dark:text-amber-400" />} value={hunger} />
                </div>

                {/* Footer: affinity/domain (left, fixed traits of the species) ↔ rarity
                    (right). px-0.5 matches the name's inset and rarity right-aligns with
                    the grid edge. */}
                <div className="flex items-center justify-between gap-2 px-0.5">
                    <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-3 flex-shrink-0">
                        <Tooltip content={`${titleCase(nft.affinity)} affinity`} position="bottom">
                            {React.createElement(AFFINITY_ICONS[nft.affinity as keyof typeof AFFINITY_ICONS], {
                                size: 18,
                                className: 'flex-shrink-0 text-yellow-600 dark:text-yellow-400',
                            })}
                        </Tooltip>
                        <Tooltip content={`${titleCase(nft.domain)} domain`} position="bottom">
                            {React.createElement(DOMAIN_ICONS[nft.domain as keyof typeof DOMAIN_ICONS], {
                                size: 18,
                                className: 'flex-shrink-0 text-cyan-600 dark:text-cyan-400',
                            })}
                        </Tooltip>
                    </div>
                    <span className={`flex-shrink-0 text-[11px] sm:text-sm font-medium uppercase tracking-wide ${getRarityFontColor(nft.attributes.rarity)}`}>
                        {Rarity[nft.attributes.rarity]}
                    </span>
                </div>
            </div>
        </div>
    );
};

// One horizontal stat row for the list view: a fixed-width left label column
// (icon + text), then the bar fills remaining width, then the value. Sharing the
// left column width across rows makes every bar start/end on the same vertical axis.
const StatBarRow: React.FC<{ left: React.ReactNode; barColor: string; percent: number; value: string }> = ({ left, barColor, percent, value }) => (
    <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 w-[72px] sm:w-[84px] flex-shrink-0">{left}</div>
        <div className="h-1.5 flex-grow rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${percent}%` }} />
        </div>
        <span className="w-7 text-right text-xs sm:text-sm leading-none font-semibold text-gray-700 dark:text-gray-200 flex-shrink-0">{value}</span>
    </div>
);

export const TotemListRow: React.FC<TotemViewProps> = ({ nft, onClick, isSelected, isLoading, isOnExpedition = false, expeditionEndTime = 0 }) => {
    const rarityBorderColors = getRarityBorderColor(nft.attributes.rarity);
    const rarityHalo = getRarityHaloShadow(nft.attributes.rarity);
    const stageInfo = getStageDisplay(nft);
    const now = useFocusNow();
    const hunger = deriveHunger(nft.attributes, now);
    const status = resolveStatus(nft, isOnExpedition, expeditionEndTime);

    return (
        <div
            onClick={onClick}
            className={`
                bg-white dark:bg-gray-900 rounded-xl border
                ${rarityBorderColors.border}
                ${rarityHalo}
                shadow-sm hover:shadow-lg
                transition-all duration-200 cursor-pointer overflow-hidden
                ${isSelected
                    ? `ring-2 ${rarityBorderColors.ring}`
                    : ''
                }
                ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                relative z-0 hover:z-10
            `}
        >
            <div className="flex items-stretch">
                {/* Thumbnail — flush to the card's left/top/bottom edges (no padding),
                    only the body is padded so the art reads big. Wide enough that the
                    near-square totem art fills without object-cover clipping its sides. */}
                <div className="relative w-28 sm:w-32 md:w-36 self-stretch overflow-hidden flex-shrink-0">
                    <div className={`absolute inset-0 z-0 bg-gradient-to-t ${getRarityGlow(nft.attributes.rarity)} to-transparent`} aria-hidden="true" />
                    <img
                        src={nft.image.replace('ipfs://', IPFS_GATEWAY_URL)}
                        alt={nft.name}
                        className="absolute inset-0 z-10 w-full h-full object-contain object-center"
                        loading="lazy"
                    />
                </div>

                {/* Body — stacks vertically so nothing collides at phone width.
                    Padding lives here (not the row) so the image stays flush left. */}
                <div className="flex-grow min-w-0 flex flex-col gap-2 p-2.5 sm:p-3 md:p-4">
                    {/* Row 1: name + rarity (rarity right-aligned, never overlaps name). */}
                    <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-semibold text-sm sm:text-lg text-gray-900 dark:text-gray-100 truncate min-w-0">
                            {nft.attributes.nickname
                                ? (<>{nft.attributes.nickname}<span className="font-normal text-gray-500 dark:text-gray-400"> · {nft.displayName || nft.name}</span></>)
                                : (nft.displayName || nft.name)}
                        </h3>
                        <span className={`flex-shrink-0 text-[11px] sm:text-sm font-medium uppercase tracking-wide ${getRarityFontColor(nft.attributes.rarity)}`}>
                            {Rarity[nft.attributes.rarity]}
                        </span>
                    </div>

                    {/* Row 2: affinity/domain icons + traits (left), status pill (right).
                        Fixed h-6 + items-center so every icon sits on one baseline; the
                        separator is a centered dot (not a text bullet) to avoid drift. */}
                    <div className="flex items-center justify-between gap-2 h-6">
                        <div className="flex items-center gap-2 min-w-0 h-full">
                            {/* Affinity/domain wrapped in the SAME Tooltip component the trait
                                icons use → identical `relative inline-flex` wrapper, so all icons
                                share one vertical center (a plain svg sat ~3px off the traits).
                                Also gives the requested affinity/domain tooltips. */}
                            <span className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Tooltip content={`${titleCase(nft.affinity)} affinity`} position="bottom">
                                    {React.createElement(AFFINITY_ICONS[nft.affinity as keyof typeof AFFINITY_ICONS], {
                                        size: 18,
                                        className: 'flex-shrink-0 text-yellow-600 dark:text-yellow-400',
                                    })}
                                </Tooltip>
                                <Tooltip content={`${titleCase(nft.domain)} domain`} position="bottom">
                                    {React.createElement(DOMAIN_ICONS[nft.domain as keyof typeof DOMAIN_ICONS], {
                                        size: 18,
                                        className: 'flex-shrink-0 text-cyan-600 dark:text-cyan-400',
                                    })}
                                </Tooltip>
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" aria-hidden="true" />
                            {/* Traits — leading-none kills the line-height strut that pushed the
                                trait glyphs ~3px above the affinity/domain center; [&_svg]/[&_img]
                                normalize glyph sizes to 18px. */}
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center leading-none min-w-0 [&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:block [&_img]:w-[18px] [&_img]:h-[18px] [&_img]:block">
                                {nft.traits
                                    ? <TraitIconRow stage={nft.attributes.stage} traits={nft.traits} size={18} showLocked />
                                    : <span className="text-[11px] text-gray-400 dark:text-gray-600">No traits</span>}
                            </div>
                        </div>
                        {status && (
                            <span className="flex-shrink-0 bg-blue-600 text-white text-[11px] sm:text-sm font-medium px-2 py-1 rounded-full flex items-center gap-1 leading-none">
                                <status.Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="hidden sm:inline">{status.text}</span>
                            </span>
                        )}
                    </div>

                    {/* Row 3: stage + need meters stacked vertically. Each row shares a
                        fixed-width left column so all three bars line up on one axis. */}
                    <div className="flex flex-col gap-1.5">
                        {/* Stage pips + XP bar — or prestige once Ascended (stage 5).
                            Prestige uses a purple bar to match the totem detail view. */}
                        <StatBarRow
                            left={stageInfo.isPrestige
                                ? <PrestigeBadge level={stageInfo.label.replace(/\D/g, '') || '0'} />
                                : <StagePips stage={nft.attributes.stage} isPrestige={false} size={12} />}
                            barColor={stageInfo.isPrestige ? 'bg-purple-500' : stageInfo.canEvolve ? 'bg-purple-500 animate-pulse' : 'bg-blue-500'}
                            percent={stageInfo.canEvolve ? 100 : stageInfo.percent}
                            value={stageInfo.isPrestige ? '' : stageInfo.label}
                        />
                        <StatBarRow
                            left={<><Heart size={16} className="flex-shrink-0 text-pink-500" /><span className="text-[11px] leading-none text-gray-500 dark:text-gray-400">Happy</span></>}
                            barColor={needBarColor(clampPct(nft.attributes.happiness))}
                            percent={clampPct(nft.attributes.happiness)}
                            value={`${clampPct(nft.attributes.happiness)}`}
                        />
                        <StatBarRow
                            left={<><Drumstick size={16} className="flex-shrink-0 text-amber-600 dark:text-amber-400" /><span className="text-[11px] leading-none text-gray-500 dark:text-gray-400">Hunger</span></>}
                            barColor={needBarColor(clampPct(hunger))}
                            percent={clampPct(hunger)}
                            value={`${clampPct(hunger)}`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
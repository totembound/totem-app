import React, { useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useUser } from '../../contexts/UserContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import { Calendar, Coins, Crown, Flame, Trophy, Lock, Shield, TrendingUp, Zap } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { withVillagePrefix } from '../village/villagePath';
import Tooltip from '../Tooltip';
import TokensDisplay from '../TokensDisplay';
import ProtectionDialog from '../ProtectionDialog';
import CountdownTimer from '../CountdownTimer';
import DailyQuestsCard from '../quests/DailyQuestsCard';
import TutorialClaimsCard from '../quests/TutorialClaimsCard';
import LootBoxesCard from '../quests/LootBoxesCard';
import { CURRENCY_NAMES } from '../../config/constants';

interface AchievementLockProps {
    title: string;
}

interface AchievementIconProps {
    unlocked: boolean;
    name: string;
}

interface LockedOverlayProps {
    children: React.ReactNode;
    achievementName: string;
}

const Rewards = () => {
    const { rewardsState, claimDailyReward, claimWeeklyReward, refreshRewardStatus } = useGame();
    const { essenceBalance } = useUser();
    const { refreshAchievements, progress } = useAchievements();
    const navigate = useNavigate();
    const location = useLocation();

    // Fetch reward status on page load (lazy — not loaded globally)
    useEffect(() => {
        refreshRewardStatus();
    }, [refreshRewardStatus]);

    // Callback when countdown timer reaches zero - refresh reward status
    const handleCountdownComplete = async () => {
        console.log('[Rewards] Countdown timer reached zero at', new Date().toISOString());
        console.log('[Rewards] Calling refreshRewardStatus to update canClaimToday...');
        await refreshRewardStatus();
        console.log('[Rewards] refreshRewardStatus complete - UI should now show Claim Daily button');
    };

    const streakStatus = rewardsState.streakStatus;
    const weeklyStatus = rewardsState.weeklyStatus;
    const isClaimLoading = rewardsState.isClaimLoading;
    // Derive unlock status from achievements context (already loaded, no extra API call)
    const hasWeeklyUnlocked = progress['ach_login-progression']?.unlockedMilestones[0] || false;

    // Check streak requirements + affordability (must afford the cheapest tier)
    const essenceNum = Number(essenceBalance) || 0;
    const DAILY_MIN_COST = 50;   // Tier 1 daily protection
    const WEEKLY_MIN_COST = 500; // Only weekly tier
    const canPurchaseDailyProtection = (streakStatus?.streakDays || 0) >= 7 && essenceNum >= DAILY_MIN_COST;
    const canPurchaseWeeklyProtection = (weeklyStatus?.weeklyStreak || 0) >= 4 && essenceNum >= WEEKLY_MIN_COST;

    // Active protection state (server-authoritative). Charges are consumable —
    // the badge shows how many "Streak Saver" charges the player has banked.
    const dailyCharges = streakStatus?.protectionCharges || 0;
    const weeklyCharges = weeklyStatus?.protectionCharges || 0;
    const dailyProtected = !!streakStatus?.isProtected || dailyCharges > 0;
    const weeklyProtected = !!weeklyStatus?.isProtected || weeklyCharges > 0;
    const protectionLabel = (charges: number) =>
        charges <= 1 ? 'Streak Saver Ready' : `Streak Saver x${charges}`;

    // Daily bonus calculation (matches backend: 5% per day from day 2, max 100% at day 21)
    const dailyStreakDays = streakStatus?.streakDays || 0;
    const dailyBonusPercent = Math.min(Math.max(0, dailyStreakDays - 1) * 5, 100);
    const dailyBaseAmount = 10;
    const dailyNextClaim = Math.round(dailyBaseAmount * (1 + dailyBonusPercent / 100));
    const dailyMaxDays = 21; // Day 21 = 100% bonus
    const dailyProgressPercent = Math.min(dailyStreakDays / dailyMaxDays, 1) * 100;

    // Weekly bonus calculation (matches backend: 10% per week from week 2, max 100% at week 11)
    const weeklyStreakWeeks = weeklyStatus?.weeklyStreak || 0;
    const weeklyBonusPercent = Math.min(Math.max(0, weeklyStreakWeeks - 1) * 10, 100);
    const weeklyBaseAmount = 100;
    const weeklyNextClaim = Math.round(weeklyBaseAmount * (1 + weeklyBonusPercent / 100));
    const weeklyMaxWeeks = 11; // Week 11 = 100% bonus
    const weeklyProgressPercent = Math.min(weeklyStreakWeeks / weeklyMaxWeeks, 1) * 100;

    const handleDailyClaim = async () => {
        if (!streakStatus?.canClaimToday) return;
        await claimDailyReward();
        // Refresh achievements to update tutorial progress (login-progression)
        await refreshAchievements();
    };

    const handleWeeklyClaim = async () => {
        if (!weeklyStatus?.canClaimWeekly) return;
        await claimWeeklyReward();
    };

    const _AchievementLock: React.FC<AchievementLockProps> = ({ title }) => (
        <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
                Requires {title}
            </span>
        </div>
    );

    const AchievementIcon: React.FC<AchievementIconProps & { color?: 'purple' | 'green' }> = ({ unlocked, name, color = 'purple' }) => {
        const colorClasses = color === 'green'
            ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
            : 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400';
        const icon = (
            <div className={`
                flex items-center justify-center w-8 h-8 rounded-full
                ${unlocked
                    ? colorClasses
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 animate-pulse'
                }
            `}>
                <Trophy className="w-4 h-4" />
            </div>
        );
    
        if (!unlocked) {
            return icon;
        }
    
        return (
            <Tooltip content={`Unlocked: ${name}`}>
                {icon}
            </Tooltip>
        );
    };

    const weeklyCardContent = (<>
        {/* Streak + Bonus summary */}
        <div className="flex items-center justify-between mb-3">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">Week {weeklyStreakWeeks}</span>
            <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
                <TrendingUp className="w-3.5 h-3.5" />
                +{weeklyBonusPercent}% Bonus
            </div>
        </div>

        {/* Progress toward max bonus */}
        <div className="mb-4">
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                <div
                    className="bg-gradient-to-r from-green-500 to-green-400 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${weeklyProgressPercent}%` }}
                />
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {weeklyStreakWeeks}/{weeklyMaxWeeks} weeks to max
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {weeklyBonusPercent < 100 ? `${100 - weeklyBonusPercent}% to go` : 'MAX!'}
                </span>
            </div>
        </div>

        {/* Next claim amount */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Next claim</span>
                <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-green-500" />
                    <span className="font-bold text-gray-900 dark:text-white">{weeklyNextClaim}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{CURRENCY_NAMES.SOFT}</span>
                </div>
            </div>
        </div>

        {/* Buttons */}
        <div className="space-y-3 mb-4">
            <button
                onClick={handleWeeklyClaim}
                disabled={!weeklyStatus?.canClaimWeekly || isClaimLoading}
                className={`w-full py-2 px-4 rounded-lg transition-colors ${
                    weeklyStatus?.canClaimWeekly
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isClaimLoading ? 'Claiming...' : weeklyStatus?.canClaimWeekly ? 'Claim Weekly' : 'Already Claimed'}
            </button>
            {weeklyProtected ? (
                <button
                    disabled
                    className="w-full py-2 px-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                >
                    <Shield className="w-4 h-4" />
                    {protectionLabel(weeklyCharges)}
                </button>
            ) : (
                <ProtectionDialog type="weekly">
                    <button
                        className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!canPurchaseWeeklyProtection}
                    >
                        Buy Protection
                    </button>
                </ProtectionDialog>
            )}
        </div>

        {/* Protection info */}
        <div className="text-sm flex items-center mb-2">
            <h3 className="text-gray-800 dark:text-gray-200">Weekly Streak Saver</h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
            <ul className="space-y-1">
                <li>• 500 {CURRENCY_NAMES.SOFT} - 2 charges
                    <span className="text-sm ml-2 text-gray-500">* 4-week streak</span>
                </li>
            </ul>
        </div>
    </>);


    const LockedOverlay: React.FC<LockedOverlayProps> = ({ children, achievementName }) => {
        const handleViewAchievement = () => {
            // Navigate to achievements page
            navigate(withVillagePrefix(location.pathname, '/achievements'), {
                state: { highlightAchievement: achievementName }  // Optional: Pass achievement name to highlight
            });
        };

        return (
            <div className="relative">
                <div className="absolute inset-0 bg-white/90 dark:bg-gray-800/90 rounded-lg z-10 flex flex-col items-center justify-start text-center p-4">
                    <Trophy className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3 animate-pulse" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Achievement Required
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Complete the "{achievementName}" achievement to unlock this feature
                    </p>
                    <button
                        onClick={handleViewAchievement}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                        View Achievement
                    </button>
                </div>
                <div className="opacity-50">
                    {children}
                </div>
            </div>
        );
    };

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">

            {/* Header with Balance */}
            <div className="mb-6 space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Rewards</h1>
                        <p className="text-gray-600 dark:text-gray-400">Wisdom Awaits. Stay Consistent. Claim Your Rewards.</p>
                    </div>

                    <TokensDisplay/>
                </div>
            </div>

            {/* Main Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    {/* Loot Boxes (slot 1) */}
                    <LootBoxesCard />

                    {/* Daily Rewards (slot 2) */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Flame className="w-6 h-6 text-orange-500" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Rewards</h2>
                            </div>
                            { !streakStatus?.canClaimToday &&
                                <div className="text-xs text-gray-900 dark:text-white">
                                    <CountdownTimer
                                        option="midnight"
                                        onComplete={handleCountdownComplete}
                                    />
                                </div>
                            }
                        </div>

                        {/* Streak + Bonus summary */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">Day {dailyStreakDays}</span>
                            <div className="flex items-center gap-1 text-sm font-semibold text-purple-600 dark:text-purple-400">
                                <TrendingUp className="w-3.5 h-3.5" />
                                +{dailyBonusPercent}% Bonus
                            </div>
                        </div>

                        {/* Progress toward max bonus */}
                        <div className="mb-4">
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                    className="bg-gradient-to-r from-purple-500 to-purple-400 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${dailyProgressPercent}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {dailyStreakDays}/{dailyMaxDays} days to max
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {dailyBonusPercent < 100 ? `${100 - dailyBonusPercent}% to go` : 'MAX!'}
                                </span>
                            </div>
                        </div>

                        {/* Next claim amount */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Next claim</span>
                                <div className="flex items-center gap-1">
                                    <Zap className="w-3.5 h-3.5 text-purple-500" />
                                    <span className="font-bold text-gray-900 dark:text-white">{dailyNextClaim}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{CURRENCY_NAMES.SOFT}</span>
                                </div>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="space-y-3 mb-4">
                            <button
                                onClick={handleDailyClaim}
                                disabled={!streakStatus?.canClaimToday || isClaimLoading}
                                className={`w-full py-2 px-4 rounded-lg transition-colors ${
                                    streakStatus?.canClaimToday
                                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isClaimLoading ? 'Claiming...' : streakStatus?.canClaimToday ? 'Claim Daily' : 'Already Claimed'}
                            </button>
                            {dailyProtected ? (
                                <button
                                    disabled
                                    className="w-full py-2 px-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
                                >
                                    <Shield className="w-4 h-4" />
                                    {protectionLabel(dailyCharges)}
                                </button>
                            ) : (
                                <ProtectionDialog type="daily">
                                    <button
                                        className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!canPurchaseDailyProtection}
                                    >
                                        Buy Protection
                                    </button>
                                </ProtectionDialog>
                            )}
                        </div>

                        {/* Protection info */}
                        <div className="text-sm flex items-center mb-2">
                            <h3 className="text-gray-800 dark:text-gray-200">Streak Saver</h3>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <ul className="space-y-1">
                                <li>• Tier 1: 50 {CURRENCY_NAMES.SOFT} - 1 charge
                                    <span className="text-sm ml-2 text-gray-500">* 7-day streak</span>
                                </li>
                                <li>• Tier 2: 250 {CURRENCY_NAMES.SOFT} - 7 charges
                                    <span className="text-sm ml-2 text-gray-500">* 14-day streak</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Daily Quests (slot 3) */}
                    <DailyQuestsCard />

                    {/* Weekly Rewards (slot 4) */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-green-500" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Rewards</h2>
                            </div>
                            {!weeklyStatus?.canClaimWeekly && weeklyStatus?.nextClaimTime ? (
                                <div className="text-xs text-gray-900 dark:text-white">
                                    <CountdownTimer
                                        endTime={weeklyStatus.nextClaimTime}
                                        onComplete={refreshRewardStatus}
                                    />
                                </div>
                            ) : (
                                <AchievementIcon unlocked={hasWeeklyUnlocked} name="Week Warrior" color="green" />
                            )}
                        </div>

                        {hasWeeklyUnlocked
                            ? weeklyCardContent
                            : <LockedOverlay achievementName="Week Warrior">
                                {weeklyCardContent}
                            </LockedOverlay>
                        }
                    </div>

                    {/* Tutorial Claims (slot 5) */}
                    <TutorialClaimsCard />

                    {/* Elder Sanctum (slot 6) */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Crown className="w-6 h-6 text-amber-500" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Elder Sanctum</h2>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Seat your most powerful totems on the Council of Elders to earn passive Essence over time.
                            </p>

                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Coins className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">Passive Earnings</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Earn 0.5 Essence/hr per seated Elder, with tenure bonuses up to 1.5x
                                </p>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                <p>• Requires Stage 4+ (Adult) totems</p>
                                <p>• Up to 3 Council Seats available</p>
                                <p>• Exclusive Council Missions</p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(withVillagePrefix(location.pathname, '/sanctum'))}
                            className="w-full py-2 px-4 min-h-[44px] mt-auto bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
                        >
                            Visit Sanctum
                        </button>
                    </div>
            </div>
    </div>
    );
};

export default Rewards;
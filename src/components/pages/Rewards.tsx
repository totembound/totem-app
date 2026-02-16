import React, { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import { Calendar, Coins, Flame, Trophy, Lock, Gift, Package, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Tooltip from '../Tooltip';
import TokensDisplay from '../TokensDisplay';
import ProtectionDialog from '../ProtectionDialog';
import CountdownTimer from '../CountdownTimer';
import LootClaimModal from '../loot/LootClaimModal';
import { CURRENCY_NAMES } from '../../config/constants';
import type { LootItem } from '../../contexts/GameContext';

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

const RARITY_BORDER: Record<string, string> = {
    common: 'border-gray-400',
    uncommon: 'border-green-500',
    rare: 'border-blue-500',
    epic: 'border-purple-500',
    legendary: 'border-yellow-500',
};

const Rewards = () => {
    const { rewardsState, claimDailyReward, claimWeeklyReward, refreshRewardStatus, lootItems, fetchLootItems } = useGame();
    const { refreshAchievements } = useAchievements();
    const navigate = useNavigate();
    const [selectedLootItem, setSelectedLootItem] = useState<LootItem | null>(null);

    // Fetch loot items on page load
    useEffect(() => {
        fetchLootItems();
    }, [fetchLootItems]);

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
    const hasWeeklyUnlocked = rewardsState.hasWeeklyUnlocked;
    const hasStakingUnlocked = rewardsState.hasStakingUnlocked;

    // Check streak requirements
    const canPurchaseDailyProtection = (streakStatus?.streakDays || 0) >= 7;
    const canPurchaseWeeklyProtection = (weeklyStatus?.weeklyStreak || 0) >= 28;

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

    const AchievementIcon: React.FC<AchievementIconProps> = ({ unlocked, name }) => {
        const icon = (
            <div className={`
                flex items-center justify-center w-8 h-8 rounded-full
                ${unlocked 
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400' 
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
        <div className="mb-6">
            <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{streakStatus?.streakDays || 0 % 7}/7 days</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(streakStatus?.streakDays || 0 % 7) / 7 * 100}%` }}
                />
            </div>
        </div>

        <div className="space-y-3">
            <button
                onClick={handleWeeklyClaim}
                disabled={!weeklyStatus?.canClaimWeekly || isClaimLoading}
                className={`w-full py-2 px-4 rounded-lg transition-colors ${
                    weeklyStatus?.canClaimWeekly
                        ? 'bg-purple-500 hover:bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isClaimLoading ? 'Claiming...' : weeklyStatus?.canClaimWeekly ? 'Claim Weekly' : 'Already Claimed'}
            </button>
            <ProtectionDialog type="weekly">
                <button
                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!canPurchaseWeeklyProtection}
                >
                    Buy Protection
                </button>
            </ProtectionDialog>
        </div>

        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <ul className="space-y-1">
                <li>• Base: 100 {CURRENCY_NAMES.SOFT}</li>
                <li>• Bonus: Up to 100%</li>
                <li>• Claim anytime during your week</li>
            </ul>
        </div>

        <div className="text-sm flex items-center gap-3 mb-2 mt-2">
            <h3 className="text-gray-800 dark:text-gray-200">
                Weekly Protection
            </h3>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
            <div>
                <ul className="space-y-1">
                    <li>• 500 {CURRENCY_NAMES.SOFT} - 14 days
                        <span className="text-sm ml-2 text-gray-500">* 4-week streak</span>
                    </li>
                </ul>
            </div>
        </div>
    </>);

    const stakingCardContent = (<>
        <div className="grid grid-cols-1 gap-3 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Apprentice</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">500 {CURRENCY_NAMES.SOFT}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Guardian</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">2,500 {CURRENCY_NAMES.SOFT}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Elder</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">10,000 {CURRENCY_NAMES.SOFT}</div>
            </div>
        </div>

        <button
            className="w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
            Stake {CURRENCY_NAMES.SOFT}
        </button>
    </>);

    const LockedOverlay: React.FC<LockedOverlayProps> = ({ children, achievementName }) => {
        const handleViewAchievement = () => {
            // Navigate to achievements page
            navigate('/achievements', { 
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

            {/* Unclaimed Loot Section */}
            {lootItems.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Package className="w-5 h-5 text-purple-500" />
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Unclaimed Loot
                        </h2>
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {lootItems.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {lootItems.map((item) => (
                            <div
                                key={item.id}
                                className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 ${RARITY_BORDER[item.box.rarity] || 'border-gray-200 dark:border-gray-700'} hover:shadow-md transition-shadow`}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                        {item.box.icon === 'egg' ? (
                                            <Gift className="w-5 h-5 text-purple-500" />
                                        ) : (
                                            <Sparkles className="w-5 h-5 text-yellow-500" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {item.box.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                            {item.box.rarity} | {item.source}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                    {item.box.description}
                                </p>
                                <button
                                    onClick={() => setSelectedLootItem(item)}
                                    className="w-full py-2 px-3 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Open
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Loot Claim Modal */}
            {selectedLootItem && (
                <LootClaimModal
                    lootItem={selectedLootItem}
                    onClose={() => setSelectedLootItem(null)}
                    onClaimed={() => fetchLootItems()}
                />
            )}

            {/* Main Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
                    {/* Daily Rewards */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full">
                        <div className="flex items-center gap-3 mb-7">
                            <Flame className="w-6 h-6 text-orange-500" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Rewards</h2>
                            
                            { !streakStatus?.canClaimToday &&
                                <div className="text-xs text-gray-900 dark:text-white ml-auto">
                                    <CountdownTimer
                                        option="midnight"
                                        onComplete={handleCountdownComplete}
                                    />
                                </div>
                            }
                        </div>
                        <div className="mb-6">
                            <div className="flex justify-between mb-2">
                                <span className="text-sm text-gray-800 dark:text-gray-200">Current Streak</span>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{streakStatus?.streakDays} days</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${(streakStatus?.streakDays || 0 % 7) / 7 * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
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
                            <ProtectionDialog type="daily">
                                <button
                                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!canPurchaseDailyProtection}
                                >
                                    Buy Protection
                                </button>
                            </ProtectionDialog>
                        </div>

                        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                            <ul className="space-y-1">
                                <li>• Base: 10 {CURRENCY_NAMES.SOFT}</li>
                                <li>• Bonus: Up to 100%</li>
                                <li>• Claim anytime during your day</li>
                            </ul>
                        </div>

                        <div className="text-sm flex items-center gap-3 mb-2 mt-2">
                            <h3 className="text-gray-800 dark:text-gray-200">
                                Streak Protection
                            </h3>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <div>
                                <ul className="space-y-1">
                                    <li>• Tier 1: 50 {CURRENCY_NAMES.SOFT} - 1 day
                                        <span className="text-sm ml-2 text-gray-500">* 7-day streak</span>
                                    </li>
                                    <li>• Tier 2: 250 {CURRENCY_NAMES.SOFT} - 7 days
                                        <span className="text-sm ml-2 text-gray-500">* 14-day streak</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Rewards */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-green-500" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Weekly Rewards
                                </h2>
                            </div>
                            <AchievementIcon unlocked={hasWeeklyUnlocked} name="Week Warrior" />
                        </div>

                        {hasWeeklyUnlocked 
                            ? weeklyCardContent 
                            : <LockedOverlay achievementName="Week Warrior">
                                {weeklyCardContent}
                            </LockedOverlay>
                        }
                    </div>

                    {/* Wise Elders Staking */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Coins className="w-6 h-6 text-purple-500" />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Wise Elders Staking
                                </h2>
                            </div>
                            <AchievementIcon unlocked={hasStakingUnlocked} name="Elder Evolution" />
                        </div>

                        {hasStakingUnlocked
                            ? stakingCardContent
                            : <LockedOverlay achievementName="Elder Evolution">
                                {stakingCardContent}
                            </LockedOverlay>
                        }
                    </div>
            </div>
    </div>
    );
};

export default Rewards;
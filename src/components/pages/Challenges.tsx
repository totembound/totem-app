import { useState, useEffect } from 'react';
import { Swords, Lock } from 'lucide-react';
import ChallengeDialog from '../challenges/ChallengeDialog';
import ChallengePanel from '../challenges/ChallengePanel';
import LootClaimModal from '../loot/LootClaimModal';
import { useGame, LootItem } from '../../contexts/GameContext';
import { DEFAULT_MAX_DAILY_ATTEMPTS } from '../../config/constants';
import { CHALLENGES } from '../../config/challenges';

// Display order: Balance first, then Strength, Agility, Wisdom; ascending stage within each (matches the Codex).
const AFFINITY_RANK: Record<string, number> = { balance: 0, strength: 1, agility: 2, wisdom: 3 };
const ORDERED_CHALLENGES = [...CHALLENGES].sort(
    (a, b) => (AFFINITY_RANK[a.type] - AFFINITY_RANK[b.type]) || (a.requirements.stage - b.requirements.stage),
);

type MainTab = 'trials' | 'arena';

interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 min-h-[44px] font-semibold ${isActive
            ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
    >
        {children}
    </button>
);

const ArenaComingSoon = () => (
    <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-md text-center p-8 rounded-xl border-2 border-gray-200 dark:border-gray-700
            bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30">
            <div className="w-12 h-12 mx-auto rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                <Swords className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
                <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400">Arena Battles</h2>
                <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
                Battle domain guardians in strategic turn-based combat.
            </p>
            <div className="mt-4 text-sm font-medium text-gray-400 dark:text-gray-500">
                Coming Soon
            </div>
        </div>
    </div>
);

const Challenges = () => {
    const {
        challengeState, refreshChallenges,
        recentTierUpChallengeId, pendingMasteryLootId, clearPendingMasteryLoot, lootItems,
    } = useGame();
    const [activeTab, setActiveTab] = useState<MainTab>('trials');
    const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
    // Mastery tier-up loot box queued for an in-place reveal (reuses LootClaimModal).
    const [revealLootItem, setRevealLootItem] = useState<LootItem | null>(null);

    // Load challenges on page mount (lazy — not loaded globally)
    useEffect(() => {
        refreshChallenges();
    }, [refreshChallenges]);

    const currentChallenge = CHALLENGES.find(c => c.id === selectedChallenge);

    // Close the challenge dialog; if the run that just finished granted a mastery
    // tier-up loot box, surface the existing reveal flow right here (no trip to
    // Rewards needed). Deferred until close so the reveal never stacks on top of
    // the run's own success/score moment. lootItems was already refreshed by
    // GameContext on the tier-up (action-triggered — no polling).
    const handleDialogClose = () => {
        setSelectedChallenge(null);
        if (pendingMasteryLootId) {
            const granted = lootItems.find(item => item.id === pendingMasteryLootId) ?? null;
            clearPendingMasteryLoot();
            if (granted) setRevealLootItem(granted);
        }
    };

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
            {/* Welcome */}
            <div className="border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-grow">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Challenges
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Complete daily challenges to earn experience and improve your Totem's abilities.
                            Each challenge has 5 attempts per day.
                        </p>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <TabButton isActive={activeTab === 'trials'} onClick={() => setActiveTab('trials')}>
                        Totem Trials
                    </TabButton>
                    <TabButton isActive={activeTab === 'arena'} onClick={() => setActiveTab('arena')}>
                        Arena Battles
                    </TabButton>
                </div>

                {activeTab === 'trials' && (
                    <section>
                        {/* Challenge Grid — all 12 challenges, Balance first then Strength/Agility/Wisdom, by stage */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {ORDERED_CHALLENGES.map(challenge => {
                                const apiChallenge = challengeState.challenges[challenge.id];
                                const status = challengeState.userStatus[challenge.id];
                                const highScore = status?.highScore || 0;
                                const maxAttempts = apiChallenge?.maxDailyAttempts || DEFAULT_MAX_DAILY_ATTEMPTS;
                                const attemptsLeft = status?.attemptsRemaining ?? maxAttempts;
                                const requirements = apiChallenge?.requirements ?? challenge.requirements;
                                const maxScore = apiChallenge?.maxScore ?? challenge.maxScore;

                                return (
                                    <ChallengePanel
                                        key={challenge.id}
                                        id={challenge.id}
                                        title={challenge.name}
                                        description={challenge.description}
                                        image={challenge.image}
                                        affinityType={challenge.type}
                                        highScore={Number(highScore)}
                                        attemptsLeft={attemptsLeft}
                                        maxAttempts={maxAttempts}
                                        maxScore={maxScore}
                                        mastery={apiChallenge?.mastery}
                                        justTieredUp={recentTierUpChallengeId === challenge.id}
                                        requirements={requirements}
                                        onStart={() => setSelectedChallenge(challenge.id)}
                                    />
                                );
                            })}
                        </div>
                    </section>
                )}

                {activeTab === 'arena' && <ArenaComingSoon />}

                {/* Challenge Dialog */}
                {selectedChallenge && currentChallenge && (
                    <ChallengeDialog
                        challengeId={currentChallenge.id}
                        title={currentChallenge.name}
                        isOpen={selectedChallenge !== null}
                        onClose={handleDialogClose}
                        challengeType={currentChallenge.type}
                        requirements={challengeState.challenges[currentChallenge.id]?.requirements ?? currentChallenge.requirements}
                    />
                )}

                {/* Mastery tier-up loot reveal — same LootClaimModal the Rewards page uses.
                    claimLootItem (inside the modal) already removes the box from context
                    state on claim, so no extra refetch is needed here. */}
                {revealLootItem && (
                    <LootClaimModal
                        lootItem={revealLootItem}
                        onClose={() => setRevealLootItem(null)}
                        onClaimed={() => {}}
                    />
                )}
            </div>
        </div>
    );
};

export default Challenges;

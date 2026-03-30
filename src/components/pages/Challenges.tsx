import { useState, useEffect } from 'react';
import ChallengeDialog from '../challenges/ChallengeDialog';
import ChallengePanel from '../challenges/ChallengePanel';
import { useGame } from '../../contexts/GameContext';
import { DEFAULT_MAX_DAILY_ATTEMPTS } from '../../config/constants';

type AffinityType = 'strength' | 'agility' | 'wisdom' | 'balance';

interface Challenge {
    id: string;
    title: string;
    description: string;
    image: string;
    type: AffinityType;
    requirements: {
        stage: number;
        strength: number;
        agility: number;
        wisdom: number;
    };
}

const strengthChallenges: Challenge[] = [
    {
        id: 'chl_boulder-breaker',
        type: 'strength',
        title: 'Boulder Breaker',
        description: 'Break a massive rock by timing your strikes correctly. Strength determines power and speed. Harder levels add resistance.',
        image: '/challenges/breaking-background.png',
        requirements: {
            stage: 2,
            strength: 10,
            agility: 5,
            wisdom: 5
        }
    },
    {
        id: 'chl_totem-wrestling',
        type: 'strength',
        title: 'Totem Wrestling',
        description: 'Push against a guardian spirit in a strength duel. Tap rapidly to overpower it. Strength affects endurance and resistance.',
        image: '/challenges/wrestling-ring-background.png',
        requirements: {
            stage: 3,
            strength: 13,
            agility: 8,
            wisdom: 8
        }
    },
    {
        id: 'chl_rockfall-defense',
        type: 'strength',
        title: 'Rockfall Defense',
        description: 'Block falling boulders by clicking in the right zones. Strength increases stamina for longer survival. Higher levels add unpredictable patterns.',
        image: '/challenges/rockfall-defense-background.png',
        requirements: {
            stage: 4,
            strength: 16,
            agility: 10,
            wisdom: 10
        }
    }
];

const agilityChallenges: Challenge[] = [
    {
        id: 'chl_spirit-path',
        type: 'agility',
        title: 'Spirit Path Navigation',
        description: 'Navigate a magical path of vanishing tiles, racing from start to finish before the ground disappears beneath you.',
        image: '/challenges/spiritpath-background.png',
        requirements: {
            stage: 2,
            strength: 5,
            agility: 10,
            wisdom: 5
        }
    },
    {
        id: 'chl_aerial-ring-dive',
        type: 'agility',
        title: 'Aerial Ring Dive',
        description: 'Fly through shifting rings in the air. Agility improves control. Missing too many rings voids the attempt.',
        image: '/challenges/aerial-ring-background.png',
        requirements: {
            stage: 3,
            strength: 8,
            agility: 13,
            wisdom: 8
        }
    },
    {
        id: 'chl_spirit-dance',
        type: 'agility',
        title: 'Totem Spirit Dance',
        description: 'Tap in rhythm with spirit drum beats. Agility determines timing accuracy. Harder levels add offbeat sections.',
        image: '/challenges/totem-spirit-background.png',
        requirements: {
            stage: 4,
            strength: 10,
            agility: 16,
            wisdom: 10
        }
    }
];

const wisdomChallenges: Challenge[] = [
    {
        id: 'chl_ancient-runes',
        type: 'wisdom',
        title: 'Ancient Runes Decoding',
        description: 'Memorize and repeat glowing rune patterns. Wisdom increases memory retention and mistake tolerance. Higher levels add speed.',
        image: '/challenges/ancient-runes-background.png',
        requirements: {
            stage: 2,
            strength: 5,
            agility: 5,
            wisdom: 10
        }
    },
    {
        id: 'chl_star-mapping',
        type: 'wisdom',
        title: 'Celestial Star Mapping',
        description: 'Connect stars to form constellations. Wisdom provides hints and reduces errors. Higher difficulty means more complex patterns.',
        image: '/challenges/celestial-star-background.png',
        requirements: {
            stage: 3,
            strength: 8,
            agility: 8,
            wisdom: 13
        }
    },
    {
        id: 'chl_spirit-weaving',
        type: 'wisdom',
        title: 'Spirit Weaving Runes',
        description: 'Align magical runes in the correct order. Incorrect placements disrupt the pattern. Wisdom slows instability.',
        image: '/challenges/spirit-weaving-background.png',
        requirements: {
            stage: 4,
            strength: 10,
            agility: 10,
            wisdom: 16
        }
    }
];

const balanceChallenges: Challenge[] = [
    {
        id: 'chl_garden-pest-patrol',
        type: 'balance',
        title: 'Garden Pest Patrol',
        description: 'Start your totems journey by protecting the garden. Use your instinct and reflexes to smack down those pesky moles where they pop up.',
        image: '/challenges/first-path-challenge.jpg',
        requirements: {
            stage: 1,
            strength: 1,
            agility: 1,
            wisdom: 1
        }
    }
]

interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-2 py-2 font-semibold ${isActive
            ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
    >
        {children}
    </button>
);

const Challenges = () => {
    const { challengeState, refreshChallenges } = useGame();
    const [activeTab, setActiveTab] = useState('balance');
    const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

    // Load challenges on page mount (lazy — not loaded globally)
    useEffect(() => {
        refreshChallenges();
    }, [refreshChallenges]);

    const getSelectedChallenge = (): Challenge | undefined => {
        const allChallenges = [...strengthChallenges, ...agilityChallenges, ...wisdomChallenges, ...balanceChallenges];
        return allChallenges.find(c => c.id === selectedChallenge);
    };

    const getCurrentChallenges = () => {
        switch (activeTab) {
            case 'strength':
                return strengthChallenges;
            case 'agility':
                return agilityChallenges;
            case 'wisdom':
                return wisdomChallenges;
            case 'balance':
                return balanceChallenges;
        }
    };

    const currentChallenge = getSelectedChallenge();

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

                {/* Trials Section */}
                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Totem Trials</h2>

                    {/* Challenge Type Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-2">
                        <TabButton
                            isActive={activeTab === 'balance'}
                            onClick={() => setActiveTab('balance')}
                        >
                            Rites
                        </TabButton>
                        <TabButton
                            isActive={activeTab === 'strength'}
                            onClick={() => setActiveTab('strength')}
                        >
                            Strength
                        </TabButton>
                        <TabButton
                            isActive={activeTab === 'agility'}
                            onClick={() => setActiveTab('agility')}
                        >
                            Agility
                        </TabButton>
                        <TabButton
                            isActive={activeTab === 'wisdom'}
                            onClick={() => setActiveTab('wisdom')}
                        >
                            Wisdom
                        </TabButton>
                    </div>

                    {/* Challenge Info */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {activeTab === 'balance' && "Mark your journey by completing these rites and strengthening your bond with your totems."}
                        {activeTab === 'strength' && "Test your totem's raw power with these strength-based challenges."}
                        {activeTab === 'agility' && "Push your totem's speed and reflexes to the limit."}
                        {activeTab === 'wisdom' && "Challenge your totem's mental acuity and problem-solving abilities."}
                    </p>

                    {/* Challenge Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {getCurrentChallenges()?.map(challenge => {
                            // Web2: Use plain string IDs
                            const apiChallenge = challengeState.challenges[challenge.id];
                            const status = challengeState.userStatus[challenge.id];
                            const highScore = status?.highScore || 0;
                            const maxAttempts = apiChallenge?.maxDailyAttempts || DEFAULT_MAX_DAILY_ATTEMPTS;
                            const attemptsLeft = status?.attemptsRemaining ?? maxAttempts;
                            const requirements = apiChallenge?.requirements ?? challenge.requirements;

                            return (
                            <ChallengePanel
                                key={challenge.id}
                                id={challenge.id}
                                title={challenge.title}
                                description={challenge.description}
                                image={challenge.image}
                                affinityType={challenge.type || 'strength'}
                                highScore={Number(highScore)}
                                attemptsLeft={attemptsLeft}
                                maxAttempts={maxAttempts}
                                requirements={requirements}
                                onStart={() => setSelectedChallenge(challenge.id)}
                            />)
                        })}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Arena Battles</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Coming soon!
                    </p>
                </section>

                {/* Challenge Dialog */}
                {selectedChallenge && (
                    <ChallengeDialog
                        challengeId={currentChallenge?.id || ''}
                        title={currentChallenge?.title || 'Challenge'}
                        isOpen={selectedChallenge !== null}
                        onClose={() => setSelectedChallenge(null)}
                        challengeType={currentChallenge?.type || 'strength'}
                        requirements={challengeState.challenges[currentChallenge?.id ?? '']?.requirements ?? currentChallenge?.requirements!}
                    />
                )}
            </div>
        </div>
    );
};

export default Challenges;
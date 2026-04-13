import { useState, useEffect } from 'react';
import ChallengeDialog from '../challenges/ChallengeDialog';
import ChallengePanel from '../challenges/ChallengePanel';
import { useGame } from '../../contexts/GameContext';
import { DEFAULT_MAX_DAILY_ATTEMPTS } from '../../config/constants';
import { CHALLENGES, type AffinityType } from '../../config/challenges';

const challengesByType = {
    balance: CHALLENGES.filter(c => c.type === 'balance'),
    strength: CHALLENGES.filter(c => c.type === 'strength'),
    agility: CHALLENGES.filter(c => c.type === 'agility'),
    wisdom: CHALLENGES.filter(c => c.type === 'wisdom'),
};

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
    const [activeTab, setActiveTab] = useState<AffinityType>('balance');
    const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

    // Load challenges on page mount (lazy — not loaded globally)
    useEffect(() => {
        refreshChallenges();
    }, [refreshChallenges]);

    const getSelectedChallenge = () => {
        return CHALLENGES.find(c => c.id === selectedChallenge);
    };

    const currentChallenges = challengesByType[activeTab] || [];
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
                        {currentChallenges.map(challenge => {
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
                                title={challenge.name}
                                description={challenge.description}
                                image={challenge.image}
                                affinityType={challenge.type}
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
                {selectedChallenge && currentChallenge && (
                    <ChallengeDialog
                        challengeId={currentChallenge.id}
                        title={currentChallenge.name}
                        isOpen={selectedChallenge !== null}
                        onClose={() => setSelectedChallenge(null)}
                        challengeType={currentChallenge.type}
                        requirements={challengeState.challenges[currentChallenge.id]?.requirements ?? currentChallenge.requirements}
                    />
                )}
            </div>
        </div>
    );
};

export default Challenges;

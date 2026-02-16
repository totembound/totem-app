import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import { RunesDisplayPouch } from '../RunesDisplay';
import TokensDisplay from '../TokensDisplay';
import ExpeditionPanel from '../expeditions/ExpeditionPanel';
import ActiveExpeditionPanel from '../expeditions/ActiveExpeditionPanel';
import ExpeditionSelectionDialog from '../expeditions/ExpeditionSelectionDialog';
import { Database, RefreshCw } from 'lucide-react';
import { Affinity } from '../../types/types';

// Import expedition data
import expeditionData from '../data/expeditions.json';

// Domains for filtering
const domains = [
  { id: -1, name: 'All' },
  { id: 0, name: 'Air' },
  { id: 1, name: 'Earth' },
  { id: 2, name: 'Water' }
];

// Duration options for filtering
const durations = [
  { id: -1, name: 'All' },
  { id: 0.5, name: '30 Minutes'},
  { id: 3, name: '3 Hours' },
  { id: 6, name: '6 Hours' },
  { id: 12, name: '12 Hours' },
  { id: 24, name: '24 Hours' }
];

const Expeditions: React.FC = () => {
    // Web2: No provider needed - use REST API
    const { isSignedUp, totems, essenceBalance } = useUser();
    const { getUserRuneBalances, expeditionState, refreshExpeditions, startExpedition, claimExpeditionRewards } = useGame();
    const { refreshAchievements } = useAchievements();
    
    // State for expedition filters
    const [domainFilter, setDomainFilter] = useState(-1);
    const [durationFilter, setDurationFilter] = useState(-1);
    const [selectedExpedition, setSelectedExpedition] = useState<string | null>(null);

    // State for expedition dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load data when component mounts
    useEffect(() => {
        if (isSignedUp) {
            refreshExpeditions();
            getUserRuneBalances();
        }
    }, [isSignedUp, refreshExpeditions, getUserRuneBalances]);

    // Helper to check if user can start an expedition
    const canStartExpedition = (expeditionId: string) => {
        const expedition = expeditionData.find(exp => exp.id === expeditionId);

        if (!expedition) return false;

        // Check Essence balance
        const requiredTokens = Number(expedition.essenceCost);
        const userBalance = Number(essenceBalance);

        if (userBalance < requiredTokens) return false;

        // Check if user has 3 eligible totems
        return totems.length >= 3;
    };

    // Filter expeditions
    const filteredExpeditions = expeditionData.filter(expedition => {
        if (domainFilter !== -1 && expedition.domain !== domainFilter) return false;
        if (durationFilter !== -1 && expedition.durationHours !== durationFilter) return false;
        return true;
    });

    // Handle expedition selection
    const handleExpeditionSelect = (expeditionId: string) => {
        setSelectedExpedition(expeditionId);
        setIsDialogOpen(true);
    };

    // Handle expedition start
    const handleStartExpedition = async (expeditionId: string, totemIds: string[]) => {
        // Web2: Use plain IDs instead of BigInt/hashed IDs
        const result = await startExpedition(expeditionId, totemIds as any);

        if (result) {
            setIsDialogOpen(false);
            refreshExpeditions();
        }

        return result;
    };

    const handleClaimExpedition = async (expeditionId: string) => {
        try {
            const result = await claimExpeditionRewards(expeditionId);
            if (result) {
                // Refresh data after claiming
                refreshExpeditions();
                getUserRuneBalances();
                refreshAchievements();
            }
        }
        catch (error) {
            console.error("Error claiming expedition rewards:", error);
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        
        // Perform the refresh actions
        refreshExpeditions();
        getUserRuneBalances();
        
        // Reset the animation after a short delay
        setTimeout(() => {
          setIsRefreshing(false);
        }, 750); // Animation duration
    };
      
    // Find active expedition by ID (if it exists)
    const findActiveExpedition = (expeditionId: string) => {
        // Web2: Use plain expedition IDs
        return expeditionState.userExpeditions.find(exp =>
            exp.expeditionId === expeditionId && !exp.completed
        );
    };

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">Expeditions</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Send your Totems to earn XP and runes. Match domains and affinities for better results.
                    </p>
                </div>
                <TokensDisplay />
            </div>

            {/* Runes & Filters Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                {/* Rune Collection - Monster Hunter Style */}
                <RunesDisplayPouch />

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={domainFilter}
                        onChange={(e) => setDomainFilter(Number(e.target.value))}
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {domains.map(domain => (
                            <option key={domain.id} value={domain.id}>
                                {domain.id === -1 ? 'All Domains' : domain.name}
                            </option>
                        ))}
                    </select>

                    <select
                        value={durationFilter}
                        onChange={(e) => setDurationFilter(Number(e.target.value))}
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {durations.map(duration => (
                            <option key={duration.id} value={duration.id}>
                                {duration.id === -1 ? 'All Durations' : duration.name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleRefresh}
                        className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-4">

                {/* Expeditions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {filteredExpeditions.map(expedition => {
                         // Check if there's an active expedition of this type
                         const activeExpedition = findActiveExpedition(expedition.id);
                         
                        // If active, show active panel, otherwise show start panel
                        return activeExpedition ? (
                            <ActiveExpeditionPanel
                                key={expedition.id}
                                expedition={activeExpedition}
                                expeditionConfig={expedition}
                                onClaim={() => handleClaimExpedition(activeExpedition.totemIds[0])}
                            />
                        ) : (
                        <ExpeditionPanel
                            key={expedition.id}
                            id={expedition.id}
                            name={expedition.name}
                            description={expedition.description}
                            image={expedition.image}
                            domain={expedition.domain}
                            domainName={expedition.domainName}
                            duration={expedition.duration}
                            durationHours={expedition.durationHours}
                            essenceCost={expedition.essenceCost}
                            happinessCost={expedition.happinessCost}
                            baseExperience={expedition.baseExperience}
                            primaryAffinity={Affinity[expedition.primaryAffinity as keyof typeof Affinity]}
                            runeDropChances={expedition.runeDropChances as [number, number, number]}
                            enabled={expedition.enabled}
                            minStage={expedition.minStage}
                            onStart={() => handleExpeditionSelect(expedition.id)}
                            canStart={canStartExpedition(expedition.id)}
                        />
                        );
                    })}
                </div>
                
                {/* Empty State */}
                {filteredExpeditions.length === 0 && (
                    <div className="mt-8 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <Database className="w-12 h-12 text-gray-400 mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            No Expeditions Found
                        </h2>
                        <p className="text-center text-gray-600 dark:text-gray-400 max-w-md">
                            Try adjusting your filters or check back later for new expeditions.
                        </p>
                    </div>
                )}
            </div>
            {/* Expedition Selection Dialog */}
            {isDialogOpen && selectedExpedition && (
                <ExpeditionSelectionDialog
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    expeditionId={selectedExpedition}
                    onStart={handleStartExpedition}
                />
            )}
        </div>
    );
};

export default Expeditions;
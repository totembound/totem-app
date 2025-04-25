import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import RunesDisplay from '../RunesDisplay';
import TokensDisplay from '../TokensDisplay';
import ExpeditionPanel from '../expeditions/ExpeditionPanel';
import ActiveExpeditionPanel from '../expeditions/ActiveExpeditionPanel';
import ExpeditionSelectionDialog from '../expeditions/ExpeditionSelectionDialog';
import { Filter, Database, RefreshCw, Shapes } from 'lucide-react';

// Import expedition data
import expeditionData from '../data/expeditions.json';

// Domains for filtering
const domains = [
  { id: -1, name: 'All' },
  { id: 0, name: 'Land' },
  { id: 1, name: 'Air' },
  { id: 2, name: 'Water' }
];

// Duration options for filtering
const durations = [
  { id: -1, name: 'All' },
  { id: 3, name: '3 Hours' },
  { id: 6, name: '6 Hours' },
  { id: 12, name: '12 Hours' },
  { id: 24, name: '24 Hours' }
];

const Expeditions: React.FC = () => {
    const { isSignedUp, totems, totemBalance, provider } = useUser();
    const { getUserRuneBalances, runeBalances, expeditionState, refreshExpeditions, startExpedition, claimExpeditionRewards } = useGame();
    
    // State for expedition filters
    const [domainFilter, setDomainFilter] = useState(-1);
    const [durationFilter, setDurationFilter] = useState(-1);
    const [selectedExpedition, setSelectedExpedition] = useState<string | null>(null);

    // State for expedition dialog
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
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

        // Check TOTEM balance
        const requiredTokens = BigInt(expedition.totemCost);
        const userBalance = ethers.parseEther(totemBalance);
        
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
        const bigIntTokenIds = totemIds.map(id => BigInt(id));
        const id = ethers.id(expeditionId);
        const result = await startExpedition(id, bigIntTokenIds as any);
        
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
            }
        }
        catch (error) {
            console.error("Error claiming expedition rewards:", error);
        }
    };

    // Find active expedition by ID (if it exists)
    const findActiveExpedition = (expeditionId: string) => {
        const id = ethers.id(expeditionId);
        return expeditionState.userExpeditions.find(exp => 
            exp.expeditionId === id && !exp.completed
        );
    };

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
            {/* Header Section */}
            <div className="border-gray-200 dark:border-gray-700 space-y-4">
                {/* Welcome & Balance Area */}
                <div className="mb-4 space-y-4 sm:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Expeditions</h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Send your Totems on expeditions to earn experience and runes.
                            </p>
                        </div>
                        
                        <TokensDisplay/>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                        Different domains and affinities provide better results for specific expeditions.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    {/* Resources Section */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1">
                            <Shapes className="w-5 h-5 text-gray-500 fill-gray-500"/>
                            <h2 className="font-semibold text-gray-600 dark:text-gray-400">
                                Rune Collection
                            </h2>
                        </div>
                        <RunesDisplay />
                    </div>

                    {/* Expedition Filters */}
                    <div className="flex flex-wrap items-center gap-4 mt-auto">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Filters:
                            </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={domainFilter}
                                onChange={(e) => setDomainFilter(Number(e.target.value))}
                                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {domains.map(domain => (
                                    <option key={domain.id} value={domain.id}>
                                        {domain.name}
                                    </option>
                                ))}
                            </select>
                            
                            <select
                                value={durationFilter}
                                onChange={(e) => setDurationFilter(Number(e.target.value))}
                                className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                {durations.map(duration => (
                                    <option key={duration.id} value={duration.id}>
                                        {duration.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button 
                            onClick={() => {
                                refreshExpeditions();
                                getUserRuneBalances();
                            }}
                            className="flex items-center gap-2 p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="hidden sm:text-sm md:inline">Refresh</span>
                        </button>
                    </div>
                </div>

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
                                onClaim={() => handleClaimExpedition(expedition.id)}
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
                            totemCost={expedition.totemCost}
                            happinessCost={expedition.happinessCost}
                            baseExperience={expedition.baseExperience}
                            primaryAffinity={expedition.primaryAffinity}
                            runeDropChances={expedition.runeDropChances as [number, number, number]}
                            enabled={expedition.enabled}
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
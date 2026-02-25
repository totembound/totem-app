import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChartBar, ScrollText } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useGame } from '../../contexts/GameContext';
import { useUser } from '../../contexts/UserContext';
import { TotemData, Rarity, Species } from '../../types/types';
import TotemDetailView from '../TotemDetailView';
import { TotemGridCard, TotemListRow } from '../TotemGridAndListView';
import Toolbar from '../layouts/GalleryToolbar';
import TotemGalleryStats from './TotemGalleryStats';
import { getTotemImageUrl } from '../../utils/species';

type SortDirection = 'asc' | 'desc';
type SortKey = 'created' | 'experience' | 'happiness' | 'stage';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const TotemGallery = () => {
    const location = useLocation();
    const { isTotemAvailable, expeditionState } = useGame();
    const { isAuthenticated } = useAuth();
    const {
        totems,
        totemLoading,
        totemError,
        fetchTotems,
        updateTotemAttributes: contextUpdateTotemAttributes
    } = useUser();

    // Wrapper to also update selectedTotem when attributes change
    const updateTotemAttributes = useCallback((
        totemId: string,
        updates: {
            experience?: number;
            happiness?: number;
            stage?: number;
            nickname?: string | null;
            displayName?: string;
            strength?: number;
            agility?: number;
            wisdom?: number;
        }
    ) => {
        // Update context totems (single source of truth)
        contextUpdateTotemAttributes(totemId, updates);

        // Also update selectedTotem if it's the same one
        setSelectedTotem(prev => {
            if (prev && prev.id === totemId) {
                // Compute new image URL if stage changed
                let newImage = prev.image;
                if (updates.stage !== undefined) {
                    const speciesId = prev.attributes.species;
                    const colorId = prev.attributes.color;
                    newImage = getTotemImageUrl(speciesId, colorId, updates.stage);
                }

                return {
                    ...prev,
                    image: newImage,
                    ...(updates.displayName !== undefined && { displayName: updates.displayName }),
                    attributes: {
                        ...prev.attributes,
                        ...(updates.experience !== undefined && { experience: updates.experience }),
                        ...(updates.happiness !== undefined && { happiness: updates.happiness }),
                        ...(updates.stage !== undefined && { stage: updates.stage }),
                        ...(updates.nickname !== undefined && { nickname: updates.nickname }),
                        ...(updates.strength !== undefined && { strength: updates.strength }),
                        ...(updates.agility !== undefined && { agility: updates.agility }),
                        ...(updates.wisdom !== undefined && { wisdom: updates.wisdom }),
                    }
                };
            }
            return prev;
        });
    }, [contextUpdateTotemAttributes]);

    // Load totems on mount and when auth changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchTotems();
        }
    }, [isAuthenticated, fetchTotems]);

    // State Management
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedTotem, setSelectedTotem] = useState<TotemData | null>(null!);
    const [filters, setFilters] = useState({
        species: '',
        rarity: '',
        stage: '',
        affinity: '',
        domain: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'created',
        direction: 'desc'
    });
    const [showStats, setShowStats] = useState(false);
    const itemsPerPage = 8;

    const sortTotems = (totems: TotemData[]) => {
        return [...totems].sort((a, b) => {
            const multiplier = sortConfig.direction === 'desc' ? -1 : 1;
            switch (sortConfig.key) {
                case 'created':
                    // Web2: Sort by string ID (ULID is lexicographically sortable)
                    return multiplier * b.id.localeCompare(a.id);
                case 'experience':
                    return multiplier * (b.attributes.experience - a.attributes.experience);
                case 'happiness':
                    return multiplier * (b.attributes.happiness - a.attributes.happiness);
                case 'stage':
                    return multiplier * (b.attributes.stage - a.attributes.stage);
                default:
                    return 0;
            }
        });
    };

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getExpeditionEndTime = (totemId: string): number => {
        const expedition = expeditionState.userExpeditions.find(exp =>
            !exp.completed && exp.totemIds.some(id => id.toString() === totemId)
        );
        return expedition ? expedition.endTime : 0;
    };

    // Filter NFTs
    const filteredTotems = totems.filter(nft => {
        return (
            (!filters.species || Species[nft.attributes.species] === filters.species) &&
            (!filters.rarity || Rarity[nft.attributes.rarity] === filters.rarity) &&
            (!filters.stage || nft.attributes.stage.toString() === filters.stage) &&
            (!filters.affinity || nft.affinity === filters.affinity) &&
            (!filters.domain || nft.domain === filters.domain)
        );
    });

    const sortedAndFilteredNFTs = sortTotems(filteredTotems);
    const totalPages = Math.max(1, Math.ceil(sortedAndFilteredNFTs.length / itemsPerPage));

    // Navigation handlers
    const handlePrevTotem = () => {
        if (!selectedTotem) return;
        const currentIndex = sortedAndFilteredNFTs.findIndex(t => t.id === selectedTotem.id);
        if (currentIndex > 0) {
            setSelectedTotem(sortedAndFilteredNFTs[currentIndex - 1]);
        }
    };

    const handleNextTotem = () => {
        if (!selectedTotem) return;
        const currentIndex = sortedAndFilteredNFTs.findIndex(t => t.id === selectedTotem.id);
        if (currentIndex < sortedAndFilteredNFTs.length - 1) {
            setSelectedTotem(sortedAndFilteredNFTs[currentIndex + 1]);
        }
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    // Preselect totem from navigation state (e.g., tutorial wizard link) — only once
    const hasConsumedPreselection = useRef(false);
    useEffect(() => {
        if (hasConsumedPreselection.current) return;

        const preselectedTotemId = location.state?.selectedTotemId;
        if (!preselectedTotemId) {
            hasConsumedPreselection.current = true;
            return;
        }

        const preselectedTotem = totems.find((totem) => totem.id === preselectedTotemId);
        if (preselectedTotem) {
            setSelectedTotem(preselectedTotem);
            hasConsumedPreselection.current = true;
        }
    }, [totems, location.state?.selectedTotemId]);

    // Sync selectedTotem with context totems when they change (e.g., after action success)
    useEffect(() => {
        if (selectedTotem && totems.length > 0) {
            const updatedTotem = totems.find(t => t.id === selectedTotem.id);
            if (updatedTotem) {
                // Check if attributes or display data have changed
                const hasChanged =
                    updatedTotem.attributes.experience !== selectedTotem.attributes.experience ||
                    updatedTotem.attributes.happiness !== selectedTotem.attributes.happiness ||
                    updatedTotem.attributes.stage !== selectedTotem.attributes.stage ||
                    updatedTotem.displayName !== selectedTotem.displayName ||
                    updatedTotem.attributes.strength !== selectedTotem.attributes.strength ||
                    updatedTotem.attributes.agility !== selectedTotem.attributes.agility ||
                    updatedTotem.attributes.wisdom !== selectedTotem.attributes.wisdom ||
                    updatedTotem.image !== selectedTotem.image;

                if (hasChanged) {
                    setSelectedTotem(updatedTotem);
                }
            }
        }
    }, [totems, selectedTotem]);

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
            {/* Header Section */}
            <div className="space-y-2 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:gap-6">
                    <div className="flex-grow flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                My Totems
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Explore and manage your mystical collection of mystical companions.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
                            title={showStats ? "Hide Statistics" : "Show Statistics"}
                        >
                            <ChartBar className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Stats Section */}
                {totems.length > 0 && showStats  && <TotemGalleryStats nfts={totems} />}
                
                <Toolbar 
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={sortedAndFilteredNFTs.length}
                    filters={filters}
                    setFilters={setFilters}
                    sortConfig={sortConfig}
                    onSortChange={handleSort}
                />

                {/* Loading State */}
                {totemLoading && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your totems...</p>
                    </div>
                )}

                {/* Error State */}
                {totemError && !totemLoading && (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                        <div className="text-red-500 dark:text-red-400 mb-4">
                            <ScrollText size={48} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Failed to Load Totems
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                            {totemError}
                        </p>
                        <button
                            onClick={fetchTotems}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Main Content */}
                {!totemLoading && !totemError && sortedAndFilteredNFTs.length === 0 ? (
                     <div className="flex flex-col items-center justify-center py-4 sm:py-8 px-2 sm:px-4">
                        <div className="text-gray-400 dark:text-gray-600 mb-2 sm:mb-4">
                            <ScrollText size={32} className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16" />
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 text-center">
                            No Totems Found
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
                            {Object.values(filters).some(filter => filter !== '')
                                ? "Try adjusting your filters to see more results"
                                : "You don't have any Totems yet. Visit the Shop to get started!"}
                        </p>
                    </div>
                ) : !totemLoading && !totemError && sortedAndFilteredNFTs.length > 0 && viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2 md:gap-3">
                        {sortedAndFilteredNFTs
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((nft) => (
                                <TotemGridCard
                                    key={nft.id}
                                    nft={nft}
                                    onClick={() => setSelectedTotem(nft)}
                                    isSelected={selectedTotem?.id === nft.id}
                                    isLoading={totemLoading}
                                    isOnExpedition={!isTotemAvailable(nft.id)}
                                    expeditionEndTime={getExpeditionEndTime(nft.id)}
                                />
                            ))
                        }
                    </div>
                ) : !totemLoading && !totemError && sortedAndFilteredNFTs.length > 0 ? (
                    <div className="flex flex-col gap-1 sm:gap-2 md:gap-3">
                        {sortedAndFilteredNFTs
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((nft) => (
                                <TotemListRow
                                    key={nft.id}
                                    nft={nft}
                                    onClick={() => setSelectedTotem(nft)}
                                    isSelected={selectedTotem?.id === nft.id}
                                    isLoading={totemLoading}
                                    isOnExpedition={!isTotemAvailable(nft.id)}
                                    expeditionEndTime={getExpeditionEndTime(nft.id)}
                                />
                            ))
                        }
                    </div>
                ) : null}
            </div>

            {/* Detail View Modal - portaled to body to avoid containing block issues */}
            {selectedTotem && createPortal(
                <div className="fixed inset-0 bottom-14 sm:bottom-0 z-50 bg-white dark:bg-gray-900 sm:bg-black/50 sm:dark:bg-black/50 sm:flex sm:items-center sm:justify-center sm:p-2"
                    onClick={(e) => {
                        // Close if the click was on the background overlay (desktop only)
                        if (e.target === e.currentTarget) {
                            setSelectedTotem(null);
                        }
                    }}
                >
                    <div
                        className="h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[95vw] md:max-w-4xl sm:w-full bg-white dark:bg-gray-900 sm:rounded-lg overflow-hidden"
                        aria-modal="true"
                        role="dialog"
                    >
                        <TotemDetailView
                            totem={selectedTotem}
                            onClose={() => setSelectedTotem(null)}
                            onPrev={handlePrevTotem}
                            onNext={handleNextTotem}
                            totalTotems={sortedAndFilteredNFTs.length}
                            currentIndex={sortedAndFilteredNFTs.findIndex(t => t.id === selectedTotem.id)}
                            onUpdateTotemAttributes={updateTotemAttributes}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default TotemGallery;
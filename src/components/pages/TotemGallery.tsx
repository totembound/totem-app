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

    // Filter totems
    const filteredTotems = totems.filter(totem => {
        return (
            (!filters.species || Species[totem.attributes.species] === filters.species) &&
            (!filters.rarity || Rarity[totem.attributes.rarity] === filters.rarity) &&
            (!filters.stage || totem.attributes.stage.toString() === filters.stage) &&
            (!filters.affinity || totem.affinity === filters.affinity) &&
            (!filters.domain || totem.domain === filters.domain)
        );
    });

    const sortedAndFilteredTotems = sortTotems(filteredTotems);
    const totalPages = Math.max(1, Math.ceil(sortedAndFilteredTotems.length / itemsPerPage));

    // Navigation handlers
    const handlePrevTotem = () => {
        if (!selectedTotem || sortedAndFilteredTotems.length === 0) return;
        const currentIndex = sortedAndFilteredTotems.findIndex(t => t.id === selectedTotem.id);
        const prevIndex = currentIndex <= 0 ? sortedAndFilteredTotems.length - 1 : currentIndex - 1;
        setSelectedTotem(sortedAndFilteredTotems[prevIndex]);
    };

    const handleNextTotem = () => {
        if (!selectedTotem || sortedAndFilteredTotems.length === 0) return;
        const currentIndex = sortedAndFilteredTotems.findIndex(t => t.id === selectedTotem.id);
        const nextIndex = currentIndex >= sortedAndFilteredTotems.length - 1 ? 0 : currentIndex + 1;
        setSelectedTotem(sortedAndFilteredTotems[nextIndex]);
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
                    updatedTotem.traits?.innate !== selectedTotem.traits?.innate ||
                    updatedTotem.traits?.learned !== selectedTotem.traits?.learned ||
                    updatedTotem.traits?.awakened !== selectedTotem.traits?.awakened ||
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
                    totalItems={sortedAndFilteredTotems.length}
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
                {!totemLoading && !totemError && sortedAndFilteredTotems.length === 0 ? (
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
                ) : !totemLoading && !totemError && sortedAndFilteredTotems.length > 0 && viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2 md:gap-3">
                        {sortedAndFilteredTotems
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((totem) => (
                                <TotemGridCard
                                    key={totem.id}
                                    nft={totem}
                                    onClick={() => setSelectedTotem(totem)}
                                    isSelected={selectedTotem?.id === totem.id}
                                    isLoading={totemLoading}
                                    isOnExpedition={!isTotemAvailable(totem.id)}
                                    expeditionEndTime={getExpeditionEndTime(totem.id)}
                                />
                            ))
                        }
                    </div>
                ) : !totemLoading && !totemError && sortedAndFilteredTotems.length > 0 ? (
                    <div className="flex flex-col gap-1 sm:gap-2 md:gap-3">
                        {sortedAndFilteredTotems
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((totem) => (
                                <TotemListRow
                                    key={totem.id}
                                    nft={totem}
                                    onClick={() => setSelectedTotem(totem)}
                                    isSelected={selectedTotem?.id === totem.id}
                                    isLoading={totemLoading}
                                    isOnExpedition={!isTotemAvailable(totem.id)}
                                    expeditionEndTime={getExpeditionEndTime(totem.id)}
                                />
                            ))
                        }
                    </div>
                ) : null}
            </div>

            {/* Detail View Modal - portaled to body to avoid containing block issues */}
            {selectedTotem && createPortal(
                <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 sm:bg-transparent sm:dark:bg-transparent sm:flex sm:items-center sm:justify-center sm:p-2">
                    <div className="hidden sm:block fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedTotem(null)} />
                    <div
                        className="relative h-full sm:h-auto sm:max-h-[95vh] sm:max-w-[95vw] md:max-w-4xl sm:w-full bg-white dark:bg-gray-900 sm:rounded-lg overflow-hidden flex flex-col"
                        aria-modal="true"
                        role="dialog"
                    >
                        <TotemDetailView
                            totem={selectedTotem}
                            onClose={() => setSelectedTotem(null)}
                            onPrev={handlePrevTotem}
                            onNext={handleNextTotem}
                            totalTotems={sortedAndFilteredTotems.length}
                            currentIndex={sortedAndFilteredTotems.findIndex(t => t.id === selectedTotem.id)}
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
import { useState, useEffect } from 'react';
import { ChartBar, ScrollText } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import { NFTMetadata, Rarity, Species } from '../../types/types';
import TotemDetailView from '../TotemDetailView';
import { TotemGridCard, TotemListRow } from '../TotemGridAndListView';
import Toolbar from '../layouts/GalleryToolbar';
import _ from 'lodash';
import TotemGalleryStats from './TotemGalleryStats';

type SortDirection = 'asc' | 'desc';
type SortKey = 'created' | 'experience' | 'happiness' | 'stage';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const TotemGallery = () => {
    // State Management
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedTotem, setSelectedTotem] = useState<NFTMetadata | null>(null);
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

    // Reuse your existing hooks and state
    const { totems, totemLoading, totemError } = useUser();
    const { canUseAction } = useGame();

    const sortTotems = (totems: NFTMetadata[]) => {
        return [...totems].sort((a, b) => {
            const multiplier = sortConfig.direction === 'desc' ? -1 : 1;
            switch (sortConfig.key) {
                case 'created':
                    return multiplier * (Number(b.tokenId) - Number(a.tokenId));
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

    return (
        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg">
            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-grow flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                My Totems
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Explore and manage your mystical collection of spirit companions.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
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

                {/* Main Content */}
                {sortedAndFilteredNFTs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                        <div className="text-gray-400 dark:text-gray-600 mb-4">
                            <ScrollText size={48} className="w-12 h-12 sm:w-16 sm:h-16" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
                            No Totems Found
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center max-w-xs">
                            {Object.values(filters).some(filter => filter !== '') 
                                ? "Try adjusting your filters to see more results"
                                : "You don't have any Totems yet. Visit the Shop to get started!"}
                        </p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                        {sortedAndFilteredNFTs
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((nft) => (
                                <TotemGridCard
                                    key={nft.id}
                                    nft={nft}
                                    onClick={() => setSelectedTotem(nft)}
                                    isSelected={selectedTotem?.id === nft.id}
                                    isLoading={totemLoading}
                                />
                            ))
                        }
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {sortedAndFilteredNFTs
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((nft) => (
                                <TotemListRow
                                    key={nft.id}
                                    nft={nft}
                                    onClick={() => setSelectedTotem(nft)}
                                    isSelected={selectedTotem?.id === nft.id}
                                    isLoading={totemLoading}
                                />
                            ))
                        }
                    </div>
                )}
            </div>

            {/* Detail View Modal */}
            {selectedTotem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
                    onClick={(e) => {
                        // Only close if the click was on the background overlay
                        if (e.target === e.currentTarget) {
                            setSelectedTotem(null);
                        }
                    }}
                >
                    <div 
                        className="bg-white mx-2 mb-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                        aria-modal="true"
                        role="dialog"
                    >
                        <TotemDetailView
                            totem={selectedTotem}
                            onClose={() => setSelectedTotem(null)}
                            onPrev={handlePrevTotem}
                            onNext={handleNextTotem}
                            canUseAction={canUseAction}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default TotemGallery;
import React, { useState, useEffect, useCallback } from 'react';
import { 
    LayoutGrid, 
    List, 
    Filter, 
    ChevronLeft,
    ChevronRight,
    Coffee, 
    Heart,
    Dumbbell,
    Sparkles,
    X,
    Edit2,
    ScrollText
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import { useTotemGame } from '../../hooks/useTotemGame';
import { NFTMetadata, TotemAttributes, Rarity, Species, Color, TokenActionTrackings, ActionTracking } from '../../types/types';
import { ActionType } from '../../types/types';
import DisplayNameEditor from '../DisplayNameEditor';
import TotemDetailView from '../TotemDetailView';
import { createTotemNFTContract, createGameContract, TotemGameContract } from '../../config/contracts';
import { TotemGridCard, TotemListRow } from '../TotemGridAndListView';
import Toolbar from '../layouts/GalleryToolbar';

interface TotemCardProps {
    totem: NFTMetadata;
    onClick: () => void;
    isSelected: boolean;
    isLoading?: boolean;
}

interface Attribute {
    trait_type: string;
    value: string | number;
}
  
interface IpfsMetadata {
    attributes: Attribute[];
}

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
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'created',
        direction: 'desc'
    });
    const itemsPerPage = 8;

    // Reuse your existing hooks and state
    const { address, provider, isConnected, updateBalances, totemUpdated, totemUpdateCounter } = useUser();
    const { canUseAction } = useGame();
    const { feed, train, treat, evolve } = useTotemGame();
    const [nfts, setNfts] = useState<NFTMetadata[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingName, setEditingName] = useState<bigint | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingTokens, setLoadingTokens] = useState<Set<string>>(new Set());

    const STAGE_THRESHOLDS = [0, 500, 1500, 3500, 7500];
    const SECONDS_PER_DAY = 86400;

    // Navigation handlers
    const handlePrevTotem = () => {
        if (!selectedTotem) return;
        const currentIndex = filteredNFTs.findIndex(t => t.id === selectedTotem.id);
        if (currentIndex > 0) {
            setSelectedTotem(filteredNFTs[currentIndex - 1]);
        }
    };

    const handleNextTotem = () => {
        if (!selectedTotem) return;
        const currentIndex = filteredNFTs.findIndex(t => t.id === selectedTotem.id);
        if (currentIndex < filteredNFTs.length - 1) {
            setSelectedTotem(filteredNFTs[currentIndex + 1]);
        }
    };

    const fetchNFTs = useCallback(async () => {
            if (!provider || !address || !isConnected) return;
    
            setLoading(true);
            setError(null);
    
            try {
                const contract = createTotemNFTContract(provider);
                const tokenIds = await contract.tokensOfOwner(address);
                const gameContract = createGameContract(provider) as TotemGameContract;
    
                const trackings = await Promise.all(tokenIds.map(async (tokenId) => {
                    const tokenTrackings: {[key in ActionType]?: ActionTracking} = {};
                        
                    // Fetch tracking for each action type
                    for (const actionType of [
                            ActionType.Feed, 
                            ActionType.Train, 
                            ActionType.Treat
                        ]) {
                            try {
                                const tracking = await gameContract.getActionTracking(tokenId, actionType);
                                tokenTrackings[actionType] = {
                                    lastUsed: Math.min(Number(tracking.lastUsed), Math.floor(Date.now() / 1000)),
                                    dailyUses: Number(tracking.dailyUses),
                                    dayStartTime: Math.min(Number(tracking.dayStartTime), Math.floor(Date.now() / 1000) + SECONDS_PER_DAY)
                                };
                            } catch (err) {
                                console.error(`Error fetching tracking for token ${tokenId}, action ${actionType}:`, err);
                                // Provide default tracking
                                tokenTrackings[actionType] = {
                                    lastUsed: 0,
                                    dailyUses: 0,
                                    dayStartTime: 0
                                };
                            }
                        }
    
                        return { 
                            tokenId: tokenId.toString(), 
                            tracking: tokenTrackings 
                        };
                    }));
    
                    // Convert to a more accessible object with explicit typing
                const trackingMap: TokenActionTrackings = trackings.reduce((acc, item) => {
                    acc[item.tokenId] = item.tracking;
                    return acc;
                }, {} as TokenActionTrackings);
    
                const nftData = await Promise.all(tokenIds.map(async (tokenId) => {
                    // Get IPFS metadata
                    const uri = await contract.tokenURI(tokenId);
                    const ipfsMetadata = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/')).then(res => res.json());
                    // Get on-chain attributes
                    const attrs = await contract.attributes(tokenId) as any;
    
                    // Convert attributes to our expected format
                    const parsedAttributes: TotemAttributes = {
                        species: Number(attrs[0]),     // Species enum
                        color: Number(attrs[1]),       // Color enum
                        rarity: Number(attrs[2]),      // Rarity enum
                        happiness: Number(attrs[3]),   // uint256
                        experience: Number(attrs[4]),  // uint256
                        stage: Number(attrs[5]),       // uint256
                        isStaked: Boolean(attrs[6]),   // bool
                        displayName: attrs[7] ?? ''    // string
                    };
    
                    const affinity = ipfsMetadata.attributes.find((a: Attribute) => a.trait_type === 'Affinity')?.value;
                    const domain = ipfsMetadata.attributes.find((a: Attribute) => a.trait_type === 'Domain')?.value;

                    const parsed = {
                        id: tokenId,
                        tokenId: tokenId.toString(),
                        affinity,
                        domain,
                        ...ipfsMetadata,
                        attributes: parsedAttributes,
                        trackings: trackingMap[tokenId.toString()] || {}
                    };
                    //console.log(parsed);
                    return parsed;
                }));
    
                setNfts(nftData);
            } catch (err) {
                console.error('Error fetching NFTs:', err);
                setError('Failed to load your Totem NFTs. Please try again.');
            } finally {
                setLoading(false);
            }
        }, [provider, address, isConnected]);
    
        useEffect(() => {
            fetchNFTs();
        }, [totemUpdateCounter, fetchNFTs]);
        
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
    const filteredNFTs = nfts.filter(nft => {
        return (
            (!filters.species || Species[nft.attributes.species] === filters.species) &&
            (!filters.rarity || Rarity[nft.attributes.rarity] === filters.rarity) &&
            (!filters.stage || nft.attributes.stage.toString() === filters.stage) &&
            (!filters.affinity || nft.affinity === filters.affinity) &&
            (!filters.domain || nft.domain === filters.domain)
        );
    });

    const sortedAndFilteredNFTs = sortTotems(filteredNFTs);
    const totalPages = Math.max(1, Math.ceil(sortedAndFilteredNFTs.length / itemsPerPage));

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);
    
    return (
        <div className="container mx-auto max-w-7xl bg-gray-50 dark:bg-gray-900 rounded-lg">
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
            <div className="py-4 sm:py-6 px-2 sm:px-4">
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
                                    isLoading={loadingTokens.has(nft.tokenId.toString())}
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
                                    isLoading={loadingTokens.has(nft.tokenId.toString())}
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
                        className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
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

const TotemCard: React.FC<TotemCardProps> = ({ totem, onClick, isSelected, isLoading }) => {
    const { totemUpdates } = useUser();
    const updates = totemUpdates.get(totem.tokenId.toString());

    const getRarityColor = (rarity: Rarity) => {
        const colors = {
            [Rarity.Common]: 'text-gray-600 hover:text-gray-800',
            [Rarity.Uncommon]: 'text-green-600 hover:text-green-800',
            [Rarity.Rare]: 'text-blue-600 hover:text-blue-800',
            [Rarity.Epic]: 'text-purple-600 hover:text-purple-800',
            [Rarity.Legendary]: 'text-yellow-600 hover:text-yellow-800'
        };
        return colors[rarity] || colors[Rarity.Common];
    };

    const attributes = {
        ...totem.attributes,
        ...updates?.attributes
    };
    
    const trackings = {
        ...totem.trackings,
        ...updates?.trackings
    };


    return (
        <div 
            onClick={onClick}
            className={`
                bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer
                ${isSelected ? 'ring-2 ring-purple-500' : ''}
                ${isLoading ? 'opacity-50' : ''}
            `}
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
            )}
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
                <img 
                    src={totem.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                    alt={totem.name}
                    className="w-full h-full object-cover"
                />
                <div className={`
                    absolute inset-0 bg-gradient-to-t from-black/50 to-transparent
                    opacity-0 hover:opacity-100 transition-opacity
                    flex flex-col justify-end p-4
                `}>
                    <div className="text-white">
                        <div className="font-semibold">{totem.affinity}</div>
                        <div className="text-sm">{totem.domain}</div>
                    </div>
                </div>
            </div>
            
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">
                        {totem.attributes.displayName || Species[totem.attributes.species]}
                    </h3>
                    <span className={`text-sm font-medium ${getRarityColor(totem.attributes.rarity)}`}>
                        {Rarity[totem.attributes.rarity]}
                    </span>
                </div>
                
                <div className="text-sm text-gray-600">
                    Stage {totem.attributes.stage + 1}/5
                </div>
            </div>
        </div>
    );
};

export default TotemGallery;
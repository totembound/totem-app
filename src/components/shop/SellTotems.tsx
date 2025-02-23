import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowUpDown, Clock, Heart, Loader2, Sparkles } from 'lucide-react';
import { useTotemGame } from '../../hooks/useTotemGame';
import { useUser } from '../../contexts/UserContext';
import { Species, Rarity, NFTMetadata, Color } from '../../types/types';
import MessageDialog from '../MessageDialog';
import { Pagination } from '../layouts/Pagination';
import { getRarityBadgeColor } from '../../utils/totems';

interface SellTotemCardProps {
    totem: NFTMetadata;
    onSellClick: (totem: NFTMetadata, value: number) => void;
}

type SortDirection = 'asc' | 'desc';
type SortKey = 'created' | 'experience' | 'happiness' | 'stage';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const SellTotemCard: React.FC<SellTotemCardProps> = ({ totem, onSellClick }) => {
    const baseValue = 200; // Minimum value
    const maxBonus = 200; // Maximum additional value possible
    const stageWeight = 0.6; // Stage contributes 60% of potential bonus
    const rarityWeight = 0.4; // Rarity contributes 40% of potential bonus
    const stageBonus = (totem.attributes.stage / 4) * maxBonus * stageWeight;
    const rarityBonus = (totem.attributes.rarity / 4) * maxBonus * rarityWeight;
    const sellValue = Math.floor(baseValue + stageBonus + rarityBonus);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Totem Image */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    {totem.image ? (
                        <img
                            src={totem.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                            alt={totem.name}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-6xl text-gray-400 dark:text-gray-500">
                            {Species[totem.attributes.species] === 'Wolf' ? '🐺' :
                                Species[totem.attributes.species] === 'Otter' ? '🦦' :
                                    Species[totem.attributes.species] === 'Owl' ? '🦉' : '❓'}
                        </div>
                    )}
                </div>
            </div>

            {/* Totem Info */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                            {totem.attributes.displayName || totem.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {Color[totem.attributes.color]} {Species[totem.attributes.species]}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded">
                            Stage {totem.attributes.stage + 1}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded border ${getRarityBadgeColor(totem.attributes.rarity)}`}>
                            {Rarity[totem.attributes.rarity]}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Happiness: </span>
                        <span className="text-gray-900 dark:text-gray-100">{Number(totem.attributes.happiness)}%</span>
                    </div>
                    <div className="text-sm text-right">
                        <span className="text-gray-600 dark:text-gray-400">Experience: </span>
                        <span className="text-gray-900 dark:text-gray-100">{Number(totem.attributes.experience)}</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Sell Price</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {sellValue.toLocaleString()} TOTEM
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => onSellClick(totem, sellValue)}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded font-semibold 
                        hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors"
                >
                    Sell Totem
                </button>
            </div>
        </div>
    );
};

const SellTotems: React.FC = () => {
    const { totems, removeTotem, updateBalances } = useUser();
    const { sellTotem } = useTotemGame();
    const [selectedTotem, setSelectedTotem] = useState<NFTMetadata | null>(null);
    const [sellValue, setSellValue] = useState(0);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSelling, setIsSelling] = useState(false);
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
    const itemsPerPage = 8;

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

    const filteredTotems = totems.filter(nft => {
        return (
            (!filters.species || Species[nft.attributes.species] === filters.species) &&
            (!filters.rarity || Rarity[nft.attributes.rarity] === filters.rarity) &&
            (!filters.stage || nft.attributes.stage.toString() === filters.stage) &&
            (!filters.affinity || nft.affinity === filters.affinity) &&
            (!filters.domain || nft.domain === filters.domain)
        );
    });

    const sortedAndFiltered = sortTotems(filteredTotems);
    const totalPages = Math.max(1, Math.ceil(sortedAndFiltered.length / itemsPerPage));
    const totalItems = sortedAndFiltered.length;

    const sortOptions = [
        { key: 'created', label: 'Date Acquired', icon: Clock },
        { key: 'experience', label: 'Experience', icon: Sparkles },
        { key: 'happiness', label: 'Happiness', icon: Heart }
    ];

    const isSortKey = (value: string): value is SortKey => {
        return ['created', 'experience', 'happiness'].includes(value);
    };

    const handleSortChange = (value: string) => {
        if (isSortKey(value)) {
            handleSort(value);
        } else {
            console.error('Invalid sort key:', value);
        }
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handleSellClick = (totem: NFTMetadata, value: number) => {
        setSelectedTotem(totem);
        setSellValue(value);
        setIsConfirmOpen(true);
    };

    const handleConfirmSell = async () => {
        if (!selectedTotem) return;

        setIsSelling(true);
        try {
            await sellTotem(selectedTotem.tokenId);
            await updateBalances();
            removeTotem(selectedTotem.tokenId);
            setIsConfirmOpen(false);
        }
        catch (error) {
            console.error('Error selling totem:', error);
        }
        finally {
            setIsSelling(false);
            setSelectedTotem(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-sm rounded-t-lg z-10">
                <div className="pb-4 sm:pb-4">
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                        
                        <div className="hidden lg:flex items-center gap-2">
                            {/* Species Filter */}
                            <select
                                value={filters.species}
                                onChange={(e) => setFilters({...filters, species: e.target.value})}
                                className="h-10 border rounded-lg px-3 text-sm 
                                    bg-white dark:bg-gray-800 dark:text-white
                                    dark:border-gray-600"
                            >
                                <option value="">All Species</option>
                                {Object.keys(Species)
                                    .filter(key => isNaN(Number(key)) && key !== 'None')
                                    .map(species => (
                                        <option key={species} value={species}>{species}</option>
                                    ))
                                }
                            </select>

                            {/* Rarity Filter */}
                            <select
                                value={filters.rarity}
                                onChange={(e) => setFilters({...filters, rarity: e.target.value})}
                                className="h-10 border rounded-lg px-3 text-sm 
                                    bg-white dark:bg-gray-800 dark:text-white 
                                    dark:border-gray-600"
                            >
                                <option value="">All Rarities</option>
                                {Object.keys(Rarity)
                                    .filter(key => isNaN(Number(key)))
                                    .map(rarity => (
                                        <option key={rarity} value={rarity}>{rarity}</option>
                                    ))
                                }
                            </select>

                            {/* Stage Filter */}
                            <select
                                value={filters.stage}
                                onChange={(e) => setFilters({...filters, stage: e.target.value})}
                                className="h-10 border rounded-lg px-3 text-sm 
                                    bg-white dark:bg-gray-800 dark:text-white 
                                    dark:border-gray-600"
                            >
                                <option value="">All Stages</option>
                                {[0,1,2,3,4].map(stage => (
                                    <option key={stage} value={stage}>Stage {stage + 1}</option>
                                ))}
                            </select>
                        </div>
                    

                    <div className="flex items-center gap-3 ml-auto">
                        {/* Sort Dropdown with Direction Toggle */}
                        <div className="hidden sm:flex flex items-center gap-2">
                            <select
                                value={sortConfig.key}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="h-10 border rounded-lg px-3 text-sm 
                                    bg-white dark:bg-gray-800 dark:text-white 
                                    dark:border-gray-600"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.key} value={option.key}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => handleSort(sortConfig.key)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                                    text-gray-600 dark:text-gray-300"
                                title={`Sort ${sortConfig.direction === 'asc' ? 'Descending' : 'Ascending'}`}
                            >
                                {sortConfig.direction === 'asc' ? (
                                    <ArrowUpDown className="transform rotate-0" />
                                ) : (
                                    <ArrowUpDown className="transform rotate-180" />
                                )}
                            </button>
                        </div>
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            onPageChange={setCurrentPage}
                        />
                    </div>

                    </div>
                </div>
            </div>


            {sortedAndFiltered.length === 0 ? (
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 text-center">
                    No Totems found to sell.
                </h3>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedAndFiltered
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((totem) => (
                        <SellTotemCard
                            key={totem.id}
                            totem={totem}
                            onSellClick={handleSellClick}
                        />
                    ))}
                </div>
            )}

            {/* Sell Confirmation Dialog */}
            <MessageDialog
                title="Confirm Sale"
                isOpen={isConfirmOpen}
                showDismiss={false}
                onClose={() => setIsConfirmOpen(false)}
            >
                <div className="space-y-4">
                    <div className="text-gray-600 dark:text-gray-300">
                        <p className="mb-2">
                            Are you sure you want to sell{' '}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {selectedTotem?.attributes.displayName || selectedTotem?.name}
                            </span>{' '}
                            for <span className="font-semibold text-gray-900 dark:text-gray-100">{sellValue.toLocaleString()} TOTEM</span>?
                        </p>
                        <div className="mt-4 flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mt-1 flex-shrink-0" />
                            <div>
                            <p>You'll need to approve the transfer of your totem to the marketplace. This is a one-time transaction for each totem you want to sell.</p>
                            </div>
                        </div>
                        <p className="text-red-600 dark:text-red-400 font-medium mt-4">
                            Warning: This action cannot be undone. Your totem will be permanently removed.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsConfirmOpen(false)}
                            disabled={isSelling}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 
                hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 
                rounded font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmSell}
                            disabled={isSelling}
                            className="px-4 py-2 bg-red-600 text-white rounded font-medium
                hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 
                transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSelling ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Selling...
                                </>
                            ) : (
                                'Confirm Sale'
                            )}
                        </button>
                    </div>
                </div>
            </MessageDialog>
        </div>
    );
};

export default SellTotems;
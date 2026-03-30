import React, { useEffect, useState } from 'react';
import { ArrowUpDown, Clock, Heart, Loader2, MapPin, Sparkles } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { Species, Rarity, TotemData } from '../../types/types';
import MessageDialog from '../MessageDialog';
import { Pagination } from '../layouts/Pagination';
import { getRarityBadgeColor } from '../../utils/totems';
import { useGame } from '../../contexts/GameContext';
import { formatTimeRemaining } from '../../utils/formats';
import { CURRENCY_NAMES, IPFS_GATEWAY_URL } from '../../config/constants';
import apiClient from '../../services/ApiClient';
import { notificationService } from '../../services/NotificationService';
import { NotificationType } from '../../types/notifications';
import { getBusyReason } from '../../utils/totem-availability';

interface SellTotemCardProps {
    totem: TotemData;
    onSellClick: (totem: TotemData, value: number) => void;
    busyReason?: string | null;
    expeditionEndTime?: number;
}

type SortDirection = 'asc' | 'desc';
type SortKey = 'created' | 'experience' | 'happiness' | 'stage';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}

const SellTotemCard: React.FC<SellTotemCardProps> = ({
    totem,
    onSellClick,
    busyReason = null,
    expeditionEndTime = 0
 }) => {
    const isUnavailable = !!busyReason;
    const isOnExpedition = busyReason === 'On Expedition';
    // Calculate sell value using the formula
    // sellPrice = 300 + (stage * 30) + (rarityId * 20)
    const baseValue = 300;
    const stageBonus = totem.attributes.stage * 30;
    const rarityBonus = totem.attributes.rarity * 20;
    const sellValue = baseValue + stageBonus + rarityBonus;
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = expeditionEndTime - now;
    const isComplete = timeRemaining <= 0;
    const expeditionMessage = isComplete ? 'Expedition complete' : `${formatTimeRemaining(expeditionEndTime)}`;
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full">
            {/* Totem Image */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                {/* Status Badge */}
                {isUnavailable && (
                    <div className={`absolute top-3 left-3 z-30 text-white text-xs font-medium px-2 py-1 rounded-full shadow-md flex items-center gap-1 ${
                        isOnExpedition ? 'bg-blue-600' : 'bg-amber-600'
                    }`}>
                        <MapPin className="w-3 h-3" />
                        <span>{busyReason}</span>
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                    {totem.image ? (
                        <img
                            src={totem.image.replace('ipfs://', IPFS_GATEWAY_URL)}
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
                {/* Expedition Overlay (only for actual expeditions with a timer) */}
                {isOnExpedition && (
                    <div className="absolute top-2/3 left-0 right-0 transform -translate-y-1/2 text-center">
                        <div className="bg-blue-600/80 dark:bg-blue-800/90 text-white px-4 py-2 mx-auto w-max rounded-full backdrop-blur-sm shadow-lg">
                            <p className="font-medium">{expeditionMessage}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Totem Info */}
            <div className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 mr-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate" title={totem.displayName || totem.name}>
                            {totem.displayName || totem.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {Species[totem.attributes.species]}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-nowrap px-2 py-1 rounded">
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

                {/* Spacer to push bottom content down */}
                <div className="flex-grow">
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Sell Price</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {sellValue.toLocaleString()} {CURRENCY_NAMES.SOFT}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onSellClick(totem, sellValue)}
                    disabled={isUnavailable}
                    className={`w-full py-2 px-4 rounded font-semibold transition-colors mt-auto
                        ${isUnavailable
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                        }
                    `}
                >
                    {isUnavailable ? busyReason : 'Sell Totem'}
                </button>
            </div>
        </div>
    );
};

const SellTotems: React.FC = () => {
    const { totems, removeTotem, updateBalances } = useUser();
    const { isTotemAvailable, expeditionState } = useGame();
    const [selectedTotem, setSelectedTotem] = useState<TotemData | null>(null);
    const [sellValue, setSellValue] = useState(0);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSelling, setIsSelling] = useState(false);
    const [filters, setFilters] = useState({
        species: '',
        rarity: '',
        stage: '',
        affinity: '',
        domain: '',
        showOnExpedition: true
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'created',
        direction: 'desc'
    });
    const itemsPerPage = 8;

    // Web2: Using REST API instead of transaction service

    const getExpeditionEndTime = (tokenId: string): number => {
        const expedition = expeditionState.userExpeditions.find(exp => 
            !exp.completed && exp.totemIds.some(id => id.toString() === tokenId)
        );
        return expedition ? expedition.endTime : 0;
    };

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

    const filteredTotems = totems.filter(nft => {
         // Check if totem is unavailable (expedition, council mission, seated)
         const isUnavailable = !isTotemAvailable(nft.id) || !!getBusyReason(nft.attributes);
         if (isUnavailable && !filters.showOnExpedition) {
             return false;
         }

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

    const handleSellClick = (totem: TotemData, value: number) => {
        // Don't allow selling unavailable totems (expedition, council mission, seated)
        if (!isTotemAvailable(totem.id) || getBusyReason(totem.attributes)) {
            return;
        }

        setSelectedTotem(totem);
        setSellValue(value);
        setSellError(null);  // Clear any previous error
        setIsConfirmOpen(true);
    };

    const handleCancelSell = () => {
        setIsConfirmOpen(false);
        setSelectedTotem(null);
        setSellError(null);
    };

    const [sellError, setSellError] = useState<string | null>(null);

    const handleConfirmSell = async () => {
        if (!selectedTotem) return;

        // Double-check totem is not unavailable
        if (!isTotemAvailable(selectedTotem.id) || getBusyReason(selectedTotem.attributes)) {
            setIsConfirmOpen(false);
            setSelectedTotem(null);
            return;
        }

        setIsSelling(true);
        setSellError(null);
        try {
            // Web2: List totem for sale via REST API
            const response = await apiClient.listTotemForSale(selectedTotem.id, sellValue);

            if (!response.success) {
                throw new Error(response.error?.message || 'Failed to list totem');
            }

            await updateBalances();

            // Show sale notification
            notificationService.showNotification(
                NotificationType.TOTEM_SALE,
                `Sold ${selectedTotem.displayName || selectedTotem.name} for ${sellValue.toLocaleString()} ${CURRENCY_NAMES.SOFT}!`,
                { totemId: selectedTotem.id, price: sellValue }
            );

            removeTotem(selectedTotem.id);
            setIsConfirmOpen(false);
            setSelectedTotem(null);  // Only clear after successful sale
        }
        catch (error) {
            console.error('Error listing totem for sale:', error);
            setSellError(error instanceof Error ? error.message : 'Failed to sell totem. Please try again.');
            // Keep modal open and selectedTotem intact so user can retry
        }
        finally {
            setIsSelling(false);
        }
    };
    
    // Count unavailable totems (expedition, council mission, seated)
    const unavailableCount = totems.filter(totem => !isTotemAvailable(totem.id) || getBusyReason(totem.attributes)).length;

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

                            {/* Expedition Filter */}
                            <label className="h-10 flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg dark:border-gray-600">
                                <input
                                    type="checkbox"
                                    checked={filters.showOnExpedition}
                                    onChange={(e) => setFilters({...filters, showOnExpedition: e.target.checked})}
                                    className="form-checkbox h-4 w-4 text-blue-600 dark:text-blue-400"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Show Unavailable Totems ({unavailableCount})
                                </span>
                            </label>
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
                        .map((totem) => {
                            // Determine busy reason: council state first, then expedition
                            const councilReason = getBusyReason(totem.attributes);
                            const isOnActiveExpedition = !isTotemAvailable(totem.id) && !councilReason;
                            const reason = councilReason || (isOnActiveExpedition ? 'On Expedition' : null);
                            const expeditionEndTime = isOnActiveExpedition ? getExpeditionEndTime(totem.id) : 0;

                            return (
                                <SellTotemCard
                                    key={totem.id}
                                    totem={totem}
                                    onSellClick={handleSellClick}
                                    busyReason={reason}
                                    expeditionEndTime={expeditionEndTime}
                                />
                            );
                    })}
                </div>
            )}

            {/* Sell Confirmation Dialog */}
            <MessageDialog
                title="Confirm Sale"
                isOpen={isConfirmOpen}
                showDismiss={false}
                onClose={handleCancelSell}
            >
                <div className="space-y-4">
                    <div className="text-gray-600 dark:text-gray-300">
                        <p className="mb-2">
                            Are you sure you want to sell{' '}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {selectedTotem?.displayName || selectedTotem?.name}
                            </span>{' '}
                            for <span className="font-semibold text-gray-900 dark:text-gray-100">{sellValue.toLocaleString()} {CURRENCY_NAMES.SOFT}</span>?
                        </p>
                        <p className="text-red-600 dark:text-red-400 font-medium mt-4">
                            Warning: This action cannot be undone. Your totem will be permanently removed.
                        </p>
                    </div>

                    {/* Error message */}
                    {sellError && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-sm text-red-600 dark:text-red-400">{sellError}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={handleCancelSell}
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
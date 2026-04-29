import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { Species, Rarity } from '../../types/types';
import MessageDialog from '../MessageDialog';
import { Pagination } from '../layouts/Pagination';
import { getRarityBadgeColor, getSpeciesEmoji } from '../../utils/totems';
import { CURRENCY_NAMES, IPFS_GATEWAY_URL } from '../../config/constants';

import apiClient from '../../services/ApiClient';
import { getTotemImageUrl, isSpeciesLoaded, getSpeciesName, getStageName } from '../../utils/species';
import { notificationService } from '../../services/NotificationService';

interface UnboundTotem {
    tokenId: string;
    previousOwner: string;
    sellerDisplayName: string;
    sellPrice: number;
    species: number;
    color: number;
    rarity: number;
    happiness: number;
    experience: number;
    stage: number;
    displayName: string | null;
    prestigeLevel: number;
}

const SHOP_FEE = 100;

const UnboundTotemCard: React.FC<{
    totem: UnboundTotem;
    onPurchaseClick: (totem: UnboundTotem) => void;
    isPurchasing: boolean;
}> = React.memo(({ totem, onPurchaseClick, isPurchasing }) => {
    const { canSpendEssence } = useUser();
    const purchasePrice = totem.sellPrice + SHOP_FEE;
    const disabledBuyButton = isPurchasing || !canSpendEssence(purchasePrice);

    const displayName = totem.displayName || getStageName(totem.species, totem.color, totem.stage);
    const speciesLabel = Species[totem.species];

    // Image URL computed synchronously from species cache (loaded on app mount)
    const imageUrl = isSpeciesLoaded(totem.species)
        ? getTotemImageUrl(totem.species, totem.color, totem.stage)
        : '';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full">
            {/* Totem Image */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    {imageUrl ? (
                        <img
                            src={imageUrl.replace('ipfs://', IPFS_GATEWAY_URL)}
                            alt={displayName}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-6xl text-gray-400 dark:text-gray-500">
                            {getSpeciesEmoji(totem.species)}
                        </div>
                    )}
                </div>
            </div>

            {/* Totem Info */}
            <div className="p-4 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 mr-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 truncate" title={displayName}>
                            {displayName}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {speciesLabel}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 text-nowrap px-2 py-1 rounded">
                            Stage {totem.stage + 1}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded border ${getRarityBadgeColor(totem.rarity)}`}>
                            {Rarity[totem.rarity]}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Happiness: </span>
                        <span className="text-gray-900 dark:text-gray-100">{totem.happiness}%</span>
                    </div>
                    <div className="text-sm text-right">
                        <span className="text-gray-600 dark:text-gray-400">Experience: </span>
                        <span className="text-gray-900 dark:text-gray-100">{totem.experience}</span>
                    </div>
                </div>

                {/* Spacer to push bottom content down */}
                <div className="flex-grow">
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        {totem.previousOwner && (
                            <div className="flex justify-between items-center mb-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Seller</span>
                                <Link
                                    to={`/players/${totem.previousOwner}`}
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[60%] text-right"
                                    title={`View ${totem.sellerDisplayName}'s profile`}
                                >
                                    {totem.sellerDisplayName}
                                </Link>
                            </div>
                        )}
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600 dark:text-gray-400">Purchase Price</span>
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {purchasePrice.toLocaleString()} {CURRENCY_NAMES.SOFT}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onPurchaseClick(totem)}
                    disabled={disabledBuyButton}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold
                        hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600
                        transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
                >
                    {isPurchasing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPurchasing ? 'Purchasing...' : 'Buy Totem'}
                </button>
            </div>
        </div>
    );
});

const UnboundTotems: React.FC = () => {
    const [unboundTotems, setUnboundTotems] = useState<UnboundTotem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTotem, setSelectedTotem] = useState<UnboundTotem | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [purchasingTotems, setPurchasingTotems] = useState<{[key: string]: boolean}>({});
    const { updateBalances, fetchTotems } = useUser();
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    const selectedDisplayName = selectedTotem?.displayName ||
        (selectedTotem ? getStageName(selectedTotem.species, selectedTotem.color, selectedTotem.stage) : '');

    const loadUnboundTotems = useCallback(async () => {
        if (!apiClient.isAuthenticated()) return;

        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.getShopListings({
                page: currentPage,
                limit: itemsPerPage
            });

            if (response.success && response.data) {
                const listings = (response.data.listings || []).map((listing: any) => ({
                    tokenId: listing.totemId || '',
                    previousOwner: listing.seller?.id || listing.originalOwnerId || '',
                    sellerDisplayName: listing.seller?.displayName || 'Anonymous',
                    sellPrice: listing.sellPrice || 0,
                    species: listing.totem?.speciesId ?? 0,
                    color: listing.totem?.colorId ?? 0,
                    rarity: listing.totem?.rarityId ?? 0,
                    happiness: listing.totem?.stats?.happiness ?? 50,
                    experience: listing.totem?.experience ?? 0,
                    stage: listing.totem?.stage ?? 0,
                    displayName: listing.totem?.name || null,
                    prestigeLevel: listing.totem?.prestigeLevel ?? 0
                }));
                setUnboundTotems(listings);
                setTotalItems(response.data.total || listings.length);
            } else {
                setUnboundTotems([]);
                setTotalItems(0);
            }
        }
        catch (err) {
            console.error('Error loading marketplace listings:', err);
            setError('Failed to load marketplace. Please try again.');
        }
        finally {
            setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        loadUnboundTotems();
    }, [loadUnboundTotems]);

    const handlePurchaseClick = useCallback((totem: UnboundTotem) => {
        setSelectedTotem(totem);
        setIsConfirmOpen(true);
    }, []);

    const handleConfirmPurchase = async () => {
        if (!selectedTotem) return;

        const tokenId = selectedTotem.tokenId;
        setPurchasingTotems(prev => ({ ...prev, [tokenId]: true }));

        try {
            const response = await apiClient.purchaseUnboundTotem(tokenId);

            if (!response.success) {
                throw new Error(response.error?.message || 'Purchase failed');
            }

            await updateBalances();

            const rarityName = Rarity[selectedTotem.rarity] || 'Unknown';
            const speciesName = getSpeciesName(selectedTotem.species);
            notificationService.showTotemPurchased({
                tokenId,
                rarity: rarityName,
                species: speciesName.charAt(0).toUpperCase() + speciesName.slice(1),
                amount: (selectedTotem.sellPrice + SHOP_FEE).toString(),
            });
            notificationService.processAchievementsFromResponse((response.data as any)?.achievements);

            await fetchTotems();

            setUnboundTotems(prev => prev.filter(t => t.tokenId !== tokenId));
            setIsConfirmOpen(false);

            loadUnboundTotems();
        }
        catch (err) {
            console.error('Error purchasing totem:', err);
            setError('Failed to purchase totem. Please try again.');
        }
        finally {
            setPurchasingTotems(prev => ({ ...prev, [tokenId]: false }));
            setSelectedTotem(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Unbound Totem Sanctuary</h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Discover pre-owned totems looking for a new keeper. These mystical companions retain their
                    experience and evolution stage, offering a unique opportunity to acquire advanced totems.
                    Each totem is sold at its original value plus a small market fee.
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                    <p>{error}</p>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-sm rounded-t-lg z-10">
                <div className="pb-4 sm:pb-4 ml-4">
                    <div className="flex flex-wrap gap-3 items-center justify-between">
                        <div className="text-gray-900 dark:text-gray-100 text-lg">Available Totems</div>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            </div>

            {unboundTotems.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400">
                        No unbound totems available at the moment.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {unboundTotems.map((totem) => (
                        <UnboundTotemCard
                            key={totem.tokenId}
                            totem={totem}
                            onPurchaseClick={handlePurchaseClick}
                            isPurchasing={!!purchasingTotems[totem.tokenId]}
                        />
                    ))}
                </div>
            )}

            {/* Purchase Confirmation Dialog */}
            <MessageDialog
                title="Confirm Purchase"
                isOpen={isConfirmOpen}
                showDismiss={false}
                onClose={() => setIsConfirmOpen(false)}
            >
                <div className="space-y-4">
                    <div className="text-gray-600 dark:text-gray-300">
                        <p className="mb-2">
                            Are you sure you want to purchase this{' '}
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {selectedDisplayName || Species[selectedTotem?.species || 0]}
                            </span>{' '}
                            for <b>{((selectedTotem?.sellPrice || 0) + SHOP_FEE).toLocaleString()} {CURRENCY_NAMES.SOFT}</b>?
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsConfirmOpen(false)}
                            disabled={!!selectedTotem && purchasingTotems[selectedTotem.tokenId]}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100
                                hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                                rounded font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmPurchase}
                            disabled={!!selectedTotem && purchasingTotems[selectedTotem.tokenId]}
                            className="px-4 py-2 bg-purple-600 text-white rounded font-medium
                                hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600
                                transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {selectedTotem && purchasingTotems[selectedTotem.tokenId] ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Purchasing...
                                </>
                            ) : (
                                'Confirm Purchase'
                            )}
                        </button>
                    </div>
                </div>
            </MessageDialog>
        </div>
    );
};

export default UnboundTotems;

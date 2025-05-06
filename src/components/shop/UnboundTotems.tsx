import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { Species, Rarity, Color } from '../../types/types';
import { createShopContract, createTotemNFTContract } from '../../config/contracts';
import MessageDialog from '../MessageDialog';
import { Pagination } from '../layouts/Pagination';
import { getRarityBadgeColor } from '../../utils/totems';
import { useTransactionService } from '../../hooks/useTransactionService';
import { IPFS_GATEWAY_URL } from '../../config/constants';

interface UnboundTotem {
    tokenId: bigint;
    previousOwner: string;
    sellPrice: bigint;
    species: Species;
    color: Color;
    rarity: Rarity;
    happiness: number;
    experience: number;
    stage: number;
    displayName: string;
    prestigeLevel: number;
}

const convertPrice = (price: bigint) => {
    // Convert from wei to TOTEM (18 decimals)
    return Number(price) / Math.pow(10, 18);
};

const UnboundTotemCard: React.FC<{
    totem: UnboundTotem;
    onPurchaseClick: (totem: UnboundTotem) => void;
    isPurchasing: boolean;
}> = ({ totem, onPurchaseClick, isPurchasing }) => {
    const { provider } = useUser();
    const purchasePrice = convertPrice(totem.sellPrice) + 100;
    const [imageUri, setImageUri] = useState('');

    useEffect(() => {
        const getImageUri = async () => {
            // Fetch full metadata if needed
            if (!provider) return;

            const nftContract = createTotemNFTContract(provider);
            
            const uri = await nftContract.tokenURI(totem.tokenId);
            const ipfsMetadata = await fetch(uri.replace('ipfs://', IPFS_GATEWAY_URL)).then(res => res.json());
            const image = ipfsMetadata.image.replace('ipfs://', IPFS_GATEWAY_URL);
            setImageUri(image);
        }
        getImageUri();
    }, [totem]);
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Totem Image */}
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                    {imageUri ? (
                        <img
                            src={imageUri}
                            alt={totem?.displayName || `${Color[totem?.color || 0]} ${Species[totem?.species || 0]}`}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="text-6xl text-gray-400 dark:text-gray-500">
                            {Species[totem.species] === 'Wolf' ? '🐺' :
                                Species[totem.species] === 'Otter' ? '🦦' :
                                    Species[totem.species] === 'Owl' ? '🦉' : '❓'}
                        </div>
                    )}
                </div>
            </div>

            {/* Totem Info */}
            <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                            {totem.displayName || `${Color[totem.color]} ${Species[totem.species]}`}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {Color[totem.color]} {Species[totem.species]}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded">
                            Stage {Number(totem.stage) + 1}
                        </span>
                        <span className={`text-sm px-2 py-1 rounded border ${getRarityBadgeColor(Number(totem.rarity))}`}>
                            {Rarity[totem.rarity]}
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Happiness: </span>
                        <span className="text-gray-900 dark:text-gray-100">{Number(totem.happiness)}%</span>
                    </div>
                    <div className="text-sm text-right">
                        <span className="text-gray-600 dark:text-gray-400">Experience: </span>
                        <span className="text-gray-900 dark:text-gray-100">{Number(totem.experience)}</span>
                    </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Purchase Price</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {purchasePrice.toLocaleString()} TOTEM
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => onPurchaseClick(totem)}
                    disabled={isPurchasing}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold 
                        hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 
                        transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isPurchasing && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isPurchasing ? 'Purchasing...' : 'Buy Totem'}
                </button>
            </div>
        </div>
    );
};

const UnboundTotems: React.FC = () => {
    const [unboundTotems, setUnboundTotems] = useState<UnboundTotem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTotem, setSelectedTotem] = useState<UnboundTotem | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [purchasingTotems, setPurchasingTotems] = useState<{[key: string]: boolean}>({});
    const { provider, signer, addTotem, updateBalances, isGaslessEnabled } = useUser();
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    const txService = useTransactionService({
        gaslessEnabled: isGaslessEnabled,
        waitForConfirmation: true
    });

    const loadUnboundTotems = async () => {
        if (!provider) return;

        try {
            setLoading(true);
            setError(null);
            const shopContract = createShopContract(provider);
            
            // Get total count first
            const totalCount = await shopContract.getUnboundTotemCount();
            
            // Calculate offset and limit
            const offset = (currentPage - 1) * itemsPerPage;
            const limit = itemsPerPage;
            
            // Fetch totems for current page
            const totems = await shopContract.getUnboundTotems(offset, limit);
            setTotalItems(Number(totalCount));
            setUnboundTotems(totems);
        }
        catch (err) {
            console.error('Error loading unbound totems:', err);
            setError('Failed to load unbound totems. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUnboundTotems();
    }, [provider, currentPage]);

    const handlePurchaseClick = (totem: UnboundTotem) => {
        setSelectedTotem(totem);
        setIsConfirmOpen(true);
    };

    const handleConfirmPurchase = async () => {
        if (!selectedTotem || !provider) return;
        
        const tokenId = selectedTotem.tokenId;
        setPurchasingTotems(prev => ({ ...prev, [tokenId.toString()]: true }));
        
        try {
            const result = await txService?.purchaseUnboundTotem(tokenId);

            await Promise.all([
                updateBalances(),
                addTotem(tokenId)
            ])

            // Remove the purchased totem from the local state immediately
            setUnboundTotems(prev => prev.filter(totem => totem.tokenId !== tokenId));

            // Close the confirmation dialog
            setIsConfirmOpen(false);
            
            // Refresh the list
            loadUnboundTotems();
        }
        catch (err) {
            console.error('Error purchasing unbound totem:', err);
            setError('Failed to purchase totem. Please try again.');
        }
        finally {
            setPurchasingTotems(prev => ({ ...prev, [tokenId.toString()]: false }));
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
                    Discover pre-owned totems looking for a new keeper. These spirit companions retain their 
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
                            key={totem.tokenId.toString()}
                            totem={totem}
                            onPurchaseClick={handlePurchaseClick}
                            isPurchasing={purchasingTotems[totem.tokenId.toString()]}
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
                                {selectedTotem?.displayName || `${Color[selectedTotem?.color || 0]} ${Species[selectedTotem?.species || 0]}`}
                            </span>{' '}
                            for <b>{(convertPrice(selectedTotem?.sellPrice!) + 100).toLocaleString()} TOTEM</b>?
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsConfirmOpen(false)}
                            disabled={purchasingTotems[selectedTotem?.tokenId.toString() || '']}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 
                                hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 
                                rounded font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmPurchase}
                            disabled={purchasingTotems[selectedTotem?.tokenId.toString() || '']}
                            className="px-4 py-2 bg-purple-600 text-white rounded font-medium
                                hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 
                                transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {purchasingTotems[selectedTotem?.tokenId.toString() || ''] ? (
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
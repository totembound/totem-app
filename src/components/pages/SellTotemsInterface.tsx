// components/shop/SellTotemsInterface.tsx
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTotemGame } from '../../hooks/useTotemGame';
import { useUser } from '../../contexts/UserContext';
import { Species, Rarity, NFTMetadata, Color } from '../../types/types';
import MessageDialog from '../MessageDialog';

interface SellTotemCardProps {
  totem: NFTMetadata;
  onSellClick: (totem: NFTMetadata, value: number) => void;
}

const SellTotemCard: React.FC<SellTotemCardProps> = ({ totem, onSellClick }) => {
    const baseValue = 200; // Minimum value
    const maxBonus = 200; // Maximum additional value possible
    const stageWeight = 0.6; // Stage contributes 60% of potential bonus
    const rarityWeight = 0.4; // Rarity contributes 40% of potential bonus
    const stageBonus = (totem.attributes.stage / 4) * maxBonus * stageWeight;
    const rarityBonus = (totem.attributes.rarity / 4) * maxBonus * rarityWeight;
    const sellValue = Math.floor(baseValue + stageBonus + rarityBonus);

    const getRarityStyle = (rarity: number) => {
        switch (rarity) {
            case 0: // Common
                return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
            case 1: // Uncommon
                return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-900/50';
            case 2: // Rare
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
            case 3: // Epic
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-900/50';
            case 4: // Legendary
                return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
        }
    };

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
                        <span className={`text-sm px-2 py-1 rounded border ${getRarityStyle(totem.attributes.rarity)}`}>
                            {Rarity[totem.attributes.rarity]}
                        </span>
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

const SellTotemsInterface: React.FC = () => {
  const { totems, removeTotem, updateBalances } = useUser();
  const { sellTotem } = useTotemGame();
  const [selectedTotem, setSelectedTotem] = useState<NFTMetadata | null>(null);
  const [sellValue, setSellValue] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSelling, setIsSelling] = useState(false);

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
    } catch (error) {
      console.error('Error selling totem:', error);
    } finally {
      setIsSelling(false);
      setSelectedTotem(null);
    }
  };

  return (
    <div className="space-y-6">
      {totems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            You don't have any totems to sell.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {totems.map((totem) => (
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
              for {sellValue.toLocaleString()} TOTEM?
            </p>
            <p className="text-red-600 dark:text-red-400 font-medium">
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

export default SellTotemsInterface;
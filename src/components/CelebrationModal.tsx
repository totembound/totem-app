import React, { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Rarity } from '../types/types';
import { getRarityColor } from '../utils/totems';
import { IPFS_GATEWAY_URL } from '../config/constants';

interface CelebrationModalProps {
  totem: { 
    name: string;
    image: string;
    attributes: {
      rarity: Rarity;
      displayName: string;
      stage?: number;
      domain?: string;
    }
  }; 
  type: 'purchase' | 'evolution' | 'loot_claim';
  onClose: () => void;
}

const CelebrationModal = ({ 
  totem, 
  type,
  onClose 
}: CelebrationModalProps) => {
  
  // Animation effect on mount
  useEffect(() => {
    const timeout = setTimeout(() => {
      const elements = document.querySelectorAll('.sparkle');
      elements.forEach(el => {
        el.classList.add('animate-ping');
      });
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  const getModalTitle = () => {
    if (type === 'purchase') {
      return "Congratulations!";
    } else if (type === 'loot_claim') {
      return "New Totem Claimed!";
    } else {
      return "Evolution Complete!";
    }
  };
  
  const getModalSubtitle = () => {
    if (type === 'purchase') {
      return "You've successfully summoned a new totem!";
    } else if (type === 'loot_claim') {
      return "You opened your loot box and found a new totem!";
    } else {
      return `Your totem has evolved to Stage ${(totem.attributes.stage || 0) + 1}!`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-start sm:items-center justify-center pt-4 sm:pt-0 overflow-y-auto">
      <div className={`
        relative w-full max-w-lg transform transition-all
        bg-gradient-to-br ${getRarityColor(totem.attributes.rarity)}
        rounded-xl border-2 p-1
        animate-fade-in scale-100 mx-4 mb-4
      `}>
        <div className="absolute -inset-1">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 animate-pulse"></div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
        >
          <X size={24} />
        </button>

        <div className="relative bg-white dark:bg-gray-800 rounded-lg p-6">
          {/* Sparkles */}
          <div className="absolute -top-2 -left-2 sparkle">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute -top-2 -right-2 sparkle">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute -bottom-2 -left-2 sparkle">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 sparkle">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {getModalTitle()}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {getModalSubtitle()}
            </p>
          </div>

          {/* NFT Display */}
          <div className="relative aspect-square rounded-lg overflow-hidden mb-6">
            <img 
              src={totem.image.replace('ipfs://', IPFS_GATEWAY_URL)}
              alt={totem.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          {/* NFT Info */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {totem.attributes.displayName || totem.name}
            </h3>
            <p className={`text-sm font-medium ${
              totem.attributes.rarity === Rarity.Limited ? 'text-yellow-600 dark:text-yellow-400' :
              totem.attributes.rarity === Rarity.Legendary ? 'text-yellow-600 dark:text-yellow-400' :
              totem.attributes.rarity === Rarity.Epic ? 'text-purple-600 dark:text-purple-400' :
              totem.attributes.rarity === Rarity.Rare ? 'text-blue-600 dark:text-blue-400' :
              totem.attributes.rarity === Rarity.Uncommon ? 'text-green-600 dark:text-green-400' :
              'text-gray-600 dark:text-gray-400'
            }`}>
              {type === 'evolution' ? `Stage ${(totem.attributes.stage || 0) + 1} ` : ''}
              {Rarity[totem.attributes.rarity]} {totem.attributes.domain || ''} Totem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CelebrationModal;
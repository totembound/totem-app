import React, { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Rarity } from '../types/types';

interface CelebrationModalProps {
  totem: { 
    name: string;
    image: string;
    attributes: { 
      rarity: Rarity;
      displayName: string;
      stage?: number;
    }
  }; 
  type: 'purchase' | 'evolution';
  onClose: () => void;
}

const CelebrationModal = ({ 
  totem, 
  type,
  onClose 
}: CelebrationModalProps) => {
  // Rarity-based styling
  const getRarityColor = (rarity: Rarity) => {
    switch(rarity) {
      case Rarity.Common: 
        return 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300';
      case Rarity.Uncommon: 
        return 'from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-900/50 border-green-300';
      case Rarity.Rare: 
        return 'from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-900/50 border-blue-300';
      case Rarity.Epic: 
        return 'from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-900/50 border-purple-300';
      case Rarity.Legendary: 
        return 'from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-900/50 border-yellow-300';
      default: 
        return 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300';
    }
  };

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
    } else {
      return "Evolution Complete!";
    }
  };
  
  const getModalSubtitle = () => {
    if (type === 'purchase') {
      return "You've successfully summoned a new spirit totem!";
    } else {
      return `Your totem has evolved to Stage ${(totem.attributes.stage || 0) + 1}!`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className={`
        relative w-full max-w-lg transform transition-all
        bg-gradient-to-br ${getRarityColor(totem.attributes.rarity)}
        rounded-xl border-2 p-1
        animate-fade-in scale-100
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
              src={totem.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
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
              totem.attributes.rarity === Rarity.Legendary ? 'text-yellow-600 dark:text-yellow-400' :
              totem.attributes.rarity === Rarity.Epic ? 'text-purple-600 dark:text-purple-400' :
              totem.attributes.rarity === Rarity.Rare ? 'text-blue-600 dark:text-blue-400' :
              totem.attributes.rarity === Rarity.Uncommon ? 'text-green-600 dark:text-green-400' :
              'text-gray-600 dark:text-gray-400'
            }`}>
              {type === 'evolution' ? `Stage ${(totem.attributes.stage || 0) + 1} ` : ''}
              {Rarity[totem.attributes.rarity]} Spirit Totem
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CelebrationModal;
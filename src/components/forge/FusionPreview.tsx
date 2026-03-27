import React from 'react';
import { ArrowRight, HelpCircle, X } from 'lucide-react';
import { getRarityColor } from '../../utils/totems';
import type { TotemData } from '../../types/types';

const IPFS_GATEWAY_URL = 'https://ipfs.io/ipfs/';

interface FusionPreviewProps {
  selectedTotems: TotemData[];
  fusionMode: 'pure' | 'wild';
  targetRarity: number;
  rarityNames: Record<number, string>;
  onRemove: (totemId: string) => void;
}

const FusionPreview: React.FC<FusionPreviewProps> = ({
  selectedTotems,
  fusionMode,
  targetRarity,
  rarityNames,
  onRemove,
}) => {
  const targetRarityColor = getRarityColor(targetRarity);

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        {/* Selected totem slots */}
        {[0, 1, 2].map(index => {
          const totem = selectedTotems[index];

          if (!totem) {
            return (
              <div
                key={index}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600
                  flex items-center justify-center bg-white dark:bg-gray-800"
              >
                <span className="text-2xl text-gray-300 dark:text-gray-600">?</span>
              </div>
            );
          }

          return (
            <div key={index} className="relative group">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-orange-300 dark:border-orange-600">
                <img
                  src={totem.image?.replace('ipfs://', IPFS_GATEWAY_URL) || '/images/placeholder.png'}
                  alt={totem.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => onRemove(totem.id)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white
                  flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
                  sm:opacity-100"
                aria-label="Remove totem"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="text-center mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate block max-w-[64px] sm:max-w-[80px]">
                  {totem.attributes.nickname || totem.name}
                </span>
              </div>
            </div>
          );
        })}

        {/* Arrow */}
        <div className="flex flex-col items-center px-2">
          <ArrowRight className="w-6 h-6 text-orange-500" />
        </div>

        {/* Result slot */}
        <div className="flex flex-col items-center">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed
              flex items-center justify-center
              bg-gradient-to-br ${targetRarityColor}`}
          >
            <HelpCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="text-center mt-1">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {rarityNames[targetRarity] || '???'}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {fusionMode === 'pure' ? 'Same Species' : 'Random Species'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FusionPreview;

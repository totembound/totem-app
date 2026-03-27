import React from 'react';
import { Check, MapPin } from 'lucide-react';
import { getRarityBorderColor } from '../../utils/totems';
import type { TotemData } from '../../types/types';

const IPFS_GATEWAY_URL = 'https://ipfs.io/ipfs/';

interface FusionSelectionPanelProps {
  totems: TotemData[];
  selectedIds: string[];
  onSelect: (totemId: string) => void;
  fusionMode: 'pure' | 'wild';
  availableRarities: number[];
  rarityNames: Record<number, string>;
}

const FusionSelectionPanel: React.FC<FusionSelectionPanelProps> = ({
  totems,
  selectedIds,
  onSelect,
  fusionMode,
  availableRarities,
  rarityNames,
}) => {
  // Group totems by rarity for display
  const groupedByRarity: Record<number, TotemData[]> = {};
  for (const t of totems) {
    const r = t.attributes.rarity;
    if (!groupedByRarity[r]) groupedByRarity[r] = [];
    groupedByRarity[r].push(t);
  }

  const sortedRarities = Object.keys(groupedByRarity).map(Number).sort();

  if (totems.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <p className="text-gray-500 dark:text-gray-400">
          No eligible totems for {fusionMode === 'pure' ? 'pure' : 'wild'} fusion
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          {fusionMode === 'pure'
            ? 'You need 3 totems of the same species and rarity'
            : 'You need 3 totems of the same rarity'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Totems
      </h3>

      {sortedRarities.map(rarity => {
        const rarityTotems = groupedByRarity[rarity];
        const hasEnough = rarityTotems.length >= 3;

        return (
          <div key={rarity}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {rarityNames[rarity] || `Rarity ${rarity}`}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                ({rarityTotems.length} available)
              </span>
              {!hasEnough && (
                <span className="text-xs text-amber-500 dark:text-amber-400">
                  — need 3+
                </span>
              )}
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto overscroll-contain p-1"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {rarityTotems.map(totem => {
                const isSelected = selectedIds.includes(totem.id);
                const rarityColors = getRarityBorderColor(totem.attributes.rarity);
                // Disable if: different rarity than first selected, or already at 3 and not selected
                const firstSelected = selectedIds.length > 0
                  ? totems.find(t => t.id === selectedIds[0])
                  : null;
                const isDisabled = firstSelected
                  ? totem.attributes.rarity !== firstSelected.attributes.rarity
                  : !hasEnough;

                return (
                  <button
                    key={totem.id}
                    onClick={() => !isDisabled && onSelect(totem.id)}
                    disabled={isDisabled && !isSelected}
                    className={`p-2 border rounded-lg transition-all text-left relative min-h-[56px]
                      ${isSelected
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-400'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }
                      ${isDisabled && !isSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`relative w-12 h-12 rounded-lg overflow-hidden border shrink-0 ${rarityColors.border}`}>
                        <img
                          src={totem.image?.replace('ipfs://', IPFS_GATEWAY_URL) || '/images/placeholder.png'}
                          alt={totem.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-orange-500/30 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {totem.attributes.nickname || totem.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Stage {totem.attributes.stage + 1} &bull; {totem.affinity}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FusionSelectionPanel;

import React, { useEffect, useState } from 'react';
import { useGame, LootItem } from '../../contexts/GameContext';
import { Package, Gift, Sparkles } from 'lucide-react';
import LootClaimModal from '../loot/LootClaimModal';

const RARITY_BORDER: Record<string, string> = {
  common: 'border-gray-300 dark:border-gray-600',
  uncommon: 'border-emerald-400 dark:border-emerald-500',
  rare: 'border-blue-400 dark:border-blue-500',
  epic: 'border-purple-400 dark:border-purple-500',
  legendary: 'border-amber-400 dark:border-amber-500',
};

const LootBoxesCard: React.FC = () => {
  const { lootItems, fetchLootItems } = useGame();
  const [selectedLootItem, setSelectedLootItem] = useState<LootItem | null>(null);

  useEffect(() => {
    fetchLootItems();
  }, [fetchLootItems]);

  const hasItems = lootItems.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Package className="w-6 h-6 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Loot Boxes</h2>
        </div>
        {hasItems && (
          <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold px-2 py-0.5 rounded-full">
            {lootItems.length}
          </span>
        )}
      </div>

      {/* Body */}
      {hasItems ? (
        <div className="space-y-2 flex-1 mb-4 overflow-y-auto max-h-[260px] pr-1">
          {lootItems.map(item => (
            <div
              key={item.id}
              className={`rounded-lg p-3 border-2 ${RARITY_BORDER[item.box.rarity] || 'border-gray-200 dark:border-gray-700'} bg-gray-50 dark:bg-gray-900/30`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  {item.box.icon === 'egg' ? (
                    <Gift className="w-4 h-4 text-purple-500" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.box.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{item.box.rarity} · {item.source}</p>
                </div>
                <button
                  onClick={() => setSelectedLootItem(item)}
                  className="py-1.5 px-3 bg-purple-500 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 mb-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center mb-3">
            <Package className="w-7 h-7 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">No loot to claim</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
            Earn loot boxes from daily rewards, achievements, and milestones — they&apos;ll appear here to open.
          </p>
        </div>
      )}

      {/* Loot Claim Modal */}
      {selectedLootItem && (
        <LootClaimModal
          lootItem={selectedLootItem}
          onClose={() => setSelectedLootItem(null)}
          onClaimed={() => fetchLootItems()}
        />
      )}
    </div>
  );
};

export default LootBoxesCard;

import React from 'react';
import { X, Sparkles, Star, Flame, Palette } from 'lucide-react';
import { getRarityColor } from '../../utils/totems';
import { getColorName } from '../../utils/species';
import { getTraitById } from '../../config/traits';
import { TraitIcon } from '../../utils/traitIcons';

interface FusionResultModalProps {
  fusionType: 'pure' | 'wild';
  newTotem: {
    id: string;
    speciesId: number;
    speciesName: string;
    colorId: number;
    rarityId: number;
    stage: number;
    image: string;
    traits?: {
      innate: string | null;
      learned: string | null;
      awakened: string | null;
    };
  };
  achievements: Array<{
    achievementId: string;
    milestone?: number;
    rewards?: { essence?: number; xp?: number };
  }>;
  rarityNames: Record<number, string>;
  onClose: () => void;
}

const FusionResultModal: React.FC<FusionResultModalProps> = ({
  fusionType,
  newTotem,
  achievements,
  rarityNames,
  onClose,
}) => {
  const rarityColor = getRarityColor(newTotem.rarityId);
  const colorName = getColorName(newTotem.colorId);
  const innateTrait = getTraitById(newTotem.traits?.innate);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden
          animate-[fadeIn_0.3s_ease-out]"
      >
        {/* Header */}
        <div className={`relative p-6 bg-gradient-to-br ${rarityColor} text-center`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 text-white
              flex items-center justify-center hover:bg-black/30 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <Flame className="w-10 h-10 text-orange-500 mx-auto mb-2" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Fusion Complete!
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {fusionType === 'pure' ? 'Pure Fusion' : 'Wild Fusion'}
          </p>
        </div>

        {/* Totem reveal */}
        <div className="p-6 text-center">
          <div className="inline-block relative mb-4">
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 mx-auto
              bg-gradient-to-br ${rarityColor}`}
            >
              <img
                src={newTotem.image || '/images/placeholder.png'}
                alt={newTotem.speciesName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Innate trait badge — the trait this totem was forged with */}
            {innateTrait && (
              <div
                className="absolute -top-2 -left-2 inline-flex items-center gap-1 bg-white dark:bg-gray-800
                  rounded-full pl-1 pr-2 py-0.5 border border-stone-200 dark:border-gray-700 shadow-md"
                title={`Born trait: ${innateTrait.name}`}
              >
                <TraitIcon traitId={innateTrait.id} size={13} colorBySlot />
                <span className="text-[11px] font-medium text-stone-700 dark:text-stone-200">
                  {innateTrait.name}
                </span>
              </div>
            )}
          </div>

          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {newTotem.speciesName}
          </h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              {rarityNames[newTotem.rarityId] || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <Palette className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {colorName}
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Stage 1 &bull; Hatchling
          </p>

          {/* Achievement rewards */}
          {achievements.length > 0 && (
            <div className="mt-4 space-y-2">
              {achievements.map((ach, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center gap-2 px-3 py-2
                    bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                >
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-yellow-700 dark:text-yellow-400">
                    Achievement Unlocked!
                    {ach.rewards?.essence ? ` +${ach.rewards.essence} Essence` : ''}
                    {ach.rewards?.xp ? ` +${ach.rewards.xp} XP` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600
              transition-colors min-h-[48px]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default FusionResultModal;

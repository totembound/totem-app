import React, { useState } from 'react';
import { X, Sparkles, CheckCircle, ChevronDown } from 'lucide-react';
import { useGame, LootItem } from '../../contexts/GameContext';
import { CURRENCY_NAMES, speciesConfig } from '../../config/constants';
import { RARITIES } from '../../config/game-config';
import { getRarityFontColor } from '../../utils/totems';
import { Rarity } from '../../types/types';
import notificationService from '../../services/NotificationService';
import CelebrationModal from '../CelebrationModal';
import { getTotemImageUrl } from '../../utils/species';

interface LootClaimModalProps {
  lootItem: LootItem;
  onClose: () => void;
  onClaimed: () => void;
}

const _RARITY_BG: Record<string, string> = {
  common: 'bg-gray-100 dark:bg-gray-700',
  uncommon: 'bg-green-50 dark:bg-green-900/20',
  rare: 'bg-blue-50 dark:bg-blue-900/20',
  epic: 'bg-purple-50 dark:bg-purple-900/20',
  legendary: 'bg-yellow-50 dark:bg-yellow-900/20',
};

const availableSpecies = speciesConfig.species.filter((s: any) => s.available);
const rarityMap = Object.fromEntries(RARITIES.map(r => [r.id, r]));

const LootClaimModal: React.FC<LootClaimModalProps> = ({ lootItem, onClose, onClaimed }) => {
  const { claimLootItem } = useGame();
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimResult, setClaimResult] = useState<any>(null);
  const [totemImageUrl, setTotemImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const isTotemBox = lootItem.box.type === 'totem_box';
  const isEssenceBox = lootItem.box.type === 'essence_box';
  const rarity = isTotemBox ? rarityMap[lootItem.box.config.rarityId || 0] : null;
  const selectedSpecies = availableSpecies.find((s: any) => s.id === selectedSpeciesId);

  const handleClaim = async () => {
    setIsClaiming(true);
    setError(null);

    try {
      const options = isTotemBox && selectedSpeciesId !== null
        ? { speciesId: selectedSpeciesId }
        : undefined;

      const claimData = await claimLootItem(lootItem.id, options) as any;
      const lootResult = claimData?.result;

      // Get the real IPFS image (species data is bundled, no async needed)
      if (lootResult?.type === 'totem') {
        const totemData = lootResult.totem;
        setTotemImageUrl(getTotemImageUrl(totemData.speciesId, totemData.colorId, totemData.stage || 0));
      }

      setClaimResult(claimData);

      // Fire notification for loot box claim
      notificationService.showLootClaimed({
        boxName: lootItem.box.name,
        resultType: lootResult?.type || 'unknown',
        species: lootResult?.totem?.speciesName,
        rarity: lootResult?.totem?.rarityName,
        colorName: lootResult?.totem?.colorName,
        stageName: lootResult?.totem?.stageName,
        amount: lootResult?.amount,
      });

      // Show achievement notifications (e.g., "Chosen Keeper" on first totem)
      notificationService.processAchievementsFromResponse(lootResult?.achievements);
    } catch (err: any) {
      setError(err.message || 'Failed to open box');
    } finally {
      setIsClaiming(false);
    }
  };

  const canClaim = isEssenceBox || (isTotemBox && selectedSpeciesId !== null);

  // Result screen after claiming — use CelebrationModal for totem boxes
  if (claimResult) {
    if (claimResult.result?.type === 'totem') {
      const totemResult = claimResult.result.totem;
      const species = availableSpecies.find((s: any) => s.id === totemResult.speciesId);
      return (
        <CelebrationModal
          type="loot_claim"
          totem={{
            name: totemResult.speciesName,
            image: totemImageUrl || species?.image || '',
            attributes: {
              rarity: totemResult.rarityId as Rarity,
              displayName: `${totemResult.colorName || ''} ${totemResult.stageName || totemResult.speciesName}`.trim(),
              stage: totemResult.stage || 0,
              domain: species?.domain || '',
            },
          }}
          innateTraitId={totemResult.traits?.innate}
          onClose={() => { onClaimed(); onClose(); }}
        />
      );
    }

    // Essence box result — simple inline display
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-green-500">
            <CheckCircle className="w-full h-full" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {CURRENCY_NAMES.SOFT} Received!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You received <span className="font-semibold text-yellow-600">{claimResult.result?.amount?.toLocaleString()} {CURRENCY_NAMES.SOFT}</span>
          </p>
          <button
            onClick={() => { onClaimed(); onClose(); }}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
          >
            Awesome!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {lootItem.box.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {/* Box description */}
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
            {lootItem.box.description}
          </p>

          {rarity && (
            <p className={`text-base text-center mb-4 ${getRarityFontColor(lootItem.box.config.rarityId as Rarity)}`}>
              Rarity: <span className="font-semibold">{rarity.name}</span>
            </p>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Species combobox for totem boxes */}
          {isTotemBox && (
            <div className="mb-4">
              <label htmlFor="species-select" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Choose Your Species
              </label>
              <div className="relative">
                <select
                  id="species-select"
                  value={selectedSpeciesId ?? ''}
                  onChange={(e) => setSelectedSpeciesId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full appearance-none py-3 px-4 pr-10 bg-gray-50 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="">-- Select a species --</option>
                  {availableSpecies.map((species: any) => (
                    <option key={species.id} value={species.id}>
                      {species.name} — {species.domain} / {species.affinity}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              {/* Selected species details */}
              {selectedSpecies && (
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {selectedSpecies.image && (
                      <img
                        src={selectedSpecies.image}
                        alt={selectedSpecies.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedSpecies.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        STR: {selectedSpecies.baseStats.strength} | AGI: {selectedSpecies.baseStats.agility} | WIS: {selectedSpecies.baseStats.wisdom}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {selectedSpecies.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Essence box info */}
          {isEssenceBox && lootItem.box.config.minAmount && lootItem.box.config.maxAmount && (
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You'll receive between{' '}
                <span className="font-semibold">{lootItem.box.config.minAmount.toLocaleString()}</span> and{' '}
                <span className="font-semibold">{lootItem.box.config.maxAmount.toLocaleString()}</span>{' '}
                {CURRENCY_NAMES.SOFT}
              </p>
            </div>
          )}

          {/* Claim button */}
          <button
            onClick={handleClaim}
            disabled={!canClaim || isClaiming}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {isClaiming ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Opening...
              </>
            ) : isTotemBox ? (
              selectedSpeciesId !== null ? 'Claim!' : 'Select a Species'
            ) : (
              'Open!'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LootClaimModal;

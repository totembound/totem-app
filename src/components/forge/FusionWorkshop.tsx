import React, { useState, useMemo } from 'react';
import { ArrowLeft, Flame, Shuffle, Dna } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import { apiClient } from '../../services/ApiClient';
import { notificationService } from '../../services/NotificationService';
import { Rarity } from '../../types/types';
import FusionSelectionPanel from './FusionSelectionPanel';
import FusionPreview from './FusionPreview';
import FusionResultModal from './FusionResultModal';

interface FusionWorkshopProps {
  onBack: () => void;
}

type FusionMode = 'pure' | 'wild' | null;

const RARITY_NAMES: Record<number, string> = {
  0: 'Common',
  1: 'Uncommon',
  2: 'Rare',
  3: 'Epic',
  4: 'Legendary',
};

const FusionWorkshop: React.FC<FusionWorkshopProps> = ({ onBack }) => {
  const { totems, fetchTotems, updateBalances } = useUser();
  const { refreshAchievements } = useAchievements();

  const [fusionMode, setFusionMode] = useState<FusionMode>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isForging, setIsForging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    fusionType: 'pure' | 'wild';
    newTotem: {
      id: string;
      speciesId: number;
      speciesName: string;
      colorId: number;
      rarityId: number;
      stage: number;
      image: string;
    };
    achievements: Array<{ achievementId: string; milestone?: number; rewards?: { essence?: number; xp?: number } }>;
  } | null>(null);

  // Get eligible totems (not Legendary, not Limited, user-owned)
  const eligibleTotems = useMemo(() => {
    return totems.filter(t => {
      const rarity = t.attributes.rarity;
      return rarity !== Rarity.Legendary && rarity !== Rarity.Limited;
    });
  }, [totems]);

  // Group by rarity to find which rarities have 3+ totems
  const rarityGroups = useMemo(() => {
    const groups: Record<number, typeof totems> = {};
    for (const t of eligibleTotems) {
      const r = t.attributes.rarity;
      if (!groups[r]) groups[r] = [];
      groups[r].push(t);
    }
    return groups;
  }, [eligibleTotems]);

  // Available rarities (have 3+ eligible totems)
  const availableRarities = useMemo(() => {
    return Object.entries(rarityGroups)
      .filter(([, tList]) => tList.length >= 3)
      .map(([r]) => Number(r))
      .sort();
  }, [rarityGroups]);

  // Filtered totems based on selection
  const filteredTotems = useMemo(() => {
    if (selectedIds.length === 0) return eligibleTotems;

    const firstSelected = totems.find(t => t.id === selectedIds[0]);
    if (!firstSelected) return eligibleTotems;

    const targetRarity = firstSelected.attributes.rarity;

    return eligibleTotems.filter(t => {
      if (t.attributes.rarity !== targetRarity) return false;
      if (fusionMode === 'pure' && t.attributes.species !== firstSelected.attributes.species) return false;
      return true;
    });
  }, [eligibleTotems, selectedIds, fusionMode, totems]);

  const handleSelectTotem = (totemId: string) => {
    if (selectedIds.includes(totemId)) {
      setSelectedIds(prev => prev.filter(id => id !== totemId));
    } else if (selectedIds.length < 3) {
      setSelectedIds(prev => [...prev, totemId]);
    }
    setError(null);
  };

  const handleForge = async () => {
    if (selectedIds.length !== 3) return;

    setIsForging(true);
    setError(null);

    try {
      const response = await apiClient.fuseTotem(selectedIds);

      if (response.success && response.data) {
        setResult({
          fusionType: response.data.fusionType,
          newTotem: response.data.newTotem,
          achievements: response.data.achievements,
        });
        // Refresh totems and balances
        fetchTotems();
        updateBalances();
        refreshAchievements();

        // Show fusion notification
        notificationService.showTotemForged({
          fusionType: response.data.fusionType,
          speciesName: response.data.newTotem.speciesName,
          rarityName: RARITY_NAMES[response.data.newTotem.rarityId] || 'Unknown',
        });

        // Process achievement notifications
        notificationService.processAchievementsFromResponse(response.data.achievements);
      } else {
        setError(response.error?.message || 'Fusion failed');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setIsForging(false);
    }
  };

  const handleResultClose = () => {
    setResult(null);
    setSelectedIds([]);
    setFusionMode(null);
  };

  const selectedTotems = selectedIds.map(id => totems.find(t => t.id === id)).filter(Boolean);

  // Mode selection screen
  if (!fusionMode) {
    return (
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Forge</span>
        </button>

        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Choose Fusion Mode
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Select how you want to combine your totems
          </p>
        </div>

        {availableRarities.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <Flame className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Not enough totems to forge
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              You need at least 3 totems of the same rarity
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pure Fusion */}
            <button
              onClick={() => setFusionMode('pure')}
              className="group p-6 rounded-xl border-2 border-indigo-200 dark:border-indigo-800
                bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30
                hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-lg
                transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-200 dark:bg-indigo-800/50 flex items-center justify-center">
                  <Dna className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pure Fusion
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Combine 3 totems of the <strong>same species and rarity</strong>. The result keeps the same species at a higher rarity.
              </p>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Guaranteed same species
              </div>
            </button>

            {/* Wild Fusion */}
            <button
              onClick={() => setFusionMode('wild')}
              className="group p-6 rounded-xl border-2 border-emerald-200 dark:border-emerald-800
                bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30
                hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg
                transition-all text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-200 dark:bg-emerald-800/50 flex items-center justify-center">
                  <Shuffle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Wild Fusion
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                Combine 3 totems of the <strong>same rarity</strong> (any species). The result is a random species at a higher rarity.
              </p>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Random species, easier to fill
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fusion workflow
  return (
    <div>
      <button
        onClick={() => {
          setFusionMode(null);
          setSelectedIds([]);
          setError(null);
        }}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to Mode Selection</span>
      </button>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {fusionMode === 'pure' ? 'Pure Fusion' : 'Wild Fusion'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Select 3 totems of the same rarity ({selectedIds.length}/3)
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Preview Area */}
      {selectedIds.length > 0 && (
        <FusionPreview
          selectedTotems={selectedTotems as typeof totems}
          fusionMode={fusionMode}
          targetRarity={selectedTotems[0] ? selectedTotems[0].attributes.rarity + 1 : 0}
          rarityNames={RARITY_NAMES}
          onRemove={(id) => setSelectedIds(prev => prev.filter(i => i !== id))}
        />
      )}

      {/* Forge Button */}
      {selectedIds.length === 3 && (
        <div className="my-4 text-center">
          <button
            onClick={handleForge}
            disabled={isForging}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg hover:shadow-xl transition-all min-h-[48px]"
          >
            <Flame className="w-5 h-5" />
            {isForging ? 'Forging...' : 'Forge!'}
          </button>
          <p className="text-xs text-red-500 dark:text-red-400 mt-2">
            Warning: The 3 selected totems will be consumed
          </p>
        </div>
      )}

      {/* Totem Selection Grid */}
      <FusionSelectionPanel
        totems={filteredTotems}
        selectedIds={selectedIds}
        onSelect={handleSelectTotem}
        fusionMode={fusionMode}
        availableRarities={availableRarities}
        rarityNames={RARITY_NAMES}
      />

      {/* Result Modal */}
      {result && (
        <FusionResultModal
          fusionType={result.fusionType}
          newTotem={result.newTotem}
          achievements={result.achievements}
          rarityNames={RARITY_NAMES}
          onClose={handleResultClose}
        />
      )}
    </div>
  );
};

export default FusionWorkshop;

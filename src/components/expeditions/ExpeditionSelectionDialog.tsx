import React, { useState, useEffect } from "react";
import { useUser } from "../../contexts/UserContext";
import { useGame } from "../../contexts/GameContext";
import { ethers } from "ethers";
import { X, MapPin, Heart, AlertCircle, Zap, Sparkles } from "lucide-react";
import { Domain } from "../../types/types";
import { formatTokenAmount } from "../../utils/formats";
import { getRarityBorderColor, getTotemStage } from "../../utils/totems";
import expeditions from "../data/expeditions.json";
import { IPFS_GATEWAY_URL } from "../../config/constants";

interface ExpeditionSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expeditionId: string;
  onStart: (expeditionId: string, totemIds: string[]) => Promise<boolean>;
}

const ExpeditionSelectionDialog: React.FC<ExpeditionSelectionDialogProps> = ({
  isOpen,
  onClose,
  expeditionId,
  onStart,
}) => {
  const { totems, totemBalance } = useUser();
  const { expeditionState } = useGame();
  const [selectedTotems, setSelectedTotems] = useState<string[]>([]);
  const [captain, setCaptain] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamScore, setTeamScore] = useState(70); // Base score
  const [hideUnavailable, setHideUnavailable] = useState(true);

  // Find expedition config
  const expedition = expeditions.find((exp) => exp.id === expeditionId);

  // Get all totems currently on expedition
  const totemsOnExpedition = new Set(
    expeditionState.userExpeditions
      ?.filter(
        (exp) => !exp.completed
      )
      ?.flatMap((exp) => exp.totemIds) || []
  );

  // Filter eligible totems
  const eligibleTotems = totems.filter(
    (totem) =>
      expedition &&
      totem.attributes.happiness >= expedition.happinessCost &&
      !totemsOnExpedition.has(BigInt(totem.id)) &&
      getTotemStage(totem) >= expedition.minStage
  );

  // Reset selections when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTotems([]);
      setCaptain(null);
      setError(null);
      setTeamScore(50); // Reset to base score
      setHideUnavailable(true);
    }
  }, [isOpen]);

  // Calculate team score based on composition
  useEffect(() => {
    if (!expedition || selectedTotems.length === 0) {
      setTeamScore(50);
      return;
    }

    let score = 50;
    
    if (captain) {
      const captainTotem = totems.find((t) => t.id === captain);
      // Captain domain bonus
      if (captainTotem?.domain?.toLowerCase() === Domain[expedition.domain].toLowerCase()) {
        score += 15;
      }
      // Captain Elder bonus
      if (captainTotem?.attributes.stage! >= 4) {
        score += 10;
      }
    }

    // Domain synergy calculation
    let domainMatches = 0;

    // Count captain domain match
    if (captain) {
      const captainTotem = totems.find((t) => t.id === captain);
      if (captainTotem?.domain?.toLowerCase() === Domain[expedition.domain].toLowerCase()) {
        domainMatches++;
      }
    }

    // Count team member domain matches
    selectedTotems.forEach((id) => {
      if (id !== captain) { // Skip captain, already counted
        const totem = totems.find((t) => t.id === id);
        if (totem?.domain?.toLowerCase() === Domain[expedition.domain].toLowerCase()) {
          domainMatches++;
        }
      }
    });

    // Domain synergy bonus
    if (domainMatches === 3) {
      score += 15; // All same domain bonus
    } else if (domainMatches === 2) {
      score += 8; // Partial domain bonus
    }

    // Affinity matching
    const affinityCount = { strength: 0, agility: 0, wisdom: 0 };
    
    // Only count team members (not captain) for affinity
    selectedTotems.forEach((id) => {
      if (id !== captain) { // Contract only counts team members for affinity
        const totem = totems.find((t) => t.id === id);
        if (totem?.affinity) {
          affinityCount[
            totem.affinity.toLowerCase() as keyof typeof affinityCount
          ]++;
        }
      }
    });

    // Primary affinity bonus
    const primaryAffinity = expedition.primaryAffinity.toLowerCase();
    const primaryAffinityCount = affinityCount[primaryAffinity as keyof typeof affinityCount];
    if (primaryAffinityCount > 0) {
      score += 5 + (primaryAffinityCount * 3); // Scale with count - matches contract
    }

    // Shared affinity bonus (+8) 
    const hasSharedAffinity = Object.values(affinityCount).some(
      (count) => count >= 2
    );
    if (hasSharedAffinity) {
      score += 8;
    }

    // Balanced team bonus (+5)
    const hasAllAffinities = Object.values(affinityCount).every(
      (count) => count >= 1
    );
    if (hasAllAffinities && selectedTotems.length === 3) {
      score += 5;
    }

    // Cap at 100 and ensure no negative scores
    setTeamScore(Math.min(100, Math.max(0, score)));
  }, [selectedTotems, expedition, totems, captain]);

  // Check if totem is already on an expedition
  const isTotemOnExpedition = (totemId: string) => {
    // Check all incomplete expeditions
    return expeditionState.userExpeditions?.some(
      (exp) => !exp.completed 
        && (exp.totemIds[0] === BigInt(totemId) 
            || exp.totemIds?.includes(BigInt(totemId)))
    );
  };

  // Check if totem is eligible for this expedition
  const isEligibleTotem = (totemId: string) => {
    const totem = totems.find((t) => t.id === totemId);
    if (!totem || !expedition) return false;

    // Check if totem has enough happiness
    if (totem.attributes.happiness < expedition.happinessCost) return false;

    // Check if totem is minimum stage
    if (getTotemStage(totem) <= expedition.minStage) return false;


    // Check if totem is already on another expedition
    if (isTotemOnExpedition(totemId)) return false;

    return true;
  };

  if (!expedition || !isOpen) return null;

  // Check if totem has matching domain for captain
  const hasMatchingDomain = (totemId: string) => {
    const totem = totems.find((t) => t.id === totemId);
    if (!totem) return false;

    const totemDomain = totem.domain?.toLowerCase();
    const requiredDomain = Domain[expedition.domain].toLowerCase();
    return totemDomain === requiredDomain;
  };

  // Check if user can afford the expedition
  const canAffordExpedition = () => {
    const cost = BigInt(expedition.totemCost);
    const balance = ethers.parseEther(totemBalance);

    return balance >= cost;
  };

  // Handle totem selection
  const toggleTotemSelection = (totemId: string) => {
    if (selectedTotems.includes(totemId)) {
      // Deselect
      setSelectedTotems((prev) => prev.filter((id) => id !== totemId));
      if (captain === totemId) {
        setCaptain(null);
      }
    }
    else {
      if (selectedTotems.length < 3) {
        const totemHasMatchingDomain = hasMatchingDomain(totemId);
        
        if (!captain && totemHasMatchingDomain) {
            setCaptain(totemId);
            setSelectedTotems((prev) => [...prev, totemId]);
        }
        else if (selectedTotems.length < 3) {
            setSelectedTotems((prev) => [...prev, totemId]);
        }
      }
    }
  };

  // Set a totem as captain
  const toggleCaptain = (totemId: string) => {
    if (selectedTotems.includes(totemId)) {
      if (captain === totemId) {
        setCaptain(null);
      }
      else {
        setCaptain(totemId);
      }
    }
  };

  // Check if expedition can be started
  const canStartExpedition = () => {
    if (!canAffordExpedition()) return false;
    if (selectedTotems.length !== 3) return false;
    if (!captain || !hasMatchingDomain(captain)) return false;

    return true;
  };

  // Handle start expedition
  const handleStartExpedition = async () => {
    if (!canStartExpedition()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Ensure captain is first in the array
      const sortedTotems = [
        captain as string,
        ...selectedTotems.filter((id) => id !== captain),
      ];

      const result = await onStart(expeditionId, sortedTotems);
      if (result) {
        onClose();
      }
      else {
        setError("Failed to start expedition. Please try again.");
      }
    }
    catch (err: any) {
      console.error("Expedition error:", err);
      setError(err.message || "Failed to start expedition");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  // Get score-based rewards display
  const getRewardsText = () => {
    if (teamScore >= 90) {
      return {
        exp: `${Math.floor(expedition.baseExperience * 1.5)} XP`, // Great Success: 150%
        runeChance: "High Rune Chance (+30%)", // Contract uses 130% multiplier
        details: "Great Success! Your team has excellent synergy!",
      };
    }
    else if (teamScore >= 70) {
      return {
        exp: `${Math.floor(expedition.baseExperience * 1.25)} XP`, // Success: 125%
        runeChance: "Normal Rune Chance", // Contract uses 100% multiplier
        details: "Success! Your team has good synergy.",
      };
    }
    else {
      return {
        exp: `${Math.floor(expedition.baseExperience * 0.5)} XP`, // Failure: 50%
        runeChance: "Low Rune Chance (-50%)", // Contract uses 50% multiplier
        details: "Poor synergy. Consider a better team composition.",
      };
    }
  };

  const filteredTotems = hideUnavailable 
    ? totems.filter(totem => isEligibleTotem(totem.id))
    : totems;
    
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 min-h-screen z-50 overflow-y-auto mt-0">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={onClose}
          ></div>

          {/* Dialog */}
          <div className="flex min-h-screen items-center justify-center">
            <div className="relative w-full max-w-2xl p-2 sm:p-4 md:p-6 transform rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Prepare for {expedition.name}
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative h-64">
                {expedition.image && (
                    <img 
                        src={expedition.image || '/expeditions/placeholder.png'}
                        alt={`${expedition.domainName} expedition background`}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
              </div>
              {/* Expedition Info */}
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700/30 rounded-b-lg">
                <p className="font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {expedition.description}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {expedition.domainName} Domain • {expedition.durationHours < 1 ? `${Math.round(expedition.durationHours * 60)} minutes` : `${expedition.durationHours} hours`}{" "}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Each totem will lose {expedition.happinessCost} happiness
                    during this expedition
                  </span>
                </div>
              </div>

            {/* Team Score Display */}
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">
                    Team Synergy Score
                  </h4>
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {teamScore}%
                  </span>
                </div>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      teamScore >= 90
                        ? "bg-green-500"
                        : teamScore >= 70
                        ? "bg-blue-500"
                        : "bg-yellow-500"
                    }`}
                    style={{ width: `${teamScore}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-emerald-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                        Expected XP: {getRewardsText().exp}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                        {getRewardsText().runeChance}
                        </span>
                    </div>
                  </div>
                  <div className="ml-auto font-medium text-gray-600 dark:text-gray-400">
                    {getRewardsText().details}
                  </div>
                </div>
              </div>

              {/* Instructions with Filter Checkbox */}
              <div className="mb-2 px-1 flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Select Your Team (3 Totems)
                </h3>
                
                {/* Checkbox to hide unavailable totems */}
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                      Hide Unavailable
                    </span>
                    <input
                      type="checkbox"
                      checked={hideUnavailable}
                      onChange={() => setHideUnavailable(!hideUnavailable)}
                      className="form-checkbox h-4 w-4 text-purple-600 transition duration-150 ease-in-out rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Totem Selection List */}
              <div className="mb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
                {filteredTotems.length > 0 ? (
                    filteredTotems.map((totem) => {
                    const isSelected = selectedTotems.includes(totem.id);
                    const isCaptain = captain === totem.id;
                    const isEligible = isEligibleTotem(totem.id);
                    const totemHasMatchingDomain = hasMatchingDomain(totem.id);
                    const onExpedition = isTotemOnExpedition(totem.id);
                    // Get rarity border colors
                    const rarityColors = getRarityBorderColor(totem.attributes.rarity);

                    return (
                      <div
                        key={totem.id}
                        className={`p-2 border rounded-lg transition-colors relative
                          ${
                            isSelected
                              ? isCaptain
                                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                                : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }
                          ${
                            !isEligible || onExpedition
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          }
                        `}
                        onClick={() =>
                          isEligible &&
                          !onExpedition &&
                          toggleTotemSelection(totem.id)
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div className={`relative w-12 h-12 rounded-lg overflow-hidden border ${rarityColors.border}`}>
                            <img
                              src={
                                totem.image?.replace(
                                  "ipfs://",
                                  IPFS_GATEWAY_URL
                                ) || "/images/placeholder.png"
                              }
                              alt={`Totem #${totem.id}`}
                              className="w-full h-full object-cover"
                            />
                            {totemHasMatchingDomain && (
                              <div className="absolute top-0 right-0 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <MapPin className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {totem.attributes.displayName || `#${totem.id}`}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {totem.affinity} • {totem.domain}
                            </div>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              
                              <Heart className="w-3 h-3 mr-1 text-pink-500 fill-pink-500" />
                              {totem.attributes.happiness}
                              <Sparkles className="w-3 h-3 mx-1 text-blue-500 dark:text-blue-400" />
                              {totem.attributes.stage+1} 
                            </div>
                          </div>
                        </div>

                        {onExpedition && (
                            <div className="mt-2 px-2 py-0.5 bg-red-400/70 text-white text-xs rounded">On Expedition</div>
                        )}
                        {!onExpedition && (
                            <div className="mt-2 flex justify-between items-center">
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {!isSelected ? "" : isCaptain ? "Captain" : "Team member"}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isEligible) {
                                            toggleCaptain(totem.id);
                                            if (!isSelected) {
                                                toggleTotemSelection(totem.id);
                                            }
                                        }
                                    }}
                                    className={`text-xs px-2 py-0.5 rounded
                                    ${
                                        isCaptain
                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                        : (totemHasMatchingDomain && isEligible)
                                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 opacity-50 cursor-not-allowed"
                                    }
                                    `}
                                    disabled={!totemHasMatchingDomain && !isCaptain}
                                >
                                    {isCaptain
                                    ? "Captain"
                                    : totemHasMatchingDomain
                                    ? "Set Captain"
                                    : "Wrong Domain"}
                                </button>
                            </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                    <div className="p-4 col-span-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                      <AlertCircle className="w-8 h-8 text-yellow-500 mb-2" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No Totems Available</h3>
                      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                        {hideUnavailable 
                          ? "No eligible totems found. Try unchecking 'Hide Unavailable' to see all totems."
                          : "All your totems are either on expeditions already or have insufficient happiness."}
                      </p>
                      {hideUnavailable && (
                        <button 
                          onClick={() => setHideUnavailable(false)}
                          className="mt-3 px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-lg transition-colors"
                        >
                          Show All Totems
                        </button>
                      )}
                    </div>
                )}
                </div>
              </div>

              {/* Team Summary */}
              <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    Selected: {selectedTotems.length}/3
                  </span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    Captain:{" "}
                    {captain ? (hasMatchingDomain(captain) ? "✓" : "✗") : "—"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartExpedition}
                  disabled={!canStartExpedition() || isSubmitting}
                  className={`px-4 py-2 rounded-lg text-white 
                    ${
                      canStartExpedition() && !isSubmitting
                        ? "bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-500"
                        : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                    }
                  `}
                >
                  {isSubmitting
                    ? "Starting..."
                    : `Start Expedition (${formatTokenAmount(expedition.totemCost)} TOTEM)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpeditionSelectionDialog;

import React, { useState, useEffect, useCallback } from 'react';
import { Crown, X } from 'lucide-react';
import { getRarityBorderColor } from '../../utils/totems';
import { IPFS_GATEWAY_URL } from '../../config/constants';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import apiClient from '../../services/ApiClient';
import { notificationService } from '../../services/NotificationService';
import TokensDisplay from '../TokensDisplay';
import SanctumSeat from './SanctumSeat';
import SanctumClaimBanner from './SanctumClaimBanner';
import CouncilMissionPanel from './CouncilMissionPanel';
import type { MissionClaimResult } from '../../contexts/GameContext';
import MissionRewardsDialog from './MissionRewardsDialog';
import { SANCTUM_CONFIG } from '../../config/sanctum';
import { isAvailableForExpedition } from '../../utils/totem-availability';
import type { SanctumState, SanctumSeatInfo, TotemData } from '../../types/types';

const SANCTUM_MIN_XP = 3500; // Stage 4 (Adult) — internal stage 3

const ElderSanctum: React.FC = () => {
  const { totems, essenceBalance, updateBalances, fetchTotems } = useUser();
  const { expeditionState } = useGame();

  const [sanctumState, setSanctumState] = useState<SanctumState | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimLoading, setClaimLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noEligible, setNoEligible] = useState(false);

  // Totem picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSeatIndex, setPickerSeatIndex] = useState<number | null>(null);
  const [seatLoading, setSeatLoading] = useState(false);

  // Mission panel state
  const [missionTotemId, setMissionTotemId] = useState<string | null>(null);
  const [missionRewardResult, setMissionRewardResult] = useState<MissionClaimResult | null>(null);

  const fetchSanctum = useCallback(async () => {
    try {
      setError(null);
      const response = await apiClient.getSanctum();
      if (!response.success || !response.data) {
        const code = response.error?.code ?? '';
        if (code === 'NO_STAGE4_TOTEMS' || code === 'FORBIDDEN') {
          setNoEligible(true);
          setSanctumState(null);
          return;
        }
        setError(response.error?.message ?? 'Failed to load sanctum');
        return;
      }
      setSanctumState(response.data);
      setNoEligible(false);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load sanctum');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSanctum();
  }, [fetchSanctum]);

  const seatedTotemIds = new Set(sanctumState?.seats.map((s) => s.totemId) ?? []);
  const totemsOnExpedition = new Set(
    expeditionState.userExpeditions
      ?.filter((exp) => !exp.completed)
      ?.flatMap((exp) => exp.totemIds) || []
  );

  const eligibleTotems = totems.filter(
    (t) =>
      t.attributes.experience >= SANCTUM_MIN_XP &&
      !seatedTotemIds.has(t.id) &&
      !totemsOnExpedition.has(t.id) &&
      isAvailableForExpedition(t.attributes) // not on council mission
  );

  const handleOpenPicker = (seatIndex: number) => {
    setPickerSeatIndex(seatIndex);
    setPickerOpen(true);
  };

  const handleSeat = async (totem: TotemData) => {
    if (pickerSeatIndex === null) return;
    setSeatLoading(true);
    try {
      const res = await apiClient.seatTotem(totem.id, pickerSeatIndex);
      setPickerOpen(false);
      setPickerSeatIndex(null);
      if (!res.success) {
        setError(res.error?.message ?? 'Failed to seat totem');
        return;
      }
      await Promise.all([fetchSanctum(), updateBalances(), fetchTotems()]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to seat totem');
    } finally {
      setSeatLoading(false);
    }
  };

  const handleUnseat = async (totemId: string) => {
    try {
      const res = await apiClient.unseatTotem(totemId);
      if (!res.success) {
        setError(res.error?.message ?? 'Failed to unseat totem');
        return;
      }
      await Promise.all([fetchSanctum(), updateBalances(), fetchTotems()]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to unseat totem');
    }
  };

  const handleClaim = async () => {
    setClaimLoading(true);
    try {
      const res = await apiClient.claimSanctum();
      if (!res.success) {
        setError(res.error?.message ?? 'Failed to claim essence');
        return;
      }
      if (res.data?.totalClaimed) {
        notificationService.showSanctumClaimed({ totalClaimed: res.data.totalClaimed });
      }
      notificationService.processAchievementsFromResponse(res.data?.achievements);
      await Promise.all([fetchSanctum(), updateBalances()]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to claim essence');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleViewMissions = (totemId: string) => {
    setMissionTotemId(totemId);
  };

  const handleMissionStartedOrCancelled = async () => {
    setMissionTotemId(null);
    await Promise.all([fetchSanctum(), updateBalances(), fetchTotems()]);
  };

  const handleMissionClaimed = async (result: MissionClaimResult) => {
    setMissionTotemId(null);
    setMissionRewardResult(result);
    notificationService.showMissionRewards({
      missionName: result.missionName,
      xp: result.xp,
      runesGained: result.runesGained,
    });
    // Rune balances, totem XP, and achievements are updated inline by claimCouncilMission.
    // Refresh sanctum state for cleared activeMission, and totems for sanctum.onMission flag.
    await Promise.all([fetchSanctum(), fetchTotems()]);
  };

  // Resolve mission panel data
  const missionSeat = missionTotemId
    ? sanctumState?.seats.find((s) => s.totemId === missionTotemId) ?? null
    : null;
  const missionTotem = missionTotemId
    ? totems.find((t) => t.id === missionTotemId)
    : null;

  // Build seat data for all 3 seats
  const seatMap = new Map<number, SanctumSeatInfo>();
  sanctumState?.seats.forEach((s) => seatMap.set(s.seatIndex, s));
  const lockedSet = new Set(sanctumState?.lockedSeats ?? []);

  if (loading) {
    return (
      <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
        <Header />
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse text-gray-400 dark:text-gray-500">Loading Elder Sanctum...</div>
        </div>
      </div>
    );
  }

  if (noEligible) {
    return (
      <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-center px-4">
          <Crown className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Ascended Totems</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            The Elder Sanctum requires Stage 4+ (Adult) totems with 3,500+ XP.
            Train your totems to unlock this feature.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <Header />

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {sanctumState && sanctumState.seats.length > 0 && (
        <SanctumClaimBanner
          totalAccumulated={sanctumState.totalAccumulated}
          seats={sanctumState.seats}
          onClaim={handleClaim}
          isLoading={claimLoading}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: SANCTUM_CONFIG.maxSeats }, (_, i) => {
          const isLocked = lockedSet.has(i);
          const seatReq = SANCTUM_CONFIG.seatRequirements[i];

          const seat = seatMap.get(i) ?? null;
          const totemData = seat ? totems.find(t => t.id === seat.totemId) : undefined;

          return (
            <SanctumSeat
              key={i}
              seatIndex={i}
              seatInfo={seat}
              totemData={totemData}
              isLocked={isLocked}
              lockReason={isLocked ? seatReq?.label : undefined}
              onSeat={() => handleOpenPicker(i)}
              onUnseat={handleUnseat}
              onViewMissions={handleViewMissions}
            />
          );
        })}
      </div>

      {/* Totem Picker Modal */}
      {pickerOpen && (
        <TotemPicker
          eligibleTotems={eligibleTotems}
          onSelect={handleSeat}
          onClose={() => { setPickerOpen(false); setPickerSeatIndex(null); }}
          isLoading={seatLoading}
        />
      )}

      {/* Council Mission Panel */}
      {missionTotemId && missionSeat && (
        <CouncilMissionPanel
          totemId={missionTotemId}
          totemName={missionSeat.totemName}
          totemStage={missionTotem?.attributes.stage ?? 0}
          currentHappiness={missionTotem?.attributes.happiness ?? 0}
          currentEssence={Number(essenceBalance) || 0}
          activeMission={missionSeat.activeMission}
          onClose={() => setMissionTotemId(null)}
          onMissionStarted={handleMissionStartedOrCancelled}
          onMissionClaimed={handleMissionClaimed}
          onMissionCancelled={handleMissionStartedOrCancelled}
        />
      )}

      {/* Mission Rewards Dialog */}
      {missionRewardResult && (
        <MissionRewardsDialog
          missionName={missionRewardResult.missionName}
          xpGained={missionRewardResult.xp}
          runesGained={missionRewardResult.runesGained}
          onClose={() => setMissionRewardResult(null)}
        />
      )}
    </div>
  );
};

/** Page header with title and balance display — matches Rewards/Totems/Shop pattern */
const Header: React.FC = () => (
  <div className="mb-6 space-y-4 sm:space-y-0">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Elder Sanctum</h1>
        <p className="text-gray-600 dark:text-gray-400">Seat your Elders. Earn passive Essence. Lead Council Missions.</p>
      </div>
      <TokensDisplay />
    </div>
  </div>
);

/** Simple modal for picking a totem to seat */
interface TotemPickerProps {
  eligibleTotems: TotemData[];
  onSelect: (totem: TotemData) => void;
  onClose: () => void;
  isLoading: boolean;
}

const TotemPicker: React.FC<TotemPickerProps> = ({ eligibleTotems, onSelect, onClose, isLoading }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
        role="dialog"
        aria-label="Select a totem to seat"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Choose an Elder</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Totem list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {eligibleTotems.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
              No eligible totems available. You need Stage 4+ (Adult) totems that aren't already seated.
            </p>
          ) : (
            eligibleTotems.map((totem) => {
              const rarityColors = getRarityBorderColor(totem.attributes.rarity);
              const imageUrl = totem.image?.replace('ipfs://', IPFS_GATEWAY_URL) || '/images/placeholder.png';
              return (
                <div
                  key={totem.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600
                    hover:border-amber-300 dark:hover:border-amber-600 transition-colors cursor-pointer"
                  onClick={() => !isLoading && onSelect(totem)}
                >
                  <div className={`relative w-12 h-12 overflow-hidden rounded-lg border-2 ${rarityColors.border} shrink-0`}>
                    <img
                      src={imageUrl}
                      alt={totem.attributes.nickname || totem.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {totem.attributes.nickname || totem.displayName || totem.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Stage {(totem.attributes.stage ?? 0) + 1} · {totem.attributes.experience.toLocaleString()} XP
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSelect(totem); }}
                    disabled={isLoading}
                    className="shrink-0 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-600
                      text-white font-semibold rounded-lg px-4 min-h-[44px] transition-colors duration-150"
                  >
                    {isLoading ? '...' : 'Seat'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ElderSanctum;

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Swords } from 'lucide-react';
import { COUNCIL_MISSIONS } from '../../config/sanctum';
import type { ActiveCouncilMission } from '../../types/types';
import CouncilMissionCard from './CouncilMissionCard';
import CouncilMissionActive from './CouncilMissionActive';
import apiClient from '../../services/ApiClient';
import { useGame } from '../../contexts/GameContext';
import type { MissionClaimResult } from '../../contexts/GameContext';

interface CouncilMissionPanelProps {
  totemId: string;
  totemName: string;
  totemStage: number;
  currentHappiness: number;
  currentEssence: number;
  activeMission: ActiveCouncilMission | null;
  onClose: () => void;
  onMissionStarted: () => void;
  onMissionClaimed: (result: MissionClaimResult) => void;
  onMissionCancelled: () => void;
}

const TIER_ORDER: Array<'governance' | 'diplomacy' | 'legacy'> = ['governance', 'diplomacy', 'legacy'];

const TIER_LABELS: Record<string, string> = {
  governance: 'Governance',
  diplomacy: 'Diplomacy',
  legacy: 'Legacy',
};

const CouncilMissionPanel: React.FC<CouncilMissionPanelProps> = ({
  totemId,
  totemName,
  totemStage,
  currentHappiness,
  currentEssence,
  activeMission,
  onClose,
  onMissionStarted,
  onMissionClaimed,
  onMissionCancelled,
}) => {
  const { claimCouncilMission } = useGame();
  const [loadingMissionId, setLoadingMissionId] = useState<string | null>(null);
  const [activeLoading, setActiveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleStartMission = async (missionId: string) => {
    setLoadingMissionId(missionId);
    setError(null);
    try {
      const res = await apiClient.startCouncilMission(totemId, missionId);
      if (!res.success) {
        setError(res.error?.message ?? 'Failed to start mission');
        return;
      }
      onMissionStarted();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to start mission');
    } finally {
      setLoadingMissionId(null);
    }
  };

  const handleClaim = async () => {
    setActiveLoading(true);
    setError(null);
    try {
      const result = await claimCouncilMission(totemId);
      if (!result) {
        setError('Failed to claim mission');
        return;
      }
      onMissionClaimed(result);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to claim mission');
    } finally {
      setActiveLoading(false);
    }
  };

  const handleCancel = async () => {
    setActiveLoading(true);
    setError(null);
    try {
      const res = await apiClient.cancelCouncilMission(totemId);
      if (!res.success) {
        setError(res.error?.message ?? 'Failed to cancel mission');
        return;
      }
      onMissionCancelled();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to cancel mission');
    } finally {
      setActiveLoading(false);
    }
  };

  // Group missions by tier
  const missionsByTier = TIER_ORDER.reduce<Record<string, typeof COUNCIL_MISSIONS>>((acc, tier) => {
    acc[tier] = COUNCIL_MISSIONS.filter((m) => m.tier === tier);
    return acc;
  }, {});

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-800 sm:bg-transparent sm:dark:bg-transparent sm:flex sm:items-center sm:justify-center sm:p-4">
      <div className="hidden sm:block fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full h-full sm:h-auto sm:max-w-lg sm:max-h-[85vh] bg-white dark:bg-gray-800 sm:rounded-xl shadow-xl flex flex-col overflow-hidden"
        role="dialog"
        aria-label="Council Missions"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Swords className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              Council Missions — {totemName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
              min-w-[48px] min-h-[48px] flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeMission ? (
            <CouncilMissionActive
              mission={activeMission}
              totemId={totemId}
              onClaim={handleClaim}
              onCancel={handleCancel}
              isLoading={activeLoading}
            />
          ) : (
            <div className="space-y-6">
              {TIER_ORDER.map((tier) => {
                const missions = missionsByTier[tier];
                if (!missions || missions.length === 0) return null;

                return (
                  <div key={tier}>
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                      {TIER_LABELS[tier]}
                    </h3>
                    <div className="space-y-3">
                      {missions.map((mission) => (
                        <CouncilMissionCard
                          key={mission.id}
                          mission={mission}
                          canAfford={currentEssence >= mission.cost.essence}
                          hasEnoughHappiness={currentHappiness >= mission.cost.happiness}
                          totemStage={totemStage}
                          onStart={handleStartMission}
                          isLoading={loadingMissionId === mission.id}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CouncilMissionPanel;

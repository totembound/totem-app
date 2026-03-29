import React, { useState, useEffect } from 'react';
import { Lock, Plus, Clock, Swords } from 'lucide-react';
import { calculateSeatEssence, getTenureLabel, getTenureMultiplier } from '../../config/sanctum';
import { getRarityBorderColor } from '../../utils/totems';
import { IPFS_GATEWAY_URL } from '../../config/constants';
import type { SanctumSeatInfo, TotemData } from '../../types/types';

interface SanctumSeatProps {
  seatIndex: number;
  seatInfo: SanctumSeatInfo | null;
  totemData?: TotemData;
  isLocked: boolean;
  lockReason?: string;
  onSeat: () => void;
  onUnseat: (totemId: string) => void;
  onViewMissions?: (totemId: string) => void;
}

function formatTenure(days: number): string {
  if (days < 1) {
    const hours = Math.max(0, Math.floor(days * 24));
    return `${hours}h`;
  }
  return `${days.toFixed(1)}d`;
}

const SanctumSeat: React.FC<SanctumSeatProps> = ({
  seatIndex,
  seatInfo,
  totemData,
  isLocked,
  lockReason,
  onSeat,
  onUnseat,
  onViewMissions,
}) => {
  const [localEssence, setLocalEssence] = useState(seatInfo?.accumulatedEssence ?? 0);
  const [confirmUnseat, setConfirmUnseat] = useState(false);

  // Reset confirm state when seat changes
  useEffect(() => {
    setConfirmUnseat(false);
  }, [seatInfo]);

  useEffect(() => {
    if (!seatInfo) {
      setLocalEssence(0);
      return;
    }

    setLocalEssence(calculateSeatEssence(seatInfo.seatedAt, seatInfo.lastClaimedAt));

    const interval = setInterval(() => {
      setLocalEssence(calculateSeatEssence(seatInfo.seatedAt, seatInfo.lastClaimedAt));
    }, 60_000);

    return () => clearInterval(interval);
  }, [seatInfo]);

  // Locked seat
  if (isLocked) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 opacity-60">
        <div className="flex flex-col items-center justify-center min-h-[160px] gap-3 text-center">
          <Lock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Seat {seatIndex + 1} — Locked
          </p>
          {lockReason && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{lockReason}</p>
          )}
        </div>
      </div>
    );
  }

  // Empty (unlocked) seat
  if (!seatInfo) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-amber-300 dark:border-amber-600">
        <div className="flex flex-col items-center justify-center min-h-[160px] gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
            <Plus className="w-6 h-6 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Seat {seatIndex + 1} — Empty
          </p>
          <button
            onClick={onSeat}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg px-5 min-h-[48px]
              transition-colors duration-150 shadow-sm"
          >
            Seat an Elder
          </button>
        </div>
      </div>
    );
  }

  // Occupied seat
  const tenureHours = seatInfo.tenureDays * 24;
  const tenureLabel = getTenureLabel(tenureHours);
  const multiplier = getTenureMultiplier(tenureHours);
  const rarityColors = totemData ? getRarityBorderColor(totemData.attributes.rarity) : { border: 'border-gray-300' };
  const imageUrl = totemData?.image?.replace('ipfs://', IPFS_GATEWAY_URL) || '/images/placeholder.png';

  return (
    <div className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700 shadow-sm">
      {/* Totem Mini Card */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`relative w-14 h-14 overflow-hidden rounded-lg border-2 ${rarityColors.border} shrink-0`}>
          <img
            src={imageUrl}
            alt={seatInfo.totemName}
            className="w-full h-full object-cover"
            width={56}
            height={56}
            loading="eager"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {totemData?.attributes.nickname || totemData?.displayName || seatInfo.totemName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Stage {(totemData?.attributes.stage ?? 0) + 1} · {seatInfo.species}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
          {multiplier}x
        </span>
      </div>

      {/* Tenure */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Tenure:</span>
        <span className="text-gray-600 dark:text-gray-300">
          {formatTenure(seatInfo.tenureDays)}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">
          {tenureLabel}
        </span>
      </div>

      {/* Mission status */}
      {seatInfo.onMission && seatInfo.activeMission && (
        <MissionStatusInline
          missionName={seatInfo.activeMission.name}
          endsAt={seatInfo.activeMission.endsAt}
          canClaim={seatInfo.activeMission.canClaim}
          onTap={onViewMissions ? () => onViewMissions(seatInfo.totemId) : undefined}
        />
      )}

      {/* Accumulated Essence */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-md px-3 py-2 mb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Accumulated</p>
        <p className="text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums">
          {localEssence.toLocaleString()} <span className="text-sm font-normal">Essence</span>
        </p>
        {seatInfo.atCap && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">Cap reached — claim to continue</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {onViewMissions && (
            <button
              onClick={() => onViewMissions(seatInfo.totemId)}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white
                font-semibold rounded-lg min-h-[48px] transition-colors duration-150 text-sm"
            >
              Missions
            </button>
          )}
          {!confirmUnseat ? (
            <button
              onClick={() => setConfirmUnseat(true)}
              disabled={seatInfo.onMission}
              className={`${onViewMissions ? 'flex-1' : 'w-full'} border-2 border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20
                disabled:opacity-50 disabled:cursor-not-allowed text-amber-700 dark:text-amber-300
                font-semibold rounded-lg min-h-[48px] transition-colors duration-150 text-sm`}
            >
              {seatInfo.onMission ? 'On Mission' : 'Unseat'}
            </button>
          ) : (
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => { onUnseat(seatInfo.totemId); setConfirmUnseat(false); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white
                  font-semibold rounded-lg min-h-[48px] transition-colors duration-150 text-sm"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmUnseat(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                  text-gray-700 dark:text-gray-300 font-semibold rounded-lg min-h-[48px] transition-colors duration-150 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {confirmUnseat && (
          <p className="text-xs text-red-500 dark:text-red-400 text-center font-medium">
            Tenure will be reset to zero
          </p>
        )}
      </div>
    </div>
  );
};

/** Inline mission status with live countdown */
const MissionStatusInline: React.FC<{
  missionName: string;
  endsAt: string;
  canClaim: boolean;
  onTap?: () => void;
}> = ({ missionName, endsAt, canClaim, onTap }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const remaining = new Date(endsAt).getTime() - Date.now();
      if (remaining <= 0) {
        setTimeLeft('Ready!');
        return;
      }
      const totalSec = Math.floor(remaining / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const isReady = canClaim || timeLeft === 'Ready!';

  return (
    <button
      onClick={onTap}
      disabled={!onTap}
      className="w-full flex items-center gap-2 mb-3 px-2 py-1.5 rounded bg-indigo-50 dark:bg-indigo-950/30
        border border-indigo-200 dark:border-indigo-800 text-sm text-left
        hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:cursor-default"
    >
      <Swords className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
      <span className="text-indigo-700 dark:text-indigo-300 truncate flex-1">
        {missionName}
      </span>
      <span className={`shrink-0 text-xs font-bold tabular-nums ${
        isReady ? 'text-green-600 dark:text-green-400' : 'text-indigo-500 dark:text-indigo-400'
      }`}>
        {timeLeft}
      </span>
    </button>
  );
};

export default SanctumSeat;

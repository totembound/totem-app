import React from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import type { SanctumSeatInfo } from '../../types/types';

interface SanctumClaimBannerProps {
  totalAccumulated: number;
  seats: SanctumSeatInfo[];
  onClaim: () => void;
  isLoading: boolean;
}

const SanctumClaimBanner: React.FC<SanctumClaimBannerProps> = ({
  totalAccumulated,
  seats,
  onClaim,
  isLoading,
}) => {
  const anyAtCap = seats.some((s) => s.atCap);
  const hasClaimable = totalAccumulated >= 1;

  if (seats.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
      {anyAtCap && (
        <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-400 text-sm font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Sanctum Full — Claim to Resume Earning</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Claimable</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
              {totalAccumulated.toLocaleString()} <span className="text-base font-normal">Essence</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClaim}
          disabled={!hasClaimable || isLoading}
          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 dark:disabled:bg-gray-700
            disabled:cursor-not-allowed text-white font-bold rounded-lg px-6 min-h-[48px]
            transition-colors duration-150 shadow-sm"
        >
          {isLoading ? 'Claiming...' : `Claim ${totalAccumulated.toLocaleString()} Essence`}
        </button>
      </div>
    </div>
  );
};

export default SanctumClaimBanner;

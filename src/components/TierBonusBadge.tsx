import React from 'react';
import { Crown } from 'lucide-react';
import { getTierMultiplier, getTierChipColorClass } from '../config/tier-bonuses';

interface TierBonusBadgeProps {
    tier?: string | null;
    label?: string;
}

/**
 * Subscription tier bonus chip — renders nothing for free tier. Uses the
 * multiplier format (2x / 3x) to match the Plans comparison table.
 *
 *   premium → "2x Tier" (purple, Crown icon)
 *   vip     → "3x Tier" (gold, Crown icon)
 */
const TierBonusBadge: React.FC<TierBonusBadgeProps> = ({ tier, label = 'Tier' }) => {
    const multiplier = getTierMultiplier(tier);
    const colorClass = getTierChipColorClass(tier);

    if (multiplier <= 1 || !colorClass) return null;

    return (
        <div className={`flex items-center gap-1 text-sm font-semibold ${colorClass}`}>
            <Crown className="w-3.5 h-3.5" />
            {multiplier}x{label ? ` ${label}` : ''}
        </div>
    );
};

export default TierBonusBadge;

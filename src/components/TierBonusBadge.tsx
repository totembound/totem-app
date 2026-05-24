import React from 'react';
import { Crown } from 'lucide-react';
import { getTierBonusPercent, getTierChipColorClass } from '../config/tier-bonuses';

interface TierBonusBadgeProps {
    tier?: string | null;
    label?: string;
}

/**
 * Subscription tier bonus chip — renders nothing for free tier.
 *
 *   premium → "+100% Tier" (purple, Crown icon)
 *   vip     → "+200% Tier" (gold, Crown icon)
 */
const TierBonusBadge: React.FC<TierBonusBadgeProps> = ({ tier, label = 'Tier' }) => {
    const bonusPercent = getTierBonusPercent(tier);
    const colorClass = getTierChipColorClass(tier);

    if (bonusPercent <= 0 || !colorClass) return null;

    return (
        <div className={`flex items-center gap-1 text-sm font-semibold ${colorClass}`}>
            <Crown className="w-3.5 h-3.5" />
            +{bonusPercent}% {label}
        </div>
    );
};

export default TierBonusBadge;

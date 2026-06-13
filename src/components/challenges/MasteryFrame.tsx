import React from 'react';

/**
 * MasteryFrame — wraps a challenge card with a tier-escalating ring.
 *
 *   Novice (0)   = no frame (card keeps its plain border)
 *   Bronze (1)   = thin 1px solid bronze ring
 *   Silver (2)   = thin 1px solid silver ring
 *   Gold   (3)   = 2px gold GRADIENT ring + soft glow
 *   Platinum (4) = 2px brighter gradient ring + stronger glow
 *   Diamond  (5) = 2px iridescent gradient ring + strongest glow + slow sheen sweep
 *
 * The escalation is intentional: low tiers stay understated (a quiet colored
 * hairline) while the higher tiers upgrade in *kind* — flat border → gradient
 * ring → gradient + glow → gradient + glow + animated sheen — so a Diamond
 * reads as clearly more prestigious than a Gold, not just a different color.
 * The sheen is gated by prefers-reduced-motion. Mobile-first + dark mode.
 *
 * Implemented as a padding "ring": the outer element's background (solid or
 * gradient) shows through the padding gap around the inner card.
 *
 * Renders from account/challenge-level mastery, independent of any selected totem.
 */

interface MasteryFrameProps {
    tier: number;
    /** Transient — true right after this challenge's tier increased; plays a one-shot glow. */
    justTieredUp?: boolean;
    children: React.ReactNode;
}

interface TierFrameStyle {
    /** Ring thickness (padding). 1px for low tiers, 2px for the gradient tiers. */
    pad: string;
    /** Ring fill — a solid tint (low tiers) or a gradient (Gold+). */
    ring: string;
    /** Outer glow, escalating with tier. */
    glow: string;
    /** Diamond-only animated sheen sweep across the card face. */
    sheen?: boolean;
}

const TIER_FRAME: Record<number, TierFrameStyle> = {
    1: { pad: 'p-px',  ring: 'bg-amber-600/60', glow: '' },                                                 // Bronze
    2: { pad: 'p-px',  ring: 'bg-gray-400/60',  glow: '' },                                                 // Silver
    3: { pad: 'p-0.5', ring: 'bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600',               // Gold
         glow: 'shadow-[0_0_10px_-3px_rgba(234,179,8,0.55)]' },
    4: { pad: 'p-0.5', ring: 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-300',                 // Platinum
         glow: 'shadow-[0_0_14px_-3px_rgba(148,163,184,0.65)]' },
    5: { pad: 'p-0.5', ring: 'bg-gradient-to-br from-cyan-200 via-sky-400 to-indigo-400',                   // Diamond
         glow: 'shadow-[0_0_18px_-3px_rgba(56,189,248,0.7)]', sheen: true },
};

const MasteryFrame: React.FC<MasteryFrameProps> = ({ tier, justTieredUp = false, children }) => {
    // Novice: no frame at all — render children as-is so the card keeps its plain border.
    if (!tier || tier < 1) {
        return <>{children}</>;
    }

    const style = TIER_FRAME[tier] ?? TIER_FRAME[5];

    return (
        <div
            className={`relative rounded-xl h-full ${style.pad} ${style.ring} ${style.glow}
                ${justTieredUp ? 'mastery-tier-up-glow' : ''}`}
            data-mastery-tier={tier}
        >
            <div className="relative h-full rounded-[0.65rem] overflow-hidden">
                {children}
                {style.sheen && (
                    <span className="mastery-sheen pointer-events-none absolute inset-0" aria-hidden="true" />
                )}
            </div>
        </div>
    );
};

export default MasteryFrame;

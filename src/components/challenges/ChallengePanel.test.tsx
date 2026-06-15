import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const mockGameContext = vi.hoisted(() => ({
    getEligibleTotems: vi.fn().mockReturnValue([{ id: 'ttm_001' }]),
}));

vi.mock('../../contexts/GameContext', () => ({
    useGame: () => mockGameContext,
}));

vi.mock('../../config/constants', () => ({
    DEFAULT_MAX_DAILY_ATTEMPTS: 5,
    CURRENCY_NAMES: { SOFT: 'Essence' },
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import ChallengePanel, { ChallengeMastery } from './ChallengePanel';

const baseMastery: ChallengeMastery = {
    tier: 2,
    tierName: 'Silver',
    completions: 40,
    nextTierAt: 75,
    completionsToNext: 35,
    xpMultiplier: 1.5,
    difficultyUnlocked: false,
    maxDifficulty: 3,
    preferredDifficulty: null,
};

const defaultProps = {
    id: 'chl_totem-wrestling',
    title: 'Totem Wrestling',
    description: 'Wrestle a totem.',
    image: '/challenges/wrestling.png',
    affinityType: 'strength' as const,
    highScore: 1200,
    attemptsLeft: 3,
    maxAttempts: 5,
    maxScore: 2000,
    requirements: { stage: 1, strength: 10, agility: 0, wisdom: 0 },
    onStart: vi.fn(),
};

describe('ChallengePanel mastery progress', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGameContext.getEligibleTotems.mockReturnValue([{ id: 'ttm_001' }]);
    });

    it('renders a completions progress bar toward the next tier with an accessible completions label', () => {
        render(<ChallengePanel {...defaultProps} mastery={baseMastery} />);

        const bar = screen.getByRole('progressbar');
        // Intra-tier: Silver band is 30→75, so 40 completions = 10 of 45 in this tier
        expect(bar).toHaveAttribute('aria-valuenow', '10');
        expect(bar).toHaveAttribute('aria-valuemax', '45');
        // Explicitly framed as a COMPLETIONS tally, not XP
        expect(bar.getAttribute('aria-label')).toContain('completions');
        expect(bar.getAttribute('aria-label')).toContain('Gold');
        // Visible "N to <Tier>" label
        expect(screen.getByText('35 to Gold')).toBeInTheDocument();
    });

    it('fills the bar proportionally to progress within the current tier band', () => {
        render(<ChallengePanel {...defaultProps} mastery={baseMastery} />);
        const fill = screen.getByRole('progressbar').firstElementChild as HTMLElement;
        // (40 − 30) / (75 − 30) ≈ 22.2% — starts empty right after a tier-up
        expect(fill.style.width).toMatch(/^22\.2/);
    });

    it('does not nudge when more than 5 completions remain', () => {
        render(<ChallengePanel {...defaultProps} mastery={baseMastery} />);
        const label = screen.getByText('35 to Gold');
        expect(label.className).not.toContain('animate-pulse');
    });

    it('nudges (pulse + emphasis + "!") when 5 or fewer completions remain', () => {
        render(
            <ChallengePanel
                {...defaultProps}
                mastery={{ ...baseMastery, completions: 73, completionsToNext: 2 }}
            />
        );
        const label = screen.getByText('2 to Gold!');
        expect(label.className).toContain('animate-pulse');
        // Static highlight fallback for prefers-reduced-motion
        expect(label.className).toContain('motion-reduce:animate-none');
        expect(label.className).toContain('text-amber-600');
    });

    it('does not nudge at exactly 0 to next (boundary safety)', () => {
        render(
            <ChallengePanel
                {...defaultProps}
                mastery={{ ...baseMastery, completions: 75, completionsToNext: 0 }}
            />
        );
        expect(screen.getByText('0 to Gold').className).not.toContain('animate-pulse');
    });

    it('shows a maxed state instead of a bar at Diamond (no next tier)', () => {
        render(
            <ChallengePanel
                {...defaultProps}
                mastery={{
                    ...baseMastery,
                    tier: 5,
                    tierName: 'Diamond',
                    completions: 320,
                    nextTierAt: null,
                    completionsToNext: null,
                    xpMultiplier: 3.0,
                    difficultyUnlocked: true,
                }}
            />
        );
        expect(screen.queryByRole('progressbar')).toBeNull();
        expect(screen.getByText(/Max mastery — 320 completions/)).toBeInTheDocument();
    });

    it('renders no progress UI when mastery data is absent', () => {
        render(<ChallengePanel {...defaultProps} />);
        expect(screen.queryByRole('progressbar')).toBeNull();
        expect(screen.queryByText(/to Gold/)).toBeNull();
        expect(screen.queryByText(/Max mastery/)).toBeNull();
    });
});

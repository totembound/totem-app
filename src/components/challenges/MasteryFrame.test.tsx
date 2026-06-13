import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MasteryFrame from './MasteryFrame';

describe('MasteryFrame', () => {
    it('renders children without a frame wrapper at Novice (tier 0)', () => {
        render(
            <MasteryFrame tier={0}>
                <div>card-content</div>
            </MasteryFrame>
        );
        expect(screen.getByText('card-content')).toBeInTheDocument();
        // No tier wrapper for Novice
        expect(document.querySelector('[data-mastery-tier]')).toBeNull();
    });

    it('wraps the card in a thin solid tier ring at Bronze (no gradient, no glow)', () => {
        render(
            <MasteryFrame tier={1}>
                <div>card-content</div>
            </MasteryFrame>
        );
        const frame = document.querySelector('[data-mastery-tier="1"]');
        expect(frame).not.toBeNull();
        expect(frame?.className).toContain('bg-amber');     // solid bronze ring
        expect(frame?.className).not.toContain('bg-gradient');
        expect(document.querySelector('.mastery-sheen')).toBeNull();
        expect(screen.getByText('card-content')).toBeInTheDocument();
    });

    it('escalates to a gradient ring + glow at Gold, with no sheen', () => {
        render(
            <MasteryFrame tier={3}>
                <div>card</div>
            </MasteryFrame>
        );
        const frame = document.querySelector('[data-mastery-tier="3"]');
        expect(frame?.className).toContain('bg-gradient');   // gradient ring
        expect(frame?.className).toContain('shadow');         // glow
        expect(document.querySelector('.mastery-sheen')).toBeNull();
    });

    it('plays the one-shot tier-up glow when justTieredUp is set', () => {
        render(
            <MasteryFrame tier={3} justTieredUp>
                <div>card</div>
            </MasteryFrame>
        );
        const frame = document.querySelector('[data-mastery-tier="3"]');
        expect(frame?.className).toContain('mastery-tier-up-glow');
    });

    it('does not apply the tier-up glow by default', () => {
        render(
            <MasteryFrame tier={3}>
                <div>card</div>
            </MasteryFrame>
        );
        const frame = document.querySelector('[data-mastery-tier="3"]');
        expect(frame?.className).not.toContain('mastery-tier-up-glow');
    });

    it('adds the animated sheen only at Diamond (tier 5)', () => {
        render(
            <MasteryFrame tier={5}>
                <div>card</div>
            </MasteryFrame>
        );
        expect(document.querySelector('[data-mastery-tier="5"]')).not.toBeNull();
        expect(document.querySelector('.mastery-sheen')).not.toBeNull();
    });
});

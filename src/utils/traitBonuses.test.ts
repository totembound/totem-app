import { describe, it, expect } from 'vitest';
import {
    EMPTY_BONUSES,
    effectiveEssenceCost,
    resolveTraitBonusesForTotem,
} from './traitBonuses';

const traits = (overrides: Partial<{ innate: string; learned: string; awakened: string }> = {}) => ({
    innate: null,
    learned: null,
    awakened: null,
    ...overrides,
});

describe('resolveTraitBonusesForTotem', () => {
    it('returns identity bonuses when no traits or no context match', () => {
        expect(resolveTraitBonusesForTotem(null, { action: 'train' })).toEqual(EMPTY_BONUSES);
        expect(resolveTraitBonusesForTotem(traits(), { action: 'train' })).toEqual(EMPTY_BONUSES);
    });

    it('Thrifty (−10% cost) folds into feed/train/treat only', () => {
        const t = traits({ learned: 'trt_thrifty' });
        expect(resolveTraitBonusesForTotem(t, { action: 'feed' }).essenceCostMultiplier).toBeCloseTo(0.9);
        expect(resolveTraitBonusesForTotem(t, { action: 'train' }).essenceCostMultiplier).toBeCloseTo(0.9);
        expect(resolveTraitBonusesForTotem(t, { action: 'treat' }).essenceCostMultiplier).toBeCloseTo(0.9);
        expect(resolveTraitBonusesForTotem(t, { system: 'expedition' }).essenceCostMultiplier).toBe(1);
    });

    it('Quick Learner (+10% XP) folds only on train', () => {
        const t = traits({ learned: 'trt_quick_learner' });
        expect(resolveTraitBonusesForTotem(t, { action: 'train' }).xpMultiplier).toBeCloseTo(1.1);
        expect(resolveTraitBonusesForTotem(t, { action: 'feed' }).xpMultiplier).toBe(1);
    });

    it('Mentor aura folds on any solo context (aura token matches everything)', () => {
        const t = traits({ awakened: 'trt_mentor' });
        expect(resolveTraitBonusesForTotem(t, { action: 'train' }).xpMultiplier).toBeCloseTo(1.1);
        expect(resolveTraitBonusesForTotem(t, { action: 'feed' }).xpMultiplier).toBeCloseTo(1.1);
    });

    it('Kindred Soul is skipped (conditional, no team available)', () => {
        const t = traits({ awakened: 'trt_kindred_soul' });
        expect(resolveTraitBonusesForTotem(t, { system: 'expedition' }).xpMultiplier).toBe(1);
    });

    it('happinessFlat from Gentle folds into train', () => {
        const t = traits({ innate: 'trt_gentle' });
        expect(resolveTraitBonusesForTotem(t, { action: 'train' }).happinessFlat).toBe(2);
        expect(resolveTraitBonusesForTotem(t, { action: 'feed' }).happinessFlat).toBe(0);
    });

    it('stacking: Quick Learner + Mentor multiply XP', () => {
        const t = traits({ learned: 'trt_quick_learner', awakened: 'trt_mentor' });
        expect(resolveTraitBonusesForTotem(t, { action: 'train' }).xpMultiplier).toBeCloseTo(1.21);
    });
});

describe('effectiveEssenceCost', () => {
    it('returns baseline for a totem with no Thrifty', () => {
        expect(effectiveEssenceCost(20, traits(), 'train')).toBe(20);
    });

    it('returns 18 for a Thrifty totem on train (20 × 0.9)', () => {
        expect(effectiveEssenceCost(20, traits({ learned: 'trt_thrifty' }), 'train')).toBe(18);
    });

    it('returns 9 for a Thrifty totem on feed (10 × 0.9)', () => {
        expect(effectiveEssenceCost(10, traits({ learned: 'trt_thrifty' }), 'feed')).toBe(9);
    });
});

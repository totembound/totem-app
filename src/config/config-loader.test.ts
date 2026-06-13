import { describe, it, expect } from 'vitest';
import {
    getMasteryConfig,
    tierForCompletions,
    getMasteryTier,
    getMasteryTierByIndex,
} from './config-loader';

describe('config-loader mastery helpers', () => {
    describe('tierForCompletions', () => {
        // Boundaries from the static config: [0, 10, 30, 75, 150, 300]
        it('returns Novice (0) below the Bronze threshold', () => {
            expect(tierForCompletions(0)).toBe(0);
            expect(tierForCompletions(9)).toBe(0);
        });
        it('returns Bronze (1) at 10', () => {
            expect(tierForCompletions(10)).toBe(1);
            expect(tierForCompletions(29)).toBe(1);
        });
        it('returns Silver (2) at 30', () => {
            expect(tierForCompletions(30)).toBe(2);
            expect(tierForCompletions(74)).toBe(2);
        });
        it('returns Gold (3) at 75', () => {
            expect(tierForCompletions(75)).toBe(3);
            expect(tierForCompletions(149)).toBe(3);
        });
        it('returns Platinum (4) at 150', () => {
            expect(tierForCompletions(150)).toBe(4);
            expect(tierForCompletions(299)).toBe(4);
        });
        it('returns Diamond (5) at 300 and beyond', () => {
            expect(tierForCompletions(300)).toBe(5);
            expect(tierForCompletions(5000)).toBe(5);
        });
    });

    describe('getMasteryTier', () => {
        it('returns the full tier object with name and xpMult', () => {
            const gold = getMasteryTier(80);
            expect(gold.tier).toBe(3);
            expect(gold.name).toBe('Gold');
            expect(gold.xpMult).toBe(2.0);
        });
        it('returns Novice for zero completions', () => {
            const novice = getMasteryTier(0);
            expect(novice.name).toBe('Novice');
            expect(novice.xpMult).toBe(1.0);
        });
    });

    describe('getMasteryTierByIndex', () => {
        it('returns the tier at an index', () => {
            expect(getMasteryTierByIndex(5)?.name).toBe('Diamond');
        });
        it('returns undefined past the top tier', () => {
            expect(getMasteryTierByIndex(6)).toBeUndefined();
        });
    });

    describe('getMasteryConfig', () => {
        it('exposes the tuning levers', () => {
            const cfg = getMasteryConfig();
            expect(cfg.raiseTier).toBe(3);
            expect(cfg.maxDifficulty).toBe(3);
            expect(cfg.tiers).toHaveLength(6);
            // Rebalanced curve: Bronze pays XP only; boxes start at Silver, cap at large
            expect(cfg.tierUpBonus['1'].lootBoxId).toBeNull();
            expect(cfg.tierUpBonus['3'].lootBoxId).toBe('essence_box_small');
            expect(cfg.tierUpBonus['5'].lootBoxId).toBe('essence_box_large');
        });
    });
});

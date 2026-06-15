import { describe, it, expect } from 'vitest';
import { computePrestigeLevel } from './prestige';

// BASE_ELDER_XP = 7500, PRESTIGE_XP_REQUIREMENT = 2500, MAX_STAGE = 4.
describe('computePrestigeLevel', () => {
    it('returns 0 for non-Ascended totems regardless of XP', () => {
        expect(computePrestigeLevel(20000, 0)).toBe(0);
        expect(computePrestigeLevel(20000, 3)).toBe(0);
    });

    it('returns 0 at or below the Elder threshold', () => {
        expect(computePrestigeLevel(7500, 4)).toBe(0);
        expect(computePrestigeLevel(7000, 4)).toBe(0);
    });

    it('returns 0 while inside the first prestige level (not yet earned)', () => {
        expect(computePrestigeLevel(8000, 4)).toBe(0);   // +500 XP
        expect(computePrestigeLevel(9999, 4)).toBe(0);   // +2499 XP
    });

    it('increments one level per PRESTIGE_XP_REQUIREMENT past Elder', () => {
        expect(computePrestigeLevel(10000, 4)).toBe(1);  // +2500
        expect(computePrestigeLevel(12500, 4)).toBe(2);  // +5000
        expect(computePrestigeLevel(15000, 4)).toBe(3);  // +7500  → the P3 case
        expect(computePrestigeLevel(17499, 4)).toBe(3);  // still P3 just under P4
    });
});

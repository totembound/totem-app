/**
 * Tests for totem utility functions (pure logic, no JSX rendering)
 */
import { describe, it, expect } from 'vitest';
import { Species, Rarity, Domain, Affinity, TotemData } from '../types/types';
import {
  getRarityBonusStat,
  getSpeciesBaseStats,
  getSpeciesEmoji,
  getDomainColor,
  getAffinityColor,
  getRarityFontColor,
  getRarityBadgeColor,
  getRarityBorderColor,
  getRarityColor,
  getTotemStage,
  getCurrentMonth,
  getGameDifficulty,
  getSpeciesInfo,
} from './totems';

// =============================================================================
// getRarityBonusStat
// =============================================================================

describe('getRarityBonusStat', () => {
  it('should return 0 for Common', () => {
    expect(getRarityBonusStat(Rarity.Common)).toBe(0);
  });

  it('should return 1 for Uncommon', () => {
    expect(getRarityBonusStat(Rarity.Uncommon)).toBe(1);
  });

  it('should return 2 for Rare', () => {
    expect(getRarityBonusStat(Rarity.Rare)).toBe(2);
  });

  it('should return 3 for Epic', () => {
    expect(getRarityBonusStat(Rarity.Epic)).toBe(3);
  });

  it('should return 4 for Limited', () => {
    expect(getRarityBonusStat(Rarity.Limited)).toBe(4);
  });

  it('should return 6 for Legendary', () => {
    expect(getRarityBonusStat(Rarity.Legendary)).toBe(6);
  });
});

// =============================================================================
// getSpeciesBaseStats
// =============================================================================

describe('getSpeciesBaseStats', () => {
  it('should return Bear stats with strength primary', () => {
    const stats = getSpeciesBaseStats(Species.Bear, Rarity.Common);
    expect(stats.strength).toBe(12);
    expect(stats.wisdom).toBe(7);
    expect(stats.agility).toBe(5);
    expect(stats.primaryStat).toBe('strength');
  });

  it('should return Owl stats with wisdom primary', () => {
    const stats = getSpeciesBaseStats(Species.Owl, Rarity.Common);
    expect(stats.wisdom).toBe(12);
    expect(stats.agility).toBe(7);
    expect(stats.strength).toBe(5);
    expect(stats.primaryStat).toBe('wisdom');
  });

  it('should return Falcon stats with agility primary', () => {
    const stats = getSpeciesBaseStats(Species.Falcon, Rarity.Common);
    expect(stats.agility).toBe(12);
    expect(stats.wisdom).toBe(7);
    expect(stats.strength).toBe(5);
    expect(stats.primaryStat).toBe('agility');
  });

  it('should add rarity bonus to all stats', () => {
    const commonStats = getSpeciesBaseStats(Species.Bear, Rarity.Common);
    const rareStats = getSpeciesBaseStats(Species.Bear, Rarity.Rare);
    expect(rareStats.strength).toBe(commonStats.strength + 2);
    expect(rareStats.wisdom).toBe(commonStats.wisdom + 2);
    expect(rareStats.agility).toBe(commonStats.agility + 2);
  });

  it('should apply legendary bonus (+6)', () => {
    const stats = getSpeciesBaseStats(Species.Wolf, Rarity.Legendary);
    expect(stats.strength).toBe(11 + 6);
    expect(stats.agility).toBe(8 + 6);
    expect(stats.wisdom).toBe(5 + 6);
  });

  it('should return None species with zero base stats', () => {
    const stats = getSpeciesBaseStats(Species.None, Rarity.Common);
    expect(stats.strength).toBe(0);
    expect(stats.agility).toBe(0);
    expect(stats.wisdom).toBe(0);
  });

  it('should fallback to None for unknown species', () => {
    const stats = getSpeciesBaseStats(999 as Species, Rarity.Common);
    expect(stats.strength).toBe(0);
    expect(stats.agility).toBe(0);
    expect(stats.wisdom).toBe(0);
  });
});

// =============================================================================
// getSpeciesEmoji
// =============================================================================

describe('getSpeciesEmoji', () => {
  it('should return correct emoji for each species', () => {
    expect(getSpeciesEmoji(Species.Bear)).toBe('🐻');
    expect(getSpeciesEmoji(Species.Wolf)).toBe('🐺');
    expect(getSpeciesEmoji(Species.Owl)).toBe('🦉');
    expect(getSpeciesEmoji(Species.Deer)).toBe('🦌');
    expect(getSpeciesEmoji(Species.Otter)).toBe('🦦');
    expect(getSpeciesEmoji(Species.Beaver)).toBe('🦫');
    expect(getSpeciesEmoji(Species.Turtle)).toBe('🐢');
    expect(getSpeciesEmoji(Species.Snake)).toBe('🐍');
    expect(getSpeciesEmoji(Species.Goose)).toBe('🦢');
    expect(getSpeciesEmoji(Species.Woodpecker)).toBe('🐦');
  });

  it('should return ❓ for None species', () => {
    expect(getSpeciesEmoji(Species.None)).toBe('❓');
  });

  it('should return ❓ for unknown species', () => {
    expect(getSpeciesEmoji(999 as Species)).toBe('❓');
  });
});

// =============================================================================
// getDomainColor
// =============================================================================

describe('getDomainColor', () => {
  it('should return sky classes for Air', () => {
    expect(getDomainColor(Domain.Air)).toContain('sky');
  });

  it('should return emerald classes for Earth', () => {
    expect(getDomainColor(Domain.Earth)).toContain('emerald');
  });

  it('should return cyan classes for Water', () => {
    expect(getDomainColor(Domain.Water)).toContain('cyan');
  });

  it('should return red classes for Fire', () => {
    expect(getDomainColor(Domain.Fire)).toContain('red');
  });

  it('should return amber classes for Spirit', () => {
    expect(getDomainColor(Domain.Spirit)).toContain('amber');
  });

  it('should return purple classes for Shadow', () => {
    expect(getDomainColor(Domain.Shadow)).toContain('purple');
  });

  it('should return gray classes for unknown domain', () => {
    expect(getDomainColor(99 as Domain)).toContain('gray');
  });
});

// =============================================================================
// getAffinityColor
// =============================================================================

describe('getAffinityColor', () => {
  it('should return red classes for Strength', () => {
    expect(getAffinityColor(Affinity.Strength)).toContain('red');
  });

  it('should return blue classes for Agility', () => {
    expect(getAffinityColor(Affinity.Agility)).toContain('blue');
  });

  it('should return purple classes for Wisdom', () => {
    expect(getAffinityColor(Affinity.Wisdom)).toContain('purple');
  });

  it('should return gray for unknown affinity', () => {
    expect(getAffinityColor(99 as Affinity)).toContain('gray');
  });
});

// =============================================================================
// getRarityFontColor
// =============================================================================

describe('getRarityFontColor', () => {
  it('should return gray for Common', () => {
    expect(getRarityFontColor(Rarity.Common)).toContain('gray');
  });

  it('should return green for Uncommon', () => {
    expect(getRarityFontColor(Rarity.Uncommon)).toContain('green');
  });

  it('should return blue for Rare', () => {
    expect(getRarityFontColor(Rarity.Rare)).toContain('blue');
  });

  it('should return purple for Epic', () => {
    expect(getRarityFontColor(Rarity.Epic)).toContain('purple');
  });

  it('should return orange for Legendary', () => {
    expect(getRarityFontColor(Rarity.Legendary)).toContain('orange');
  });

  it('should return yellow for Limited', () => {
    expect(getRarityFontColor(Rarity.Limited)).toContain('yellow');
  });

  it('should return gray for unknown rarity', () => {
    expect(getRarityFontColor(99 as Rarity)).toContain('gray');
  });
});

// =============================================================================
// getRarityBadgeColor
// =============================================================================

describe('getRarityBadgeColor', () => {
  it('should return classes with bg- for each rarity', () => {
    expect(getRarityBadgeColor(Rarity.Common)).toContain('bg-gray');
    expect(getRarityBadgeColor(Rarity.Uncommon)).toContain('bg-green');
    expect(getRarityBadgeColor(Rarity.Rare)).toContain('bg-blue');
    expect(getRarityBadgeColor(Rarity.Epic)).toContain('bg-purple');
    expect(getRarityBadgeColor(Rarity.Legendary)).toContain('bg-orange');
    expect(getRarityBadgeColor(Rarity.Limited)).toContain('bg-yellow');
  });

  it('should include border classes', () => {
    const result = getRarityBadgeColor(Rarity.Rare);
    expect(result).toContain('border-blue');
  });

  it('should return gray for unknown rarity', () => {
    expect(getRarityBadgeColor(99 as Rarity)).toContain('gray');
  });
});

// =============================================================================
// getRarityBorderColor
// =============================================================================

describe('getRarityBorderColor', () => {
  it('should return border and ring properties for Common', () => {
    const result = getRarityBorderColor(Rarity.Common);
    expect(result.border).toContain('border-gray');
    expect(result.ring).toContain('ring-gray');
  });

  it('should return green for Uncommon', () => {
    const result = getRarityBorderColor(Rarity.Uncommon);
    expect(result.border).toContain('border-green');
    expect(result.ring).toContain('ring-green');
  });

  it('should return orange for Legendary', () => {
    const result = getRarityBorderColor(Rarity.Legendary);
    expect(result.border).toContain('border-orange');
    expect(result.ring).toContain('ring-orange');
  });

  it('should fallback to Common for unknown rarity', () => {
    const result = getRarityBorderColor(99 as Rarity);
    expect(result.border).toContain('border-gray');
  });
});

// =============================================================================
// getRarityColor
// =============================================================================

describe('getRarityColor', () => {
  it('should return gradient classes for each rarity', () => {
    expect(getRarityColor(Rarity.Common)).toContain('from-gray');
    expect(getRarityColor(Rarity.Uncommon)).toContain('from-green');
    expect(getRarityColor(Rarity.Rare)).toContain('from-blue');
    expect(getRarityColor(Rarity.Epic)).toContain('from-purple');
    expect(getRarityColor(Rarity.Legendary)).toContain('from-yellow');
    expect(getRarityColor(Rarity.Limited)).toContain('from-yellow');
  });

  it('should return gray for unknown rarity', () => {
    expect(getRarityColor(99 as Rarity)).toContain('from-gray');
  });
});

// =============================================================================
// getTotemStage
// =============================================================================

describe('getTotemStage', () => {
  it('should return stage + 1', () => {
    const totem = { attributes: { stage: 0 } } as TotemData;
    expect(getTotemStage(totem)).toBe(1);
  });

  it('should handle higher stages', () => {
    const totem = { attributes: { stage: 3 } } as TotemData;
    expect(getTotemStage(totem)).toBe(4);
  });

  it('should return 0 for null totem', () => {
    expect(getTotemStage(null as any)).toBe(0);
  });

  it('should return 0 for undefined totem', () => {
    expect(getTotemStage(undefined as any)).toBe(0);
  });
});

// =============================================================================
// getCurrentMonth
// =============================================================================

describe('getCurrentMonth', () => {
  it('should return a valid month name', () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    expect(months).toContain(getCurrentMonth());
  });
});

// =============================================================================
// getGameDifficulty
// =============================================================================

describe('getGameDifficulty', () => {
  const makeTotem = (stage: number, prestigeLevel = 0) =>
    ({ attributes: { stage: stage - 1, prestigeLevel } } as TotemData);

  it('should return 0 for null totem', () => {
    expect(getGameDifficulty(null as any, 2)).toBe(0);
  });

  it('should return 1 when totem stage is at or below reqStage', () => {
    expect(getGameDifficulty(makeTotem(1), 1)).toBe(1);
    expect(getGameDifficulty(makeTotem(1), 5)).toBe(1);
  });

  describe('reqStage 0', () => {
    it('should return 1 for stage 1 (minimum eligible)', () => {
      expect(getGameDifficulty(makeTotem(1), 0)).toBe(1);
    });

    it('should return 2 for stage 2', () => {
      expect(getGameDifficulty(makeTotem(2), 0)).toBe(2);
    });

    it('should return 3 for stage >= 3', () => {
      expect(getGameDifficulty(makeTotem(3), 0)).toBe(3);
      expect(getGameDifficulty(makeTotem(5), 0)).toBe(3);
    });
  });

  describe('reqStage 1', () => {
    it('should return 1 for stage 2 (minimum eligible)', () => {
      expect(getGameDifficulty(makeTotem(2), 1)).toBe(1);
    });

    it('should return 2 for stage 3', () => {
      expect(getGameDifficulty(makeTotem(3), 1)).toBe(2);
    });

    it('should return 3 for stage >= 4', () => {
      expect(getGameDifficulty(makeTotem(4), 1)).toBe(3);
      expect(getGameDifficulty(makeTotem(5), 1)).toBe(3);
    });
  });

  describe('reqStage 2', () => {
    it('should return 1 for stage 3 (minimum eligible)', () => {
      expect(getGameDifficulty(makeTotem(3), 2)).toBe(1);
    });

    it('should return 2 for stage 4', () => {
      expect(getGameDifficulty(makeTotem(4), 2)).toBe(2);
    });

    it('should return 3 for stage 5', () => {
      expect(getGameDifficulty(makeTotem(5), 2)).toBe(3);
    });
  });
});

// =============================================================================
// getSpeciesInfo
// =============================================================================

describe('getSpeciesInfo', () => {
  it('should return combined stats, emoji, and displayName', () => {
    const info = getSpeciesInfo(Species.Bear, Rarity.Common);
    expect(info.strength).toBe(12);
    expect(info.wisdom).toBe(7);
    expect(info.agility).toBe(5);
    expect(info.emoji).toBe('🐻');
    expect(info.displayName).toBe('Bear');
    expect(info.primaryStat).toBe('strength');
  });

  it('should include stat description', () => {
    const info = getSpeciesInfo(Species.Owl, Rarity.Common);
    expect(info.statDescription).toContain('Wisdom');
    expect(info.statDescription).toContain('12');
  });

  it('should apply rarity bonus to stats', () => {
    const info = getSpeciesInfo(Species.Falcon, Rarity.Epic);
    expect(info.agility).toBe(12 + 3); // base + epic bonus
  });
});

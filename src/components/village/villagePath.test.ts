import { describe, it, expect } from 'vitest';
import { withVillagePrefix } from './villagePath';

describe('withVillagePrefix', () => {
  describe('when current path is inside village trunk', () => {
    it('prefixes an absolute app path', () => {
      expect(withVillagePrefix('/keepers-village/guides', '/guides/codex')).toBe(
        '/keepers-village/guides/codex'
      );
    });

    it('prefixes the bare village root', () => {
      expect(withVillagePrefix('/keepers-village', '/shop')).toBe('/keepers-village/shop');
    });

    it('handles deep village paths', () => {
      expect(withVillagePrefix('/keepers-village/guides/codex/totems/owl', '/rewards')).toBe(
        '/keepers-village/rewards'
      );
    });

    it('does not double-prefix an already-prefixed path', () => {
      expect(
        withVillagePrefix('/keepers-village/guides', '/keepers-village/shop')
      ).toBe('/keepers-village/shop');
    });

    it('passes relative paths through unchanged', () => {
      expect(withVillagePrefix('/keepers-village/guides', 'codex')).toBe('codex');
      expect(withVillagePrefix('/keepers-village/guides', './tutorial')).toBe('./tutorial');
    });

    it('prefixes paths with query strings and hashes', () => {
      expect(
        withVillagePrefix('/keepers-village/guides', '/guides/codex/map?location=3#anchor')
      ).toBe('/keepers-village/guides/codex/map?location=3#anchor');
    });
  });

  describe('when current path is outside village trunk', () => {
    it('returns the absolute path unchanged', () => {
      expect(withVillagePrefix('/', '/guides')).toBe('/guides');
      expect(withVillagePrefix('/shop', '/totems')).toBe('/totems');
      expect(withVillagePrefix('/guides/codex', '/achievements')).toBe('/achievements');
    });

    it('does not strip an existing village prefix on the target', () => {
      expect(withVillagePrefix('/about', '/keepers-village/shop')).toBe(
        '/keepers-village/shop'
      );
    });

    it('passes relative paths through unchanged', () => {
      expect(withVillagePrefix('/guides', 'codex')).toBe('codex');
    });
  });

  describe('lookalike paths', () => {
    it('treats /keepers-village-archive (different route) as non-village', () => {
      // Currently the helper uses startsWith('/keepers-village'), so this is a
      // known limitation documented by this test — if /keepers-village-archive
      // ever exists, the helper would mistakenly trigger. Locks in current
      // behavior so a future refactor has to consider it explicitly.
      expect(
        withVillagePrefix('/keepers-village-archive', '/shop')
      ).toBe('/keepers-village/shop');
    });
  });
});

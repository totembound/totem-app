import { describe, it, expect } from 'vitest';
import { resolveAvatar, resolveBannerImage } from './avatar';
import { Domain } from '../types/types';

describe('resolveAvatar', () => {
    it('returns initials when avatar is null', () => {
        const r = resolveAvatar(null, 'Cool Player');
        expect(r).toEqual({ kind: 'initials', initials: 'CP' });
    });

    it('returns initials from a single-word displayName', () => {
        const r = resolveAvatar(null, 'Solo');
        expect(r).toEqual({ kind: 'initials', initials: 'SO' });
    });

    it('returns "?" for empty displayName', () => {
        const r = resolveAvatar(null, '   ');
        expect(r).toEqual({ kind: 'initials', initials: '?' });
    });

    it('resolves a domain reference to its image path', () => {
        const r = resolveAvatar({ kind: 'domain', id: Domain.Fire }, 'Player');
        expect(r).toEqual({ kind: 'image', src: '/domains/fire-domain.jpg' });
    });

    it('falls back to initials when domain id is unknown', () => {
        const r = resolveAvatar({ kind: 'domain', id: 99 as Domain }, 'Player');
        expect(r).toEqual({ kind: 'initials', initials: 'PL' });
    });

    it('resolves a totem reference via getTotemImageUrl', () => {
        const r = resolveAvatar(
            { kind: 'totem', speciesId: 0, colorId: 0, stage: 0 },
            'Player',
        );
        expect(r.kind).toBe('image');
    });
});

describe('resolveBannerImage', () => {
    it('returns null when banner is null', () => {
        expect(resolveBannerImage(null)).toBeNull();
    });

    it('returns image path for a domain banner', () => {
        expect(resolveBannerImage({ kind: 'domain', id: Domain.Water }))
            .toBe('/domains/water-domain.jpg');
    });

    it('returns null for an unknown domain id', () => {
        expect(resolveBannerImage({ kind: 'domain', id: 99 as Domain })).toBeNull();
    });
});

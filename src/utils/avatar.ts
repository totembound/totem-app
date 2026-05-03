/**
 * Avatar / Banner Resolver
 *
 * Translates the wire-format AvatarRef / BannerRef stored in the user profile
 * to a render-ready descriptor. All built-in image lookups happen here so the
 * rest of the UI never has to know whether a user picked a domain image, a
 * totem stage they own, or hasn't picked anything yet.
 */

import { AvatarRef, BannerRef } from '../types/types';
import { DOMAINS } from '../config/game-config';
import { getTotemImageUrl } from './species';

export type ResolvedImage =
    | { kind: 'image'; src: string }
    | { kind: 'initials'; initials: string };

export function initialsFor(displayName: string): string {
    const words = displayName.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function domainImage(id: number): string | null {
    const d = DOMAINS.find(d => d.id === id);
    return d?.image ?? null;
}

export function resolveAvatar(avatar: AvatarRef, displayName: string): ResolvedImage {
    if (!avatar) {
        return { kind: 'initials', initials: initialsFor(displayName) };
    }
    if (avatar.kind === 'domain') {
        const src = domainImage(avatar.id);
        if (src) return { kind: 'image', src };
        return { kind: 'initials', initials: initialsFor(displayName) };
    }
    if (avatar.kind === 'totem') {
        return {
            kind: 'image',
            src: getTotemImageUrl(avatar.speciesId, avatar.colorId, avatar.stage),
        };
    }
    return { kind: 'initials', initials: initialsFor(displayName) };
}

export function resolveBannerImage(banner: BannerRef): string | null {
    if (!banner || banner.kind !== 'domain') return null;
    return domainImage(banner.id);
}

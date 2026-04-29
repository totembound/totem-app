import { AvatarRef } from '../../types/types';
import { resolveAvatar } from '../../utils/avatar';

interface AvatarProps {
    avatar: AvatarRef;
    displayName: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-20 h-20 text-xl',
    xl: 'w-32 h-32 text-3xl',
};

export function Avatar({ avatar, displayName, size = 'md', className = '' }: AvatarProps) {
    const resolved = resolveAvatar(avatar, displayName);
    const sizeClass = SIZE_CLASSES[size];
    // base is shared geometry (size + circle clip) plus a neutral fallback bg
    // so avatars always read as a clean self-contained circle. Transparent PNGs
    // sit on this gray fallback rather than peeking through to the surrounding
    // surface — important in the UserMenu dropdown where the avatar overlaps a
    // banner/dropdown boundary.
    const base = `inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ${sizeClass} ${className}`;

    if (resolved.kind === 'image') {
        return (
            <span className={base}>
                <img
                    src={resolved.src}
                    alt={`${displayName} avatar`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            </span>
        );
    }

    return (
        <span
            className={`${base} bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 text-white font-bold tracking-wide`}
            aria-label={`${displayName} avatar`}
        >
            {resolved.initials}
        </span>
    );
}

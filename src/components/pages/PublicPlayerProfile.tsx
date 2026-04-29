import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, Crown } from 'lucide-react';
import apiClient from '../../services/ApiClient';
import { PublicPlayerProfile as PublicPlayerProfileData } from '../../types/types';
import { Avatar } from '../profile/Avatar';
import { resolveBannerImage } from '../../utils/avatar';

// Removed unused stage-badge helper after switching to inline tier badge only.
// Tier badge config — only Premium and VIP get a badge. Free shows nothing.
const TIER_BADGE: Record<string, { label: string; className: string; Icon: typeof Crown }> = {
    vip: {
        label: 'VIP',
        className: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700',
        Icon: Crown,
    },
    premium: {
        label: 'Premium',
        className: 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
        Icon: Award,
    },
};

const PublicPlayerProfile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<PublicPlayerProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        let cancelled = false;
        setLoading(true);
        setError(null);

        apiClient.getPublicPlayerProfile(userId)
            .then(res => {
                if (cancelled) return;
                if (res.success && res.data) setProfile(res.data);
                else setError(res.error?.message || 'Player not found');
            })
            .catch(() => {
                if (!cancelled) setError('Failed to load profile');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [userId]);

    if (loading) {
        return (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">Loading…</div>
        );
    }

    if (error || !profile) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {error || 'Player not found'}
                </h1>
                <Link to="/" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    Return home
                </Link>
            </div>
        );
    }

    const bannerSrc = resolveBannerImage(profile.profile.banner);
    const memberSince = new Date(profile.createdAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long',
    });

    return (
        <div className="max-w-3xl mx-auto p-2 sm:p-4">
            <button
                type="button"
                onClick={() => {
                    // Prefer browser-history back so users land on the marketplace /
                    // wherever they came from. Fall back to home if there's no history
                    // (e.g. opened in a new tab).
                    if (window.history.length > 1) navigate(-1);
                    else navigate('/');
                }}
                className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-3"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Banner + avatar — banner is the positioning context for the avatar.
                    Avatar is absolute, anchored to bottom-left and pulled half-down
                    out of the banner so it overlaps the banner/body boundary cleanly. */}
                <div className="relative h-36 sm:h-56 w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                    {bannerSrc && (
                        <img
                            src={bannerSrc}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}
                    {/* Avatar — half overlapping the banner, half below. Ring is applied
                        directly on the Avatar (fixed w-32 h-32) so it stays a perfect
                        circle even with the translate-y-1/2 transform. */}
                    <Avatar
                        avatar={profile.profile.avatar}
                        displayName={profile.displayName}
                        size="xl"
                        className="absolute bottom-0 left-4 sm:left-6 translate-y-1/2 z-10 ring-4 ring-white dark:ring-gray-800 shadow-xl"
                    />
                </div>

                {/* Reserve vertical space for the half of the avatar that hangs below
                    the banner (xl avatar = w-32 h-32 = 128px → half = 64px = pt-16). */}
                <div className="pt-16 sm:pt-20 px-4 sm:px-6 pb-5">
                    <div className="mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                                {profile.displayName}
                            </h1>
                            {TIER_BADGE[profile.tier] && (() => {
                                const t = TIER_BADGE[profile.tier];
                                return (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${t.className}`}>
                                        <t.Icon className="w-3 h-3" />
                                        {t.label}
                                    </span>
                                );
                            })()}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Member since {memberSince}
                        </p>
                    </div>

                    {profile.profile.bio ? (
                        <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                            {profile.profile.bio}
                        </p>
                    ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                            This player hasn't added a bio yet.
                        </p>
                    )}
                </div>

                {/* Stats footer — Totems / Challenges / Best Streak / Highest Stage */}
                <div className="border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-200 dark:divide-gray-700">
                    <Stat label="Totems" value={profile.stats.totalTotems} />
                    <Stat label="Challenges" value={profile.stats.totalChallengesCompleted} />
                    <Stat label="Best streak" value={profile.stats.bestLoginStreak} />
                    <Stat label="Top stage" value={profile.stats.highestStageReached} />
                </div>
            </div>
        </div>
    );
};

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="text-center py-4 sm:py-5">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()}</p>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
        </div>
    );
}

export default PublicPlayerProfile;

import { useEffect, useState } from 'react';
import { ImagePlus, Pencil } from 'lucide-react';
import apiClient from '../../services/ApiClient';
import { AvatarRef, BannerRef } from '../../types/types';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from './Avatar';
import { ImagePickerDialog } from './ImagePickerDialog';
import { resolveBannerImage } from '../../utils/avatar';

const BIO_MAX = 240;

interface ProfileEditorProps {
    displayName: string;
    onSaved?: (message: string) => void;
    onError?: (message: string) => void;
    onCommit?: (profile: { bio: string | null; avatar: AvatarRef; banner: BannerRef }) => void;
}

export function ProfileEditor({ displayName, onSaved, onError, onCommit }: ProfileEditorProps) {
    const { totems } = useUser();
    const { refreshUser } = useAuth();
    const [bio, setBio] = useState<string>('');
    const [avatar, setAvatar] = useState<AvatarRef>(null);
    const [banner, setBanner] = useState<BannerRef>(null);

    const [initialBio, setInitialBio] = useState<string>('');
    const [initialAvatar, setInitialAvatar] = useState<AvatarRef>(null);
    const [initialBanner, setInitialBanner] = useState<BannerRef>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pickerOpen, setPickerOpen] = useState<null | 'avatar' | 'banner'>(null);

    useEffect(() => {
        let cancelled = false;
        apiClient.getProfile()
            .then(res => {
                if (cancelled || !res.success || !res.data) return;
                const p = res.data.profile ?? { bio: null, avatar: null, banner: null };
                setBio(p.bio ?? '');
                setAvatar(p.avatar);
                setBanner(p.banner);
                setInitialBio(p.bio ?? '');
                setInitialAvatar(p.avatar);
                setInitialBanner(p.banner);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const dirty = bio !== initialBio
        || JSON.stringify(avatar) !== JSON.stringify(initialAvatar)
        || JSON.stringify(banner) !== JSON.stringify(initialBanner);

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: Parameters<typeof apiClient.updateProfile>[0] = {};
            if (bio !== initialBio) payload.bio = bio.trim() === '' ? null : bio;
            if (JSON.stringify(avatar) !== JSON.stringify(initialAvatar)) payload.avatar = avatar;
            if (JSON.stringify(banner) !== JSON.stringify(initialBanner)) payload.banner = banner;

            const res = await apiClient.updateProfile(payload);
            if (res.success) {
                const committedBio = bio.trim() === '' ? null : bio;
                setInitialBio(bio);
                setInitialAvatar(avatar);
                setInitialBanner(banner);
                onSaved?.('Profile updated');
                onCommit?.({ bio: committedBio, avatar, banner });
                // Refresh AuthContext.user so the header UserMenu picks up the
                // new avatar/banner without a page reload.
                refreshUser().catch(() => { /* non-fatal: menu will re-sync on next mount */ });
            }
            else {
                onError?.(res.error?.message || 'Failed to save profile');
            }
        }
        catch (err) {
            onError?.(err instanceof Error ? err.message : 'Failed to save profile');
        }
        finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-sm text-gray-500 dark:text-gray-400">Loading profile…</div>;
    }

    const bannerSrc = resolveBannerImage(banner);

    return (
        <div className="space-y-4">
            {/* Banner preview + edit */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Banner
                </label>
                <div className="relative h-24 sm:h-32 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500">
                    {bannerSrc && (
                        <img src={bannerSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <button
                        type="button"
                        onClick={() => setPickerOpen('banner')}
                        className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/60 text-white text-xs hover:bg-black/80"
                    >
                        <ImagePlus className="w-3.5 h-3.5" /> Change banner
                    </button>
                </div>
            </div>

            {/* Avatar preview + edit */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Avatar
                </label>
                <div className="flex items-center gap-3">
                    <Avatar avatar={avatar} displayName={displayName} size="lg" />
                    <button
                        type="button"
                        onClick={() => setPickerOpen('avatar')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <Pencil className="w-3.5 h-3.5" /> Change avatar
                    </button>
                </div>
            </div>

            {/* Bio */}
            <div>
                <label htmlFor="profile-bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bio
                </label>
                <textarea
                    id="profile-bio"
                    value={bio}
                    onChange={e => setBio(e.target.value.slice(0, BIO_MAX))}
                    rows={4}
                    maxLength={BIO_MAX}
                    placeholder="Tell other players a little about yourself…"
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Plain text + emoji. No links.</span>
                    <span>{bio.length}/{BIO_MAX}</span>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40"
                >
                    {saving ? 'Saving…' : 'Save profile'}
                </button>
            </div>

            {pickerOpen === 'avatar' && (
                <ImagePickerDialog
                    isOpen
                    mode="avatar"
                    current={avatar}
                    totems={totems}
                    onClose={() => setPickerOpen(null)}
                    onSave={ref => setAvatar(ref)}
                />
            )}
            {pickerOpen === 'banner' && (
                <ImagePickerDialog
                    isOpen
                    mode="banner"
                    current={banner}
                    onClose={() => setPickerOpen(null)}
                    onSave={ref => setBanner(ref)}
                />
            )}
        </div>
    );
}

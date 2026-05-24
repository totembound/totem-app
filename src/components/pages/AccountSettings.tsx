import { useState, useEffect } from 'react';
import { Award, Crown, Loader2, CheckCircle, XCircle, CreditCard, Gift, Gem, Sparkles, Shield, ArrowUpRight, Clock, Zap, Star, Pencil, User as UserIcon } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { withVillagePrefix } from '../village/villagePath';
import apiClient from '../../services/ApiClient';
import * as serviceWorkerRegistration from '../../serviceWorkerRegistration';
import EditDisplayNameDialog from '../settings/EditDisplayNameDialog';
import { ProfileEditor } from '../profile/ProfileEditor';
import { Avatar } from '../profile/Avatar';
import { initialsFor, resolveBannerImage } from '../../utils/avatar';
import type { UserProfile } from '../../types/types';

interface SubscriptionInfo {
  tier: string;
  stripeCustomerId: string | null;
  subscription: {
    status: string;
    tier: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    subscriptionId: string | null;
  };
}

interface BonusStatus {
  eligible: boolean;
  tier: string;
  canClaim: boolean;
  alreadyClaimed?: boolean;
  claimedAt?: string | null;
  currentMonth?: string;
  reason?: string;
  bonus?: { essence: number; gems: number };
}

const AccountSettings = () => {
    const { updateBalances, essenceBalance, gemsBalance, totems } = useUser();
    const { isAuthenticated, user: authUser } = useAuth();
    const location = useLocation();
    const vp = (path: string) => withVillagePrefix(location.pathname, path);
    const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
    const [bonusStatus, setBonusStatus] = useState<BonusStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(false);
    const [reactivating, setReactivating] = useState(false);
    const [claimingBonus, setClaimingBonus] = useState(false);
    const [openingPortal, setOpeningPortal] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [editingName, setEditingName] = useState(false);
    const [profile, setProfile] = useState<UserProfile>({ bio: null, avatar: null, banner: null });
    const version = serviceWorkerRegistration.getVersion();

    // Use authUser for profile info (displayName, email)
    const displayName = authUser?.displayName || 'Player';
    const email = authUser?.email || '';
    const initials = initialsFor(displayName);

    const fetchSubscriptionStatus = async () => {
        setLoading(true);
        try {
            const [subResponse, bonusResponse] = await Promise.all([
                apiClient.getSubscriptionStatus(),
                apiClient.getSubscriptionBonusStatus(),
            ]);
            if (subResponse.success && subResponse.data) {
                setSubInfo(subResponse.data);
            }
            if (bonusResponse.success && bonusResponse.data) {
                setBonusStatus(bonusResponse.data);
            }
        } catch (err) {
            console.error('Failed to fetch subscription status:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchSubscriptionStatus();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        let cancelled = false;
        apiClient.getProfile().then(res => {
            if (cancelled || !res.success || !res.data?.profile) return;
            setProfile(res.data.profile);
        });
        return () => { cancelled = true; };
    }, [isAuthenticated]);

    const handleCancel = async () => {
        setCanceling(true);
        setErrorMessage(null);
        try {
            const response = await apiClient.cancelSubscription();
            if (response.success && response.data) {
                setSuccessMessage(response.data.message || 'Subscription will cancel at end of billing period');
                await fetchSubscriptionStatus();
            } else {
                setErrorMessage(response.error?.message || 'Failed to cancel subscription');
            }
        } catch (err: any) {
            setErrorMessage(err?.message || 'Failed to cancel');
        } finally {
            setCanceling(false);
        }
    };

    const handleReactivate = async () => {
        setReactivating(true);
        setErrorMessage(null);
        try {
            const response = await apiClient.reactivateSubscription();
            if (response.success && response.data) {
                setSuccessMessage(response.data.message || 'Subscription reactivated');
                await fetchSubscriptionStatus();
            } else {
                setErrorMessage(response.error?.message || 'Failed to reactivate');
            }
        } catch (err: any) {
            setErrorMessage(err?.message || 'Failed to reactivate');
        } finally {
            setReactivating(false);
        }
    };

    const handleBillingPortal = async () => {
        if (openingPortal) return;
        setOpeningPortal(true);
        setErrorMessage(null);
        try {
            const returnPath = window.location.pathname + window.location.search;
            const response = await apiClient.getBillingPortalUrl(returnPath);
            if (response.success && response.data?.portalUrl) {
                // Same-tab navigation — window.open is silently blocked in iOS PWA standalone mode.
                // Stripe's return_url brings the user back to `returnPath` when they're done.
                window.location.assign(response.data.portalUrl);
                // Keep spinner visible while the browser navigates away
                return;
            } else {
                setErrorMessage(response.error?.message || 'Could not open billing portal');
            }
        } catch (err: any) {
            setErrorMessage(err?.message || 'Failed to open billing portal');
        } finally {
            setOpeningPortal(false);
        }
    };

    const handleClaimBonus = async () => {
        setClaimingBonus(true);
        setErrorMessage(null);
        try {
            const response = await apiClient.claimSubscriptionBonus();
            if (response.success && response.data) {
                setSuccessMessage(response.data.message || 'Monthly bonus claimed!');
                await updateBalances();
                await fetchSubscriptionStatus();
            } else {
                setErrorMessage(response.error?.message || 'Failed to claim bonus');
            }
        } catch (err: any) {
            setErrorMessage(err?.message || 'Failed to claim bonus');
        } finally {
            setClaimingBonus(false);
        }
    };

    const currentTier = subInfo?.tier || authUser?.tier || 'free';
    const isSubscribed = currentTier !== 'free';
    const cancelAtPeriodEnd = subInfo?.subscription?.cancelAtPeriodEnd || false;
    const currentPeriodEnd = subInfo?.subscription?.currentPeriodEnd;

    const tierConfig = {
        vip: {
            label: 'VIP',
            icon: <Crown className="w-5 h-5" />,
            iconSmall: <Crown className="w-4 h-4" />,
            color: 'text-amber-500',
            bg: 'bg-amber-500',
            bgLight: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-400 dark:border-amber-600',
            badgeClass: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900',
            gradient: 'from-amber-500 to-orange-600',
            heroGradient: 'from-amber-900/80 via-orange-900/60 to-gray-900/90',
            ringColor: 'ring-amber-400',
        },
        premium: {
            label: 'Premium',
            icon: <Award className="w-5 h-5" />,
            iconSmall: <Award className="w-4 h-4" />,
            color: 'text-purple-500',
            bg: 'bg-purple-500',
            bgLight: 'bg-purple-50 dark:bg-purple-900/20',
            border: 'border-purple-400 dark:border-purple-600',
            badgeClass: 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900',
            gradient: 'from-purple-500 to-indigo-600',
            heroGradient: 'from-purple-900/80 via-indigo-900/60 to-gray-900/90',
            ringColor: 'ring-purple-400',
        },
        free: {
            label: 'Free',
            icon: <Shield className="w-5 h-5" />,
            iconSmall: <Shield className="w-4 h-4" />,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500',
            bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
            border: 'border-emerald-400 dark:border-emerald-600',
            badgeClass: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900',
            gradient: 'from-emerald-500 to-teal-600',
            heroGradient: 'from-emerald-900/80 via-teal-900/60 to-gray-900/90',
            // Neutral gray ring for free — no tier flex but still gives the avatar
            // a subtle outline. Paid tiers (premium/vip) get the colored rings.
            ringColor: 'ring-gray-300 dark:ring-gray-600',
        },
    };

    const tier = tierConfig[currentTier as keyof typeof tierConfig] || tierConfig.free;

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
            {/* Hero Profile Header.
                Banner set → render the chosen image clean (no tier tint).
                Banner not set → fall back to the tier-themed gradient + dot pattern,
                so free/premium/vip users without a banner still see something themed.
                Either way, tier is also explicitly conveyed by the inline badge below. */}
            {(() => {
                const bannerSrc = resolveBannerImage(profile.banner);
                return (
                    <div className={`relative rounded-xl overflow-hidden mb-8 ${bannerSrc ? '' : `bg-gradient-to-r ${tier.heroGradient}`}`}>
                        {bannerSrc ? (
                            <>
                                <img
                                    src={bannerSrc}
                                    alt=""
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                {/* Light scrim improves white-text readability on bright banners */}
                                <div className="absolute inset-0 bg-black/20" />
                            </>
                        ) : (
                            // Tile a faint dot-scatter pattern over the tier gradient
                            // for a subtle texture (otherwise the hero reads as a flat color).
                            <div className="absolute inset-0 bg-[url('/patterns/dot-scatter.svg')] opacity-50" />
                        )}
                <div className="relative px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row items-center gap-6">
                    {/* Avatar — neutral light/dark ring applied directly on the Avatar
                        (which has explicit w-32 h-32) so the ring can never read as an
                        oval. Tier signal lives in the inline tier badge below the name. */}
                    {profile.avatar ? (
                        <Avatar
                            avatar={profile.avatar}
                            displayName={displayName}
                            size="xl"
                            className="flex-shrink-0 ring-4 ring-white dark:ring-gray-800 shadow-lg"
                        />
                    ) : (
                        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${tier.gradient} flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-lg flex-shrink-0`}>
                            <span className="text-white text-3xl font-bold">{initials}</span>
                        </div>
                    )}
                    {/* Info */}
                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1 justify-center sm:justify-start">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">{displayName}</h1>
                            <button
                                onClick={() => setEditingName(true)}
                                className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                                aria-label="Edit display name"
                                title="Edit display name"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                        </div>
                        {email && (
                            <p className="text-white/60 text-sm truncate">{email}</p>
                        )}
                    </div>
                    {/* Quick Stats */}
                    <div className="flex gap-4 sm:gap-6 flex-shrink-0">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{totems?.length || 0}</p>
                            <p className="text-white/50 text-xs uppercase tracking-wider">Totems</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{Number(essenceBalance || 0).toLocaleString()}</p>
                            <p className="text-white/50 text-xs uppercase tracking-wider">Essence</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white">{Number(gemsBalance || 0).toLocaleString()}</p>
                            <p className="text-white/50 text-xs uppercase tracking-wider">Gems</p>
                        </div>
                    </div>
                </div>
                    </div>
                );
            })()}

            {/* Status Banners */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-green-700 dark:text-green-400 text-sm">{successMessage}</span>
                    <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-500 hover:text-green-700 text-lg leading-none">&times;</button>
                </div>
            )}
            {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                    <XCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                    <span className="text-red-700 dark:text-red-400 text-sm">{errorMessage}</span>
                    <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-500 hover:text-red-700 text-lg leading-none">&times;</button>
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Profile (bio, avatar, banner) */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Public profile</h2>
                            </div>
                            {authUser?.id && (
                                <Link
                                    to={vp(`/players/${authUser.id}`)}
                                    className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    View as others see it
                                </Link>
                            )}
                        </div>
                        <div className="p-6">
                            <ProfileEditor
                                displayName={displayName}
                                onSaved={msg => setSuccessMessage(msg)}
                                onError={msg => setErrorMessage(msg)}
                                onCommit={p => setProfile(p)}
                            />
                        </div>
                    </div>

                    {/* Subscription Management */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${tier.bgLight} flex items-center justify-center ${tier.color}`}>
                                <CreditCard className="w-4 h-4" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription</h2>
                        </div>

                        <div className="p-6">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                                    <span className="ml-3 text-gray-500 dark:text-gray-400 text-sm">Loading subscription details...</span>
                                </div>
                            ) : isSubscribed ? (
                                <div className="space-y-5">
                                    {/* Status Row */}
                                    <div className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
                                        cancelAtPeriodEnd
                                            ? 'bg-amber-50 dark:bg-amber-900/10 border-l-amber-400'
                                            : `${tier.bgLight} border-l-${currentTier === 'vip' ? 'amber' : 'purple'}-500`
                                    }`} style={ !cancelAtPeriodEnd ? { borderLeftColor: currentTier === 'vip' ? '#f59e0b' : '#a855f7' } : undefined }>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`font-semibold ${tier.color}`}>{tier.label} Plan</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    cancelAtPeriodEnd
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-400'
                                                        : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400'
                                                }`}>
                                                    {cancelAtPeriodEnd ? 'Canceling' : 'Active'}
                                                </span>
                                            </div>
                                            {currentPeriodEnd && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {cancelAtPeriodEnd
                                                        ? `Access until ${new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                                        : `Renews ${new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-3">
                                        {cancelAtPeriodEnd ? (
                                            <button
                                                onClick={handleReactivate}
                                                disabled={reactivating}
                                                className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${tier.gradient} hover:opacity-90 text-white rounded-lg transition-all disabled:opacity-50 font-medium text-sm shadow-sm`}
                                            >
                                                {reactivating ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" />Reactivating...</>
                                                ) : (
                                                    <><Zap className="w-4 h-4" />Reactivate Subscription</>
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleCancel}
                                                disabled={canceling}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 text-sm"
                                            >
                                                {canceling ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" />Canceling...</>
                                                ) : (
                                                    'Cancel Subscription'
                                                )}
                                            </button>
                                        )}
                                        {subInfo?.stripeCustomerId && (
                                            <button
                                                onClick={handleBillingPortal}
                                                disabled={openingPortal}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            >
                                                {openingPortal ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" />Opening...</>
                                                ) : (
                                                    <><CreditCard className="w-4 h-4" />Manage Billing</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Free Tier - Upgrade Prompt */
                                <div className="text-center py-4">
                                    <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-7 h-7 text-purple-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unlock More</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 max-w-md mx-auto">
                                        Upgrade to Premium or VIP to earn monthly bonuses, exclusive totems, and daily reward multipliers.
                                    </p>
                                    <Link
                                        to={vp("/plans")}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium text-sm shadow-sm"
                                    >
                                        <Award className="w-4 h-4" />
                                        View Plans
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Monthly Bonus (subscribers only) */}
                    {isSubscribed && bonusStatus && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900 flex items-center justify-center text-amber-500">
                                    <Gift className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Bonus</h2>
                            </div>

                            <div className="p-6">
                                {bonusStatus.canClaim ? (
                                    <div className="space-y-4">
                                        <div className={`p-5 rounded-xl bg-gradient-to-br ${tier.bgLight} border ${tier.border}`}>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                                Your {tier.label} bonus is ready!
                                            </p>
                                            <div className="flex gap-8 mb-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                                        <Sparkles className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                            {bonusStatus.bonus?.essence?.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Essence</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                                        <Gem className="w-5 h-5 text-purple-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                            {bonusStatus.bonus?.gems?.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">Gems</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleClaimBonus}
                                                disabled={claimingBonus}
                                                className={`w-full px-4 py-3 bg-gradient-to-r ${tier.gradient} hover:opacity-90 text-white rounded-lg transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm`}
                                            >
                                                {claimingBonus ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" />Claiming...</>
                                                ) : (
                                                    <><Gift className="w-4 h-4" />Claim Monthly Bonus</>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            Bonus resets each month. Unclaimed bonuses do not carry over.
                                        </p>
                                    </div>
                                ) : bonusStatus.alreadyClaimed ? (
                                    <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span className="font-medium text-green-700 dark:text-green-400">
                                                Bonus claimed for {bonusStatus.currentMonth}
                                            </span>
                                        </div>
                                        {bonusStatus.claimedAt && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Claimed on {new Date(bonusStatus.claimedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Next bonus available next month.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        {bonusStatus.reason || 'Bonus not available'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">

                    {/* Upgrade Card (free users) */}
                    {!isSubscribed && (
                        <div className="relative rounded-xl overflow-hidden border border-purple-200 dark:border-purple-800">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-indigo-600/5 dark:from-purple-600/10 dark:to-indigo-600/10" />
                            <div className="relative p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Upgrade Your Experience</h3>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                                    Premium and VIP members enjoy exclusive perks every month.
                                </p>
                                <ul className="space-y-3 mb-6">
                                    {[
                                        { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'Monthly Essence & Gems bonus' },
                                        { icon: <Star className="w-3.5 h-3.5" />, text: 'Exclusive premium totems' },
                                        { icon: <Zap className="w-3.5 h-3.5" />, text: 'Daily reward multiplier' },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                                            <span className="text-purple-500 flex-shrink-0">{item.icon}</span>
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                                <Link
                                    to={vp("/plans")}
                                    className="block w-full text-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all font-medium text-sm shadow-sm"
                                >
                                    View Plans
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Current Plan Benefits (subscribers) */}
                    {isSubscribed && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className={`px-6 py-4 bg-gradient-to-r ${tier.gradient}`}>
                                <div className="flex items-center gap-2 text-white">
                                    {tier.icon}
                                    <h3 className="font-semibold">Your {tier.label} Benefits</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <ul className="space-y-3">
                                    {[
                                        { text: `${currentTier === 'vip' ? '1,500' : '500'} Essence monthly`, icon: <Sparkles className="w-3.5 h-3.5" /> },
                                        { text: `${currentTier === 'vip' ? '500' : '100'} Gems monthly`, icon: <Gem className="w-3.5 h-3.5" /> },
                                        { text: `${currentTier === 'vip' ? '3x' : '2x'} daily reward bonus`, icon: <Zap className="w-3.5 h-3.5" /> },
                                        { text: 'Exclusive totems', icon: <Star className="w-3.5 h-3.5" /> },
                                        ...(currentTier === 'vip' ? [
                                            { text: 'VIP badge & cosmetics', icon: <Crown className="w-3.5 h-3.5" /> },
                                            { text: 'Early access to features', icon: <Zap className="w-3.5 h-3.5" /> },
                                        ] : []),
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                                            <span className={`${tier.color} flex-shrink-0`}>{item.icon}</span>
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                                {currentTier === 'premium' && (
                                    <Link
                                        to={vp("/plans")}
                                        className="flex items-center justify-center gap-2 w-full mt-5 px-4 py-2.5 border border-amber-400 dark:border-amber-600 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        <Crown className="w-4 h-4" />
                                        Upgrade to VIP
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Gem Store */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center gap-2.5 mb-3">
                            <Gem className="w-5 h-5 text-purple-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Gem Store</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Purchase Gems to exchange for Essence, buy bundles, and more.
                        </p>
                        <Link
                            to={vp("/shop")}
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            Visit Shop
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Version */}
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                        Version {version}
                    </p>
                </div>
            </div>

            <EditDisplayNameDialog
                open={editingName}
                currentName={displayName}
                cooldown={authUser?.displayNameCooldown ?? null}
                onClose={() => setEditingName(false)}
                onSuccess={(newName, skipped) => {
                    setSuccessMessage(
                        skipped
                            ? `Display name changed to "${newName}". 500 Essence spent to skip cooldown.`
                            : `Display name changed to "${newName}".`,
                    );
                }}
            />
        </div>
    );
};

export default AccountSettings;

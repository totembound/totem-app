/**
 * Special Offers - Card Gallery Bundles + Hero Banner
 *
 * 3 daily bundles (Starter, Rare, Epic) as rarity-themed cards on top.
 * Monthly Limited Special as full-width hero banner below.
 * On mobile: stacks as Starter → Rare → Epic → Limited Monthly.
 */
import { Clock, Crown, Gem, Gift, Sparkles, Star, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import { getCurrentMonth } from '../../utils/totems';
import specialsData from '../data/specials.json';
import { CURRENCY_NAMES } from '../../config/constants';
import apiClient from '../../services/ApiClient';
import { notificationService } from '../../services/NotificationService';
import { Rarity } from '../../types/types';
import { getSpeciesName, getStageName, getTotemImageUrl } from '../../utils/species';

const _interpolateCurrency = (text: string): string => {
    return text.replace(/\{\{SOFT_CURRENCY\}\}/g, CURRENCY_NAMES.SOFT)
               .replace(/\{\{PREMIUM_CURRENCY\}\}/g, CURRENCY_NAMES.PREMIUM);
};

interface SpecialOffersViewProps {
    onPurchased: (purchased: any) => void;
}

interface PendingPurchase {
    bundleId: number;
    bundleName: string;
    gemCost: number;
    essenceAmount: number;
    totemRarity: string;
}

const SpecialOffers: React.FC<SpecialOffersViewProps> = ({ onPurchased }) => {
    const currentMonth = new Date().getUTCMonth() + 1;
    const currentMonthlySpecial = specialsData.monthlySpecials.find(special => special.month === currentMonth);
    const [loading, setLoading] = useState<{[key: string]: boolean}>({});
    const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null);
    const { showError, showSuccess, canSpendGems, updateBalances, fetchTotems } = useUser();
    const { refreshAchievements } = useAchievements();

    const commonBundle = specialsData.bundles.common;
    const rareBundle = specialsData.bundles.rare;
    const epicBundle = specialsData.bundles.epic;

    const handleRequestPurchase = (bundleId: number, bundleName: string, gemCost: number, essenceAmount: number, totemRarity = 'Exclusive') => {
        setPendingPurchase({ bundleId, bundleName, gemCost, essenceAmount, totemRarity });
    };

    const handleCancelPurchase = () => setPendingPurchase(null);

    const handleConfirmPurchase = async () => {
        if (!pendingPurchase) return;
        const { bundleId } = pendingPurchase;
        setPendingPurchase(null);
        setLoading(prev => ({ ...prev, [bundleId]: true }));
        try {
            const result = await apiClient.purchaseBundle(bundleId);
            if (result.success && result.data) {
                const totem = result.data.totem as any;
                const stage = totem.stage || 0;
                onPurchased({
                    id: totem.id,
                    name: totem.speciesName || 'Totem',
                    image: getTotemImageUrl(totem.speciesId, totem.colorId, stage),
                    innateTraitId: totem.traits?.innate,
                    attributes: {
                        species: totem.speciesId, color: totem.colorId,
                        rarity: totem.rarityId,
                        displayName: getStageName(totem.speciesId, totem.colorId, stage),
                        stage,
                    }
                });
                await updateBalances();
                await fetchTotems();
                await refreshAchievements();
                const rarityName = Rarity[result.data.totem.rarityId] || 'Unknown';
                const speciesName = getSpeciesName((result.data.totem as any).speciesId);
                notificationService.showBundlePurchased({
                    tokenId: result.data.totem.id || '',
                    rarity: rarityName,
                    species: speciesName.charAt(0).toUpperCase() + speciesName.slice(1),
                    bundleId: bundleId.toString(),
                });
                notificationService.processAchievementsFromResponse((result.data as any).achievements);
                showSuccess("Bundle Claimed!",
                    `You received ${result.data.essenceReceived.toLocaleString()} ${CURRENCY_NAMES.SOFT} and a new totem!`);
            } else {
                showError("Purchase Failed", result.error?.message || 'Failed to purchase bundle');
            }
        } catch (err: any) {
            showError("Error", err?.message || "Failed to purchase bundle. Try again shortly.");
        } finally {
            setLoading(prev => ({ ...prev, [bundleId]: false }));
        }
    };

    const renderBundleCard = (
        bundle: typeof commonBundle,
        tier: 'common' | 'rare' | 'epic',
        icon: React.ReactNode,
        tierLabel: string,
        totemRarity: string,
    ) => {
        const tierStyles = {
            common: {
                headerBg: 'bg-gradient-to-r from-green-600 to-emerald-600',
                cardBorder: 'border-green-500/40 hover:border-green-400/60',
                glowHover: 'hover:shadow-green-500/20',
                btnBg: 'bg-green-600 hover:bg-green-500',
                priceBg: 'bg-green-900/30 border-green-700/30',
                priceBgLight: 'bg-green-50 border-green-200',
                rarityBadge: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50',
            },
            rare: {
                headerBg: 'bg-gradient-to-r from-blue-600 to-sky-600',
                cardBorder: 'border-blue-500/40 hover:border-blue-400/60',
                glowHover: 'hover:shadow-blue-500/20',
                btnBg: 'bg-blue-600 hover:bg-blue-500',
                priceBg: 'bg-blue-900/30 border-blue-700/30',
                priceBgLight: 'bg-blue-50 border-blue-200',
                rarityBadge: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50',
            },
            epic: {
                headerBg: 'bg-gradient-to-r from-purple-600 to-violet-600',
                cardBorder: 'border-purple-500/40 hover:border-purple-400/60',
                glowHover: 'hover:shadow-purple-500/20',
                btnBg: 'bg-purple-600 hover:bg-purple-500',
                priceBg: 'bg-purple-900/30 border-purple-700/30',
                priceBgLight: 'bg-purple-50 border-purple-200',
                rarityBadge: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50',
            },
        };

        const s = tierStyles[tier];

        return (
            <div
                key={bundle.bundleId}
                className={`rounded-xl border ${s.cardBorder} bg-white dark:bg-gray-800/80 overflow-hidden shadow-md ${s.glowHover} hover:shadow-lg transition-all group`}
            >
                {/* Colored header bar */}
                <div className={`${s.headerBg} px-4 py-2.5 flex items-center justify-between`}>
                    <div className="flex items-center gap-2 text-white">
                        {icon}
                        <span className="font-bold text-sm uppercase tracking-wide">{tierLabel}</span>
                    </div>
                    <span className="text-white/80 text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
                        {bundle.cta}
                    </span>
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                    <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
                        {bundle.name}
                    </h4>

                    {/* Itemized rewards */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">You'll receive</p>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30">
                                <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                {bundle.tokenAmount.toLocaleString()} {CURRENCY_NAMES.SOFT}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700">
                                <Gift size={14} className="text-gray-600 dark:text-gray-400" />
                            </div>
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">1 Totem</span>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${s.rarityBadge}`}>
                                {totemRarity}
                            </span>
                        </div>
                    </div>

                    {/* CTA button with price */}
                    <button
                        onClick={() => handleRequestPurchase(bundle.bundleId, bundle.name, bundle.price, bundle.tokenAmount, totemRarity)}
                        disabled={loading[bundle.bundleId] || !canSpendGems(bundle.price)}
                        className={`w-full ${s.btnBg} text-white py-2.5 px-4 rounded-lg font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all transform group-hover:scale-[1.01] active:scale-100 flex items-center justify-center gap-2`}
                    >
                        <Gem size={16} />
                        {loading[bundle.bundleId] ? 'Processing...' : `Claim for ${bundle.price.toLocaleString()} ${CURRENCY_NAMES.PREMIUM}`}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                    <h2 className="text-2xl font-bold dark:text-gray-200">Special Offers</h2>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Resets Daily</span>
                </div>
            </div>

            {/* Daily Bundles: Starter → Rare → Epic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderBundleCard(commonBundle, 'common', <Star size={16} />, 'Starter', 'Uncommon')}
                {renderBundleCard(rareBundle, 'rare', <Zap size={16} />, 'Rare', 'Rare')}
                {renderBundleCard(epicBundle, 'epic', <Crown size={16} />, 'Epic', 'Epic')}
            </div>

            {/* Monthly Limited Special */}
            {currentMonthlySpecial && (
                        <div className="relative overflow-hidden rounded-xl border-2 border-amber-500/50 dark:border-amber-400/40 shadow-lg shadow-amber-500/10">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 via-yellow-500/5 to-amber-600/10 dark:from-amber-600/20 dark:via-yellow-500/10 dark:to-amber-600/20" />

                            <div className="relative bg-gradient-to-r from-gray-50 via-amber-50/30 to-gray-50 dark:from-gray-800 dark:via-amber-900/20 dark:to-gray-800">
                                {/* Ribbon badge */}
                                <div className="absolute top-0 right-0 z-10">
                                    <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-xs uppercase tracking-wider px-6 py-1.5 rounded-bl-lg shadow-lg">
                                        <Clock size={12} className="inline mr-1 -mt-0.5" />
                                        Limited {getCurrentMonth()} Only
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                                    {/* Image — 1/3 width, same as bundle cards above */}
                                    <div className="flex items-center justify-center p-3 bg-gradient-to-br from-amber-100/50 to-amber-200/30 dark:from-amber-900/30 dark:to-amber-800/10">
                                        <img
                                            src={currentMonthlySpecial.image}
                                            alt={currentMonthlySpecial.name}
                                            className="w-full max-w-[16rem] aspect-square object-contain drop-shadow-lg"
                                        />
                                    </div>

                                    {/* Content — 2/3 width */}
                                    <div className="md:col-span-2 p-6 flex flex-col justify-center">
                                        <div className="mb-1">
                                            <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                                                Monthly Totem Series
                                            </span>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2">
                                            {currentMonthlySpecial.name}
                                        </h3>
                                        <p className="text-sm text-amber-800 dark:text-amber-300/80 mb-1">
                                            {getCurrentMonth()} Edition
                                        </p>
                                        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                                            {currentMonthlySpecial.description}
                                        </p>

                                        {/* Value badges */}
                                        <div className="flex flex-wrap items-center gap-3 mb-5">
                                            <div className="flex items-center gap-2 bg-amber-100/80 dark:bg-amber-900/40 border border-amber-300/50 dark:border-amber-700/50 rounded-lg px-3 py-2">
                                                <Sparkles size={16} className="text-amber-600 dark:text-amber-400" />
                                                <span className="font-bold text-amber-800 dark:text-amber-200">
                                                    {Number(currentMonthlySpecial.tokenAmount).toLocaleString()} {CURRENCY_NAMES.SOFT}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-purple-100/80 dark:bg-purple-900/30 border border-purple-300/50 dark:border-purple-700/50 rounded-lg px-3 py-2">
                                                <Star size={16} className="text-purple-600 dark:text-purple-400" />
                                                <span className="font-bold text-purple-800 dark:text-purple-200">Exclusive Totem</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-red-100/80 dark:bg-red-900/30 border border-red-300/50 dark:border-red-700/50 rounded-lg px-3 py-2">
                                                <Clock size={16} className="text-red-600 dark:text-red-400" />
                                                <span className="font-bold text-red-800 dark:text-red-200">Limited Edition</span>
                                            </div>
                                        </div>

                                        {/* CTA */}
                                        <button
                                            onClick={() => handleRequestPurchase(currentMonthlySpecial.bundleId, currentMonthlySpecial.name, currentMonthlySpecial.price, currentMonthlySpecial.tokenAmount)}
                                            disabled={loading[currentMonthlySpecial.bundleId] || !canSpendGems(currentMonthlySpecial.price)}
                                            className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white py-3 px-8 rounded-lg font-bold text-lg shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all transform hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                                        >
                                            <Gem size={20} />
                                            {loading[currentMonthlySpecial.bundleId] ? 'Processing...' : `Claim for ${currentMonthlySpecial.price.toLocaleString()} ${CURRENCY_NAMES.PREMIUM}`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

            {/* Confirmation Dialog */}
            {pendingPurchase && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Purchase</h3>
                            <button onClick={handleCancelPurchase} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-gray-700 dark:text-gray-300">
                                Are you sure you want to purchase the <strong>{pendingPurchase.bundleName}</strong>?
                            </p>
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                                    <span className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400">
                                        <Gem size={14} />
                                        {pendingPurchase.gemCost.toLocaleString()} {CURRENCY_NAMES.PREMIUM}
                                    </span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600" />
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">You'll receive</p>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                        <Sparkles size={14} className="text-amber-500" />
                                        {CURRENCY_NAMES.SOFT}
                                    </span>
                                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                                        {pendingPurchase.essenceAmount.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                        <Gift size={14} className="text-gray-500" />
                                        Totem
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        {pendingPurchase.totemRarity} Rarity
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">This bundle can only be purchased once per day.</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={handleCancelPurchase} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">Cancel</button>
                            <button onClick={handleConfirmPurchase} className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">Confirm Purchase</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecialOffers;

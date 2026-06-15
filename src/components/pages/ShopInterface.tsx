import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2, Sparkles, Gem, CreditCard } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import CelebrationModal from '../CelebrationModal';
import TokensDisplay from '../TokensDisplay';
import SellTotems from '../shop/SellTotems';
import UnboundTotems from '../shop/UnboundTotems';
import MarketToggle from '../shop/MarketToggle';
import MessageDialog from '../MessageDialog';
import { AFFINITY_ICONS, DOMAIN_ICONS, getSpeciesEmoji } from '../../utils/totems';
import React from 'react';
import SpecialOffers from '../shop/SpecialOffers';
import { AVAILABLE_SPECIES, CURRENCY_NAMES, IPFS_GATEWAY_URL, ESSENCE_COST } from '../../config/constants';
import { ESSENCE_EXCHANGE_BUNDLES, GEM_PACKAGES } from '../../config/shop-config';
import apiClient from '../../services/ApiClient';
import { Species, Rarity } from '../../types/types';
import { notificationService } from '../../services/NotificationService';
import { NotificationType } from '../../types/notifications';
import { getSpeciesName, getStageName, getTotemImageUrl } from '../../utils/species';

// Type for species from AVAILABLE_SPECIES
interface AvailableSpecies {
  id: number;
  name: string;
  species: Species;
  title: string;
  desc: string;
  locationId: number;
  affinity: string;
  domain: string;
  available: boolean;
  image: string;
}

// Exchange bundle type (from static config)
interface ExchangeBundle {
  id: string;
  name: string;
  gemCost: number;
  essenceAmount: number;
  bonus: number;
  bonusNote: string | null;
  popular?: boolean;
}

// Gem package type - for real money purchases
interface GemPackage {
  id: string;
  name: string;
  price: number;
  priceFormatted: string;
  gems: number;
  bonus: number;
  bonusFormatted: string | null;
}

// Build exchange bundles from bundled config (mapped to component's ExchangeBundle shape)
const MAPPED_EXCHANGE_BUNDLES: ExchangeBundle[] = ESSENCE_EXCHANGE_BUNDLES.map(item => ({
  id: item.id,
  name: item.label,
  gemCost: item.gems,
  essenceAmount: item.essence,
  bonus: item.bonus,
  bonusNote: item.bonusNote,
  popular: item.popular || false,
}));
const ENABLED_GEM_PACKAGES = GEM_PACKAGES.filter(pkg => pkg.enabled);

const ShopInterface = () => {
  const [activeTab, setActiveTab] = useState('specials');
  const [marketMode, setMarketMode] = useState<'browse' | 'sell'>('browse');
  const [exchangeLoading, setExchangeLoading] = useState<string | null>(null);
  const [purchasingGems, setPurchasingGems] = useState<string | null>(null);
  const [purchasingTotems, setPurchasingTotems] = useState<{[key: number]: boolean}>({});
  const [error, setError] = useState('');
  const { updateBalances, showError, showSuccess, canSpendEssence, canSpendGems, fetchTotems } = useUser();
  const { refreshAchievements } = useAchievements();
  const [purchasedTotem, setPurchasedTotem] = useState<any>(null);
  const availableSpecies = AVAILABLE_SPECIES;
  const canBuyTotem = canSpendEssence(ESSENCE_COST);

  // Exchange bundles and gem packages (from static config)
  const [exchangeBundles] = useState<ExchangeBundle[]>(MAPPED_EXCHANGE_BUNDLES);
  const [gemPackages] = useState<GemPackage[]>(ENABLED_GEM_PACKAGES);

  // Handle Stripe redirect return (Layer 1: belt — guaranteed sync on redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const purchaseStatus = params.get('purchase');

    if (purchaseStatus === 'success') {
      // Stripe checkout completed — refresh balance and show notification
      updateBalances();
      notificationService.showNotification(
        NotificationType.REWARD_CLAIMED,
        'Payment received! Your Gems have been added.',
        { source: 'stripe_redirect' }
      );
      showSuccess?.('Purchase Complete', 'Your Gems have been added to your account!');
      // Switch to currency tab so user sees their updated balance
      setActiveTab('currency');
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (purchaseStatus === 'cancelled') {
      showError('Purchase Cancelled', 'Your checkout was cancelled. No payment was made.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // Confirmation modal state for totem purchase
  const [selectedSpecies, setSelectedSpecies] = useState<AvailableSpecies | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Confirmation modal state for essence exchange
  const [pendingExchange, setPendingExchange] = useState<ExchangeBundle | null>(null);

  // Request exchange (shows confirmation modal)
  const handleRequestExchange = (bundle: ExchangeBundle) => {
    setPendingExchange(bundle);
  };

  // Cancel exchange confirmation
  const handleCancelExchange = () => {
    setPendingExchange(null);
  };

  // Confirm and execute exchange
  const handleConfirmExchange = async () => {
    if (!pendingExchange) return;

    const bundleId = pendingExchange.id;
    setPendingExchange(null);
    setExchangeLoading(bundleId);
    setError('');

    try {
      const response = await apiClient.exchangeGemsForEssence(bundleId);
      if (response.success && response.data) {
        await updateBalances();
        notificationService.showNotification(
          NotificationType.REWARD_CLAIMED,
          `Exchanged gems for ${response.data.essenceReceived.toLocaleString()} ${CURRENCY_NAMES.SOFT}!`,
          { gemsSpent: response.data.gemsSpent, essenceReceived: response.data.essenceReceived }
        );
        showSuccess?.("Exchange Complete", response.message || `Received ${response.data.essenceReceived.toLocaleString()} ${CURRENCY_NAMES.SOFT}!`);
      } else {
        const errorMsg = response.error?.message || 'Exchange failed';
        showError("Exchange Failed", errorMsg);
      }
    } catch (err: any) {
      showError("Error", err?.message || "Failed to exchange. Try again shortly.");
      console.error(err);
    } finally {
      setExchangeLoading(null);
    }
  };

  // Purchase Gems with real money via Stripe
  const handleBuyGems = async (packageId: string) => {
    setPurchasingGems(packageId);
    setError('');
    try {
      const response = await apiClient.purchaseGems(packageId);
      if (response.success && response.data) {
        if (response.data.sessionUrl) {
          // Redirect to Stripe checkout
          window.location.href = response.data.sessionUrl;
        } else if (response.data.isDev) {
          // Dev mode: direct fulfillment
          await updateBalances();
          notificationService.showNotification(
            NotificationType.REWARD_CLAIMED,
            `Purchased ${response.data.gemsAdded?.toLocaleString()} ${CURRENCY_NAMES.PREMIUM}!`,
            { gemsAdded: response.data.gemsAdded }
          );
          showSuccess?.("Purchase Complete", response.message || `Added ${response.data.gemsAdded?.toLocaleString()} Gems!`);
        }
      } else {
        const errorMsg = response.error?.message || 'Purchase failed';
        showError("Purchase Failed", errorMsg);
      }
    } catch (err: any) {
      showError("Error", err?.message || "Failed to purchase. Try again shortly.");
      console.error(err);
    } finally {
      setPurchasingGems(null);
    }
  };

  // Open confirmation modal for buying a totem
  const handleBuyClick = (species: AvailableSpecies) => {
      if (!species.available) return;
      setSelectedSpecies(species);
      setIsConfirmOpen(true);
  };

  // Web2: Purchase a new totem directly via REST API
  const handleConfirmPurchase = async () => {
      if (!selectedSpecies) return;

      const speciesId = selectedSpecies.id;
      setPurchasingTotems(prev => ({ ...prev, [speciesId]: true }));
      setError('');

      try {
          const response = await apiClient.purchaseNewTotem({ speciesId });

          if (response.success && response.data) {
              // Close confirmation modal
              setIsConfirmOpen(false);

              // Update balances, totems list, and achievements after purchase
              await updateBalances();
              await fetchTotems();
              await refreshAchievements();

              // Show notification for totem purchase
              const rarityName = Rarity[response.data.totem.rarityId] || 'Unknown';
              const speciesName = getSpeciesName(response.data.totem.speciesId);
              notificationService.showTotemPurchased({
                  tokenId: response.data.totem.id,
                  rarity: rarityName,
                  species: speciesName.charAt(0).toUpperCase() + speciesName.slice(1),
                  amount: response.data.cost?.toString(),
              });
              notificationService.processAchievementsFromResponse((response.data as any).achievements);

              // Show celebration modal with purchased totem
              const totemData = response.data.totem;
              setPurchasedTotem({
                  id: totemData.id,
                  name: totemData.speciesName || 'Totem',
                  image: getTotemImageUrl(totemData.speciesId, totemData.colorId, totemData.stage || 0),
                  innateTraitId: totemData.traits?.innate,
                  attributes: {
                      species: totemData.speciesId,
                      color: totemData.colorId,
                      rarity: totemData.rarityId,
                      displayName: getStageName(totemData.speciesId, totemData.colorId, totemData.stage || 0),
                      stage: totemData.stage,
                      domain: availableSpecies.find((s: any) => s.id === totemData.speciesId)?.domain || '',
                      ...totemData.stats,
                  },
              });
          } else {
              const errorMsg = response.error?.message || 'Failed to purchase totem';
              showError("Purchase Failed", errorMsg);
          }
      }
      catch (err: any) {
          const errorMsg = err?.message || "Failed to purchase totem. Try again shortly.";
          showError("Error", errorMsg);
          console.error(err);
      }
      finally {
          setPurchasingTotems(prev => ({ ...prev, [speciesId]: false }));
          setSelectedSpecies(null);
      }
  };

  // Tab selection styles
  const getTabStyle = (tabName: string) => 
    `px-2 py-2 font-semibold ${
      activeTab === tabName
        ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">

      {/* Welcome & Balance Area */}
      <div className="mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
              <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to the Shop</h1>
                  <p className="text-gray-600 dark:text-gray-400">Discover mystical totems and embark on your spirit journey.</p>
              </div>
              
              <TokensDisplay/>
          </div>
      </div>
        
      {/* Shop Container */}
      <div className="mt-6">

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setActiveTab('specials')} className={getTabStyle('specials')}>
            Specials
          </button>
          <button onClick={() => setActiveTab('totems')} className={getTabStyle('totems')}>
            Totems
          </button>
          <button onClick={() => setActiveTab('currency')} className={getTabStyle('currency')}>
            Currency
          </button>
          <button onClick={() => setActiveTab('market')} className={getTabStyle('market')}>
            Market
          </button>
        </div>

        {/* Content Area */}
        <div className="pt-6">
          {/* Totems Shop */}
          {activeTab === 'totems' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Totem Sanctuary</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Discover young mystical companions waiting for a new keeper. 
                  These totems range in color and rarity, from common to legendary, based on achievement progression, and is determined randomly. 
                  Your new totem will begin their journey at stage 1, and requires dedicated care, training, and love to unlock their full potential.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availableSpecies.map((species) => {
                  const disabledBuyButton = !species.available || purchasingTotems[species.id] || !canBuyTotem;
                  return (
                  <div 
                    key={species.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col
                      ${species.available ? '' : 'opacity-75'}`}
                  >
                    {/* Totem Image */}
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                        {species.image ? (
                            <img
                                src={species.image.replace('ipfs://', IPFS_GATEWAY_URL)}
                                alt={species.name}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-6xl text-gray-400 dark:text-gray-500">
                              <span className="text-6xl">{getSpeciesEmoji(species.species)}</span>
                            </div>
                        )}
                      </div>
                      {!species.available && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 dark:bg-opacity-60">
                          <div className="bg-gray-800 dark:bg-gray-700 text-white px-3 py-1 rounded-full flex items-center">
                            <Lock className="w-4 h-4 mr-1" />
                            Coming Soon
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Totem Info */}
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg dark:text-gray-200">{species.name}</h3>
                        <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded">
                          {ESSENCE_COST} {CURRENCY_NAMES.SOFT}
                        </span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        <b>{species.title}</b>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {species.desc}
                      </p>

                      <div className="mt-auto">
                        {/* Affinity & Domain */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-1.5">
                                {/* Affinity */}
                                <div className="p-1 rounded-md bg-yellow-50 dark:bg-yellow-900/20">
                                    {React.createElement(AFFINITY_ICONS[species.affinity as keyof typeof AFFINITY_ICONS], {
                                        size: 14,
                                        className: "text-yellow-600 dark:text-yellow-400"
                                    })}
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {species.affinity}
                                </span>
                            </div>
                            
                            <span className="text-gray-300 dark:text-gray-600">•</span>
                            
                            {/* Domain */}
                            <div className="flex items-center gap-1.5">
                                <div className="p-1 rounded-md bg-cyan-50 dark:bg-cyan-900/20">
                                    {React.createElement(DOMAIN_ICONS[species.domain as keyof typeof DOMAIN_ICONS], {
                                        size: 14,
                                        className: "text-cyan-600 dark:text-cyan-400"
                                    })}
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    {species.domain}
                                </span>
                            </div>
                        </div>
                        
                        <button
                          onClick={() => handleBuyClick(species)}
                          disabled={disabledBuyButton}
                          className={`w-full py-2 px-4 rounded font-semibold
                            ${species.available
                              ? 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {purchasingTotems[species.id] ? 'Purchasing...' :
                          (species.available ? 'Buy Totem' : 'Coming Soon')}
                        </button>
                      </div>
                    </div>
                  </div>
                )})}
                {/* Purchase Confirmation Modal */}
                <MessageDialog
                    title="Confirm Purchase"
                    isOpen={isConfirmOpen}
                    showDismiss={false}
                    onClose={() => {
                        setIsConfirmOpen(false);
                        setSelectedSpecies(null);
                    }}
                >
                    <div className="space-y-4">
                        <div className="text-gray-600 dark:text-gray-300">
                            <p className="mb-4">
                                Are you sure you want to purchase a new{' '}
                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                    {selectedSpecies?.name}
                                </span>{' '}
                                totem?
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {ESSENCE_COST.toLocaleString()} {CURRENCY_NAMES.SOFT}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Your new totem will have a random color and rarity based on your achievements.
                                It will start at Stage 1 and can be evolved through care and training.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setIsConfirmOpen(false);
                                    setSelectedSpecies(null);
                                }}
                                disabled={selectedSpecies ? purchasingTotems[selectedSpecies.id] : false}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100
                                    hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600
                                    rounded font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPurchase}
                                disabled={selectedSpecies ? purchasingTotems[selectedSpecies.id] : true}
                                className="px-4 py-2 bg-purple-600 text-white rounded font-medium
                                    hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600
                                    transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {selectedSpecies && purchasingTotems[selectedSpecies.id] ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Purchasing...
                                    </>
                                ) : (
                                    'Confirm Purchase'
                                )}
                            </button>
                        </div>
                    </div>
                </MessageDialog>
              </div>
            </div>
          )}

          {/* Specials Tab */}
          {activeTab === 'specials' && (
            <SpecialOffers onPurchased={setPurchasedTotem} />
          )}

          {/* Currency Tab — Gems + Essence stacked */}
          {activeTab === 'currency' && (
            <div className="space-y-6">
              {/* Buy Gems with Real Money (Stripe) */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Buy {CURRENCY_NAMES.PREMIUM}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Purchase {CURRENCY_NAMES.PREMIUM} with your credit card. {CURRENCY_NAMES.PREMIUM} can be exchanged for {CURRENCY_NAMES.SOFT} or used to buy special bundles. Payments are processed securely via Stripe.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  By completing this purchase you agree this is a digital item delivered immediately, and that it is{' '}
                  <Link to="/terms" className="text-purple-600 dark:text-purple-400 hover:underline">
                    non-refundable
                  </Link>{' '}
                  once delivery begins, except where required by law.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {gemPackages.map((pkg) => {
                    const isPopular = pkg.name.toLowerCase().includes('popular');
                    const isBestValue = pkg.name.toLowerCase().includes('best');
                    return (
                      <div
                        key={pkg.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg border shadow-sm relative flex flex-col
                          ${isPopular || isBestValue
                            ? 'border-purple-500 dark:border-purple-700 border-2'
                            : 'border-gray-200 dark:border-gray-700'}`}
                      >
                        {(isPopular || isBestValue) && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                              {isBestValue ? 'Best Value' : 'Popular'}
                            </span>
                          </div>
                        )}
                        <div className="p-6 flex flex-col flex-1">
                          <div className="text-center mb-4 flex-1">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Gem className="w-6 h-6 text-purple-500" />
                              <h3 className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                                {pkg.gems.toLocaleString()}
                              </h3>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{pkg.name}</p>
                            {pkg.bonusFormatted && (
                              <span className="inline-block mt-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded">
                                {pkg.bonusFormatted}
                              </span>
                            )}
                          </div>
                          <div className="text-center mb-4">
                            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                              {pkg.priceFormatted}
                            </span>
                          </div>
                          <button
                            onClick={() => handleBuyGems(pkg.id)}
                            disabled={purchasingGems === pkg.id}
                            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold
                              hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600
                              disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
                          >
                            {purchasingGems === pkg.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4" />
                                Buy Now
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              {/* Divider between Gems and Essence */}
              <div className="border-t border-gray-200 dark:border-gray-700" />

              {/* Essence Exchange (Gems → Essence) */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{CURRENCY_NAMES.SOFT} Vault</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Exchange your {CURRENCY_NAMES.PREMIUM} for {CURRENCY_NAMES.SOFT}. Larger exchanges include bonus {CURRENCY_NAMES.SOFT}!
                  This is an instant digital exchange - no additional charges apply.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {exchangeBundles.map((bundle, index) => {
                    const isPopular = bundle.popular || index === 1;
                    const canAfford = canSpendGems(bundle.gemCost);
                    return (
                      <div
                        key={bundle.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg border shadow-sm relative flex flex-col
                          ${isPopular
                            ? 'border-yellow-500 dark:border-yellow-700 border-2'
                            : 'border-gray-200 dark:border-gray-700'}`}
                      >
                        {isPopular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                              Popular
                            </span>
                          </div>
                        )}
                        <div className="p-6 flex flex-col flex-1">
                          <div className="text-center mb-4 flex-1">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Sparkles className="w-6 h-6 text-yellow-500" />
                              <h3 className="font-bold text-2xl text-gray-900 dark:text-gray-100">
                                {bundle.essenceAmount.toLocaleString()}
                              </h3>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">{bundle.name}</p>
                            {bundle.bonusNote && (
                              <span className="inline-block mt-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-0.5 rounded">
                                {bundle.bonusNote}
                              </span>
                            )}
                          </div>
                          <div className="text-center mb-4">
                            <div className="flex items-center justify-center gap-1">
                              <Gem className="w-5 h-5 text-purple-500" />
                              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {bundle.gemCost.toLocaleString()}
                              </span>
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{CURRENCY_NAMES.PREMIUM}</span>
                          </div>
                          <button
                            onClick={() => handleRequestExchange(bundle)}
                            disabled={exchangeLoading === bundle.id || !canAfford}
                            className={`w-full py-3 px-4 rounded-lg font-semibold
                              flex items-center justify-center gap-2 mt-auto
                              ${canAfford
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500'
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}
                              disabled:opacity-50`}
                          >
                            {exchangeLoading === bundle.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Exchanging...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                {canAfford ? 'Exchange' : 'Not Enough Gems'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              {error && (
                <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Market Tab — Browse/Sell toggle */}
          {activeTab === 'market' && (
            <div className="space-y-6">
              <MarketToggle mode={marketMode} onModeChange={setMarketMode} />
              {marketMode === 'browse' ? (
                <UnboundTotems />
              ) : (
                <SellTotems />
              )}
            </div>
          )}
        </div>

      </div>

      {/* Celebration Modal (top-level so it works from any tab/section) */}
      {purchasedTotem && (
        <CelebrationModal
          type="purchase"
          totem={purchasedTotem}
          innateTraitId={purchasedTotem.innateTraitId}
          onClose={() => setPurchasedTotem(null)}
        />
      )}

      {/* Exchange Confirmation Modal */}
      {pendingExchange && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Confirm Exchange
              </h3>
              <button
                onClick={handleCancelExchange}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Exchange <strong>{pendingExchange.gemCost.toLocaleString()} {CURRENCY_NAMES.PREMIUM}</strong> for{' '}
                <strong>{pendingExchange.essenceAmount.toLocaleString()} {CURRENCY_NAMES.SOFT}</strong>?
              </p>

              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">You spend:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                    <Gem className="w-4 h-4" />
                    {pendingExchange.gemCost.toLocaleString()} {CURRENCY_NAMES.PREMIUM}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">You receive:</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    {pendingExchange.essenceAmount.toLocaleString()} {CURRENCY_NAMES.SOFT}
                  </span>
                </div>
                {pendingExchange.bonusNote && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bonus:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {pendingExchange.bonusNote}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                This exchange is instant and cannot be reversed.
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelExchange}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                  font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExchange}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white
                  rounded-lg font-medium transition-colors dark:bg-yellow-600 dark:hover:bg-yellow-500"
              >
                Confirm Exchange
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopInterface;

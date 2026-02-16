import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Key, Award, Crown, Check, Shield, ArrowRight, Sparkles, Gem, Star, Loader2, CheckCircle, XCircle } from "lucide-react";
import { CURRENCY_NAMES } from '../../config/constants';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/ApiClient';

const Plans = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  // Check for return from Stripe checkout
  useEffect(() => {
    const subParam = searchParams.get('subscription');
    if (subParam === 'success') {
      setSuccessMessage('Subscription activated! Welcome to your new plan.');
      // Refresh subscription status
      fetchSubscriptionStatus();
      // Clean URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (subParam === 'cancelled') {
      setErrorMessage('Checkout was cancelled. No charges were made.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  // Fetch subscription status for logged-in users
  const fetchSubscriptionStatus = async () => {
    if (!isAuthenticated) return;
    const response = await apiClient.getSubscriptionStatus();
    if (response.success && response.data) {
      setCurrentTier(response.data.tier || 'free');
      setCancelAtPeriodEnd(response.data.subscription?.cancelAtPeriodEnd || false);
      setCurrentPeriodEnd(response.data.subscription?.currentPeriodEnd || null);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [isAuthenticated]);

  const handleGetStarted = async (plan: string) => {
    if (!isAuthenticated) {
      // Not logged in - redirect to signup
      localStorage.setItem(
        "signupState",
        JSON.stringify({ step: "connect", plan })
      );
      navigate("/signup");
      return;
    }

    if (plan === 'free') return; // Already free
    if (plan === currentTier) return; // Already on this plan

    // Logged in - initiate Stripe checkout
    setSubscribing(plan);
    setErrorMessage(null);
    try {
      const response = await apiClient.createSubscriptionCheckout(plan as 'premium' | 'vip');
      if (response.success && response.data) {
        if (response.data.sessionUrl) {
          window.location.href = response.data.sessionUrl;
        } else if (response.data.devMode) {
          setSuccessMessage(response.data.message || `Upgraded to ${plan}!`);
          setCurrentTier(plan);
        }
      } else {
        setErrorMessage(response.error?.message || 'Failed to start checkout');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to start checkout');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    setErrorMessage(null);
    try {
      const response = await apiClient.cancelSubscription();
      if (response.success && response.data) {
        setCancelAtPeriodEnd(true);
        setCurrentPeriodEnd(response.data.currentPeriodEnd || null);
        setSuccessMessage(response.data.message || 'Subscription will cancel at end of billing period');
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
        setCancelAtPeriodEnd(false);
        setSuccessMessage(response.data.message || 'Subscription reactivated');
      } else {
        setErrorMessage(response.error?.message || 'Failed to reactivate');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reactivate');
    } finally {
      setReactivating(false);
    }
  };

  const getButtonLabel = (plan: string) => {
    if (!isAuthenticated) {
      if (plan === 'free') return 'Get Started Free';
      if (plan === 'premium') return 'Go Premium';
      return 'Go VIP';
    }
    if (plan === currentTier) return 'Current Plan';
    if (plan === 'free') return 'Current Plan';
    if (subscribing === plan) return 'Redirecting...';
    return plan === 'premium' ? 'Subscribe to Premium' : 'Subscribe to VIP';
  };

  const isButtonDisabled = (plan: string) => {
    if (!isAuthenticated) return false;
    if (plan === currentTier) return true;
    if (plan === 'free' && currentTier === 'free') return true;
    if (subscribing) return true;
    return false;
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
        {/* Success/Error banners */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-green-700 dark:text-green-400">{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="ml-auto text-green-500 hover:text-green-700">&times;</button>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
            <XCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
          </div>
        )}

        {/* Active subscription status */}
        {isAuthenticated && currentTier !== 'free' && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center">
                <Crown className="h-5 w-5 text-purple-500 mr-2" />
                <span className="font-medium text-purple-700 dark:text-purple-400">
                  You are on the <strong className="capitalize">{currentTier}</strong> plan
                  {cancelAtPeriodEnd && currentPeriodEnd && (
                    <span className="text-amber-600 dark:text-amber-400 ml-2">
                      (cancels {new Date(currentPeriodEnd).toLocaleDateString()})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex gap-2">
                {cancelAtPeriodEnd ? (
                  <button
                    onClick={handleReactivate}
                    disabled={reactivating}
                    className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {reactivating ? 'Reactivating...' : 'Reactivate Subscription'}
                  </button>
                ) : (
                  <button
                    onClick={handleCancel}
                    disabled={canceling}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {canceling ? 'Canceling...' : 'Cancel Subscription'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Header section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Select the plan that best fits your gaming style. Start free and
            upgrade anytime to unlock premium features.
          </p>
        </div>

        {/* Plans section */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Free Plan */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col ${
            currentTier === 'free' && isAuthenticated
              ? 'border-2 border-green-500 dark:border-green-400'
              : 'border border-gray-200 dark:border-gray-700'
          }`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2 mt-6">
                <Key className="h-6 w-6 text-green-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Free
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Full access for all players
              </p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $0
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  /forever
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No credit card required
              </div>
            </div>
            <div className="p-6 flex-grow">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Access to all TotemBound games
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Collect unique spirit totems
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Train and evolve companions
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Daily challenges and rewards
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Expeditions and achievements
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Earn {CURRENCY_NAMES.SOFT} currency
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Community support
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => handleGetStarted("free")}
                disabled={isButtonDisabled("free")}
                className="w-full py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-default"
              >
                {isAuthenticated && currentTier === 'free' ? 'Current Plan' : 'Get Started Free'}
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col relative ${
            currentTier === 'premium' && isAuthenticated
              ? 'border-2 border-purple-500 dark:border-purple-400'
              : 'border-2 border-purple-500 dark:border-purple-400'
          }`}>
            <div className="absolute top-0 left-0 right-0 text-center">
              <span className="bg-purple-600 text-white px-4 py-1 rounded-b-lg text-sm font-medium inline-block">
                {currentTier === 'premium' && isAuthenticated ? 'Your Plan' : 'Most Popular'}
              </span>
            </div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-700 mt-6">
              <div className="flex items-center mb-2">
                <Award className="h-6 w-6 text-purple-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Premium
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Enhanced experience for active players
              </p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $5
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  /month
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Cancel anytime
              </div>
            </div>
            <div className="p-6 flex-grow">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Everything in Free tier
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    <Sparkles className="h-4 w-4 inline text-yellow-500 mr-1" />
                    500 bonus {CURRENCY_NAMES.SOFT} monthly
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    <Gem className="h-4 w-4 inline text-purple-500 mr-1" />
                    100 bonus {CURRENCY_NAMES.PREMIUM} monthly
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Exclusive premium totems
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    2x daily reward bonuses
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Ad-free experience
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Priority support
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-purple-50 dark:bg-purple-900/20">
              <button
                onClick={() => handleGetStarted("premium")}
                disabled={isButtonDisabled("premium")}
                className="w-full py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-default"
              >
                {subscribing === 'premium' && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                <span>{getButtonLabel("premium")}</span>
                {!subscribing && !isButtonDisabled("premium") && <ArrowRight className="ml-2 h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* VIP Plan */}
          <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col relative ${
            currentTier === 'vip' && isAuthenticated
              ? 'border-2 border-amber-500 dark:border-amber-400'
              : 'border-2 border-amber-500 dark:border-amber-400'
          }`}>
            <div className="absolute top-0 left-0 right-0 text-center">
              <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-4 py-1 rounded-b-lg text-sm font-medium inline-block">
                {currentTier === 'vip' && isAuthenticated ? 'Your Plan' : 'Best Value'}
              </span>
            </div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-700 mt-6">
              <div className="flex items-center mb-2">
                <Crown className="h-6 w-6 text-amber-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  VIP
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Ultimate experience for dedicated players
              </p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $15
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  /month
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Cancel anytime
              </div>
            </div>
            <div className="p-6 flex-grow">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-amber-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Everything in Premium tier
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-amber-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    <Sparkles className="h-4 w-4 inline text-yellow-500 mr-1" />
                    1,500 bonus {CURRENCY_NAMES.SOFT} monthly
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-amber-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    <Gem className="h-4 w-4 inline text-purple-500 mr-1" />
                    500 bonus {CURRENCY_NAMES.PREMIUM} monthly
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-amber-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    <Star className="h-4 w-4 inline text-amber-500 mr-1" />
                    VIP-exclusive totems
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-amber-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    3x daily reward bonuses
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-amber-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    VIP badge & cosmetics
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-amber-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Early access to new features
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-amber-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Exclusive Discord channel
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20">
              <button
                onClick={() => handleGetStarted("vip")}
                disabled={isButtonDisabled("vip")}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-default"
              >
                {subscribing === 'vip' && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {!subscribing && <Crown className="mr-2 h-5 w-5" />}
                <span>{getButtonLabel("vip")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mb-16 overflow-x-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Compare Plans
          </h2>
          <table className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-6 py-4 text-left text-gray-700 dark:text-gray-300 font-semibold">Feature</th>
                <th className="px-6 py-4 text-center text-green-600 dark:text-green-400 font-semibold">Free</th>
                <th className="px-6 py-4 text-center text-purple-600 dark:text-purple-400 font-semibold">Premium</th>
                <th className="px-6 py-4 text-center text-amber-600 dark:text-amber-400 font-semibold">VIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Monthly {CURRENCY_NAMES.SOFT} Bonus</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center text-gray-700 dark:text-gray-300">500</td>
                <td className="px-6 py-3 text-center text-gray-700 dark:text-gray-300 font-medium">1,500</td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Monthly {CURRENCY_NAMES.PREMIUM} Bonus</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center text-gray-700 dark:text-gray-300">100</td>
                <td className="px-6 py-3 text-center text-gray-700 dark:text-gray-300 font-medium">500</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Daily Reward Multiplier</td>
                <td className="px-6 py-3 text-center text-gray-700 dark:text-gray-300">1x</td>
                <td className="px-6 py-3 text-center text-gray-700 dark:text-gray-300">2x</td>
                <td className="px-6 py-3 text-center text-gray-700 dark:text-gray-300 font-medium">3x</td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Exclusive Totems</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center"><Check className="h-5 w-5 text-purple-500 mx-auto" /></td>
                <td className="px-6 py-3 text-center"><Check className="h-5 w-5 text-amber-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">VIP-Only Totems</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center"><Check className="h-5 w-5 text-amber-500 mx-auto" /></td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Ad-Free Experience</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center"><Check className="h-5 w-5 text-purple-500 mx-auto" /></td>
                <td className="px-6 py-3 text-center"><Check className="h-5 w-5 text-amber-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">VIP Badge & Cosmetics</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center"><Check className="h-5 w-5 text-amber-500 mx-auto" /></td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Early Access</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center"><Check className="h-5 w-5 text-amber-500 mx-auto" /></td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Exclusive Discord Channel</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center"><Check className="h-5 w-5 text-amber-500 mx-auto" /></td>
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700/50">
                <td className="px-6 py-3 text-gray-600 dark:text-gray-300">Priority Support</td>
                <td className="px-6 py-3 text-center text-gray-500 dark:text-gray-400">-</td>
                <td className="px-6 py-3 text-center"><Check className="h-5 w-5 text-purple-500 mx-auto" /></td>
                <td className="px-6 py-3 text-center"><Check className="h-5 w-5 text-amber-500 mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FAQ section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                What is the difference between the tiers?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>Free</strong> gives you full access to all core gameplay.
                <strong> Premium</strong> ($5/mo) adds 500 {CURRENCY_NAMES.SOFT} + 100 {CURRENCY_NAMES.PREMIUM} monthly, 2x daily rewards, exclusive totems, and an ad-free experience.
                <strong> VIP</strong> ($15/mo) includes everything in Premium plus 1,500 {CURRENCY_NAMES.SOFT} + 500 {CURRENCY_NAMES.PREMIUM} monthly, 3x daily rewards, VIP-exclusive totems, special cosmetics, early access to new features, and an exclusive Discord channel.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                What are {CURRENCY_NAMES.SOFT} and {CURRENCY_NAMES.PREMIUM}?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                <strong>{CURRENCY_NAMES.SOFT}</strong> is TotemBound's soft currency that you earn through
                gameplay - daily logins, challenges, expeditions, and achievements.
                Use it to feed and train your totems, buy items, and more.
                <strong> {CURRENCY_NAMES.PREMIUM}</strong> are a premium currency used for special purchases, rare items, and to speed up certain activities.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade at any time from your account
                settings. When upgrading, you'll get immediate access to new benefits.
                When downgrading, you'll retain your current tier benefits until
                the end of your billing period. Your totems and progress are never affected.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We occasionally offer free trial periods for Premium and VIP tiers.
                Follow us on social media or check your in-game notifications for
                promotional offers. You can also start with the Free tier and upgrade
                whenever you're ready.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Security section */}
        <div className="mt-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Secure Payments
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            All payments are processed securely through Stripe. <br/>
            Your payment information is encrypted and never stored on our servers.
          </p>

          <div className="flex justify-center mt-6 space-x-6">
            <img src="/images/stripe.png" alt="Stripe" className="h-8" />
            <img
              src="/images/visa-mastercard-amex.png"
              alt="Credit Cards"
              className="h-8"
            />
            <img
              src="/images/gpay-apay.png"
              alt="Google Pay / Apple Pay"
              className="h-8"
            />
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      {!isAuthenticated && (
        <div className="bg-purple-700 dark:bg-purple-900 rounded-lg mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center md:text-left">
            <div className="md:flex md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Ready to start your journey?
                </h2>
                <p className="text-purple-200">
                  Join thousands of players in the mystical world of TotemBound
                  today.
                </p>
              </div>
              <div className="mt-6 md:mt-0">
                <button
                  onClick={() => handleGetStarted("free")}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-purple-700 bg-white hover:bg-purple-50"
                >
                  Get Started For Free
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Award, CheckCircle, Key, Loader2, Zap } from 'lucide-react';
import MessageDialog from './MessageDialog';
import { TIER_TYPES } from '../config/constants';

interface PremiumSignupProps {
    onCheckout?: () => void;
}

interface PricingTier {
    type: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    buttonText: string;
    highlight?: boolean;
}

const getAccountTypeName = (accountType: string) => {
    switch (accountType) {
        case TIER_TYPES.premium:
            return 'Mystic';
        case TIER_TYPES.advanced:
            return 'Elder';
        default: // Free
            return 'Seeker';
    }
}

const getAccountTypeColor = (accountType: string) => {
    switch (accountType) {
        case TIER_TYPES.premium:
            return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
        case TIER_TYPES.advanced:
            return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
        default: // Free
            return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    }
}

const PremiumSignup: React.FC<PremiumSignupProps> = ({ onCheckout }) => {
    const { address, accountType, setGaslessEnabled, setGaslessApiKey, showError, gaslessApiKey } = useUser();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingDowngrade, setPendingDowngrade] = useState(false);
    const [showAdvancedConfirmDialog, setShowAdvancedConfirmDialog] = useState(false);
    const [pendingAdvancedSwitch, setPendingAdvancedSwitch] = useState(false);

    const API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'https://api.totembound.com/v1';

    // Define pricing tiers
    const pricingTiers: PricingTier[] = [
        {
            type: TIER_TYPES.free,
            name: 'Free Tier',
            price: 0,
            description: 'Entry-level access for casual players',
            features: [
                'Sponsored transactions',
                '50 transactions per day',
                '5 transactions per minute',
                'Standard transaction priority'
            ],
            buttonText: accountType === TIER_TYPES.free ? 'Current Plan' : accountType === TIER_TYPES.advanced ? 'Get Free API Key' : 'Downgrade',
        },
        {
            type: TIER_TYPES.premium,
            name: 'Premium Tier',
            price: 10.00,
            description: 'Enhanced transaction service for active players',
            features: [
                'Enhanced transactions',
                '1000 transactions per day',
                '30 transactions per minute',
                'Priority transaction processing',
                'Exclusive game features access',
                'Monthly bonus credits',
                'Premium support'
            ],
            buttonText: accountType === TIER_TYPES.premium ? 'Current Plan' : 'Upgrade Now',
            highlight: true
        },
        {
            type: TIER_TYPES.advanced,
            name: 'Advanced Tier',
            price: 0,
            description: 'Self-managed option for advanced users',
            features: [
                'Standard network fees apply',
                'No transaction limits',
                'Direct transaction management',
                'Support for advanced wallet features',
                'Advanced user experience'
            ],
            buttonText: accountType === TIER_TYPES.advanced ? 'Current Plan' : 'Switch to Advanced',
        }
    ];

    // Initiate checkout process
    const handleCheckout = async (tierType: string) => {
        if (!address) {
            setError('Please connect your wallet first');
            return;
        }

        if (tierType === TIER_TYPES.free && accountType === TIER_TYPES.free) {
            return; // Already on free plan
        }

        if (tierType === TIER_TYPES.premium && accountType === TIER_TYPES.premium) {
            return; // Already on premium plan
        }

        if (tierType === TIER_TYPES.free && accountType === TIER_TYPES.advanced) {
            // redirect to get free api key
            navigate('/account/api-key');
            return;
        }

        // Email validation ONLY if upgrading to Premium
        // Skip email validation for downgrade and Advanced mode
        if (tierType === TIER_TYPES.premium && accountType !== TIER_TYPES.premium) {
            if (!email || !email.includes('@')) {
                showError('Field Error', 'Please enter a valid email address');
                return;
            }
        }
        
        setIsLoading(true);
        setError(null);

        try {
            if (tierType === TIER_TYPES.free && accountType === TIER_TYPES.premium) {
                setShowConfirmDialog(true);
                setPendingDowngrade(true);
                return;
            }

            if (tierType === TIER_TYPES.advanced) {
                setShowAdvancedConfirmDialog(true);
                setPendingAdvancedSwitch(true);
                return;
            }

            // Handle premium upgrade - redirect to Stripe checkout
            const response = await fetch(`${API_GATEWAY_URL}/stripe/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    walletAddress: address,
                    tier: TIER_TYPES.premium
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to create checkout session');
            }

            const { sessionUrl } = await response.json();

            // Redirect to Stripe checkout
            window.location.href = sessionUrl;

            if (onCheckout) onCheckout();
        }
        catch (err) {
            console.error('Error during checkout process:', err);
            setError((err as Error).message || 'An unexpected error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };

    const handleConfirmDowngrade = async () => {
        setIsLoading(true);
        setShowConfirmDialog(false);
        
        try {
            // Call API to cancel subscription
            const response = await fetch(`${API_GATEWAY_URL}/subscription`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': gaslessApiKey || ''
                }
            });
    
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to cancel subscription');
            }
    
            const responseData = await response.json();
            
            // Format the end date for display
            const endDate = responseData.currentPeriodEnd ? 
                new Date(responseData.currentPeriodEnd).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 'the end of your current billing period';
    
            showError(
                "Subscription Cancelled", 
                `Your subscription has been cancelled. Your Premium API key will remain active until ${endDate}, after which you'll be automatically switched to the Free plan.`
            );
    
            // Navigate to account settings to show the updated status
            setTimeout(() => {
                navigate('/account/settings');
            }, 3000);
        }
        catch (err) {
            console.error('Error during downgrade process:', err);
            setError((err as Error).message || 'An unexpected error occurred');
        }
        finally {
            setIsLoading(false);
            setPendingDowngrade(false);
        }
    };

    const handleConfirmAdvancedSwitch = async () => {
        setIsLoading(true);
        setShowAdvancedConfirmDialog(false);
        
        try {
            // Update user settings to disable gasless and clear API key
            setGaslessEnabled(false);
            setGaslessApiKey('');
    
            showError(
                "Mode Changed", 
                "Your account has been switched to Advanced mode. You will now pay for your own transaction fees."
            );
        }
        catch (err) {
            console.error('Error switching to Advanced mode:', err);
            setError((err as Error).message || 'An unexpected error occurred');
        }
        finally {
            setIsLoading(false);
            setPendingAdvancedSwitch(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-900 rounded-lg">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
                Choose Your Plan
            </h2>

            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Select the plan that best fits your gaming style. Each tier offers different transaction capabilities
                to enhance your TotemBound experience.
            </p>

            {error && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
                    {error}
                </div>
            )}

            {/* Email input for premium signup */}
            <div className="mb-6 max-w-md mx-auto">
                <label htmlFor="premium-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                </label>
                <input
                    id="premium-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    We'll send your API key to this email
                </p>
            </div>

            {/* Pricing comparison */}
            <div className="grid md:grid-cols-3 gap-6">
                {pricingTiers.map((tier) => (
                    <div
                        key={tier.type}
                        className={`border rounded-lg p-6 ${tier.highlight
                            ? 'border-purple-500 dark:border-purple-400 relative'
                            : 'border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        {tier.highlight && (
                            <div className="absolute top-0 left-0 right-0 text-center -mt-3">
                                <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium inline-block">
                                    Recommended
                                </span>
                            </div>
                        )}

                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 min-h-[2rem] flex items-center">
                                    {tier.type === TIER_TYPES.free && (
                                        <Key className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                    )}
                                    {tier.type === TIER_TYPES.premium && (
                                        <Award className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                                    )}
                                    {tier.type === TIER_TYPES.advanced && (
                                        <Zap className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                                    )}
                                    {tier.name}
                                </h3>
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${getAccountTypeColor(tier.type)}`}>
                                    {getAccountTypeName(tier.type)}
                                </span>
                            </div>
                            <div className="mb-4">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">${tier.price}</span>
                                {tier.price > 0 && <span className="text-gray-500 dark:text-gray-400">/month</span>}
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {tier.description}
                            </p>

                            <ul className="space-y-3 mb-6">
                                {tier.features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto">
                                <button
                                    onClick={() => handleCheckout(tier.type)}
                                    disabled={isLoading || (tier.type === accountType)}
                                    className={`w-full py-2 rounded-md text-center font-medium 
                                        ${tier.highlight
                                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                            : 'bg-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                                        }
                                        ${isLoading || (tier.type === accountType)
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                        }`}
                                >
                                    {isLoading ? 'Processing...' : tier.buttonText}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <p>Have questions about our plans?</p>
                <a href="/support" className="text-purple-600 hover:text-purple-800 dark:text-purple-400 font-medium">
                    Contact our support team
                </a>
            </div>


            {/* Downgrade Confirmation Dialog */}
            <MessageDialog
                title="Confirm Downgrade"
                isOpen={showConfirmDialog}
                showDismiss={false}
                onClose={() => {
                    setShowConfirmDialog(false);
                    setPendingDowngrade(false);
                }}
            >
                <p className="mb-4">
                    Are you sure you want to downgrade to the Free plan?
                </p>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                    Your subscription will be cancelled and you'll still have Premium access until the end of your current billing period. After that, your account will be downgraded to the Free tier.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => {
                            setShowConfirmDialog(false);
                            setPendingDowngrade(false);
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmDowngrade}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                Processing...
                            </span>
                        ) : (
                            'Downgrade to Free'
                        )}
                    </button>
                </div>
            </MessageDialog>

            {/* Advanced Confirmation Dialog */}
            <MessageDialog
                title="Switch to Advanced Mode"
                isOpen={showAdvancedConfirmDialog}
                showDismiss={false}
                onClose={() => {
                    setShowAdvancedConfirmDialog(false);
                    setPendingAdvancedSwitch(false);
                }}
            >
                <p className="mb-4">
                    Are you sure you want to switch to Advanced mode?
                </p>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                    In Advanced mode, you'll need to pay network fees directly from your wallet. Your API key will be deactivated and you'll have full control over your transactions.
                </p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => {
                            setShowAdvancedConfirmDialog(false);
                            setPendingAdvancedSwitch(false);
                        }}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmAdvancedSwitch}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                Processing...
                            </span>
                        ) : (
                            'Switch to Advanced'
                        )}
                    </button>
                </div>
            </MessageDialog>
        </div>
    );
};

export default PremiumSignup;
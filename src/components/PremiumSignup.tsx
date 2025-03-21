import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { CheckCircle, Crown, Shield, WalletCards } from 'lucide-react';

interface PremiumSignupProps {
    onCheckout?: () => void;
}

interface PricingTier {
    id: string;
    name: string;
    price: number;
    description: string;
    features: string[];
    buttonText: string;
    highlight?: boolean;
}

const getAccountTypeName = (accountType: string) => {
    switch (accountType.toLowerCase()) {
        case 'premium':
            return 'Mystic';
        case 'web3':
            return 'Elder';
        default: // Free
            return 'Seeker';
    }
}

const getAccountTypeColor = (accountType: string) => {
    switch (accountType.toLowerCase()) {
        case 'premium':
            return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
        case 'web3':
            return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
        default: // Free
            return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    }
}

const PremiumSignup: React.FC<PremiumSignupProps> = ({ onCheckout }) => {
    const { address, accountType, setGaslessEnabled, setGaslessApiKey, showError } = useUser();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'https://api.totembound.com/v1';

    // Define pricing tiers
    const pricingTiers: PricingTier[] = [
        {
            id: 'free',
            name: 'Free',
            price: 0,
            description: 'Basic gasless transactions for casual players',
            features: [
                'Basic gasless transactions',
                '50 transactions per day',
                '5 transactions per minute',
                'Standard transaction priority'
            ],
            buttonText: accountType === 'Free' ? 'Current Plan' : accountType === 'Web3' ? 'Get Free API Key' : 'Downgrade',
        },
        {
            id: 'premium',
            name: 'Premium',
            price: 9.99,
            description: 'Premium gasless experience for active players',
            features: [
                'Enhanced gasless transactions',
                '1000 transactions per day',
                '30 transactions per minute',
                'Priority transaction processing',
                'Claim 1000 TOTEM monthly',
                'Exclusive game features access',
                'Premium support'
            ],
            buttonText: accountType === 'Premium' ? 'Current Plan' : 'Upgrade Now',
            highlight: true
        },
        {
            id: 'web3',
            name: 'Web3',
            price: 0,
            description: 'For players who prefer to handle their own transactions',
            features: [
                'Pay your own gas fees directly',
                'No transaction limits',
                'Full control over your transactions',
                'Support the platform ecosystem',
                'Advanced user experience'
            ],
            buttonText: accountType === 'Web3' ? 'Current Plan' : 'Switch to Web3',
        }
    ];

    // Initiate checkout process
    const handleCheckout = async (tierId: string) => {
        if (!address) {
            setError('Please connect your wallet first');
            return;
        }

        // Special handling for Web3 option
        if (tierId === 'web3') {
            // No need for email validation for Web3 option
            setIsLoading(true);
            setError(null);

            try {
                // Update user settings to disable gasless and clear API key
                setGaslessEnabled(false);
                setGaslessApiKey('');

                showError(
                    "Mode Changed", 
                    "Your account has been switched to Web3 mode. You will now pay for your own transaction fees."
                );
            }
            catch (err) {
                console.error('Error switching to Web3 mode:', err);
                setError((err as Error).message || 'An unexpected error occurred');
            }
            finally {
                setIsLoading(false);
            }
            return;
        }

        if (tierId === 'free' && accountType === 'Free') {
            return; // Already on free plan
        }

        if (tierId === 'premium' && accountType === 'Premium') {
            return; // Already on premium plan
        }

        if (tierId === 'free' && accountType === 'Web3') {
            // redirect to get free api key
            navigate('/accounts/api-key');
            return;
        }

        // Email validation for other options
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }
        
        setIsLoading(true);
        setError(null);

        try {
            if (tierId === 'free') {
                // Handle downgrade
                const confirmDowngrade = window.confirm(
                    'Are you sure you want to downgrade to the Free plan? Your subscription will be cancelled at the end of your current billing period.'
                );

                if (!confirmDowngrade) {
                    setIsLoading(false);
                    return;
                }

                // Call API to cancel subscription
                const response = await fetch(`${API_GATEWAY_URL}/subscription`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        walletAddress: address
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.message || 'Failed to cancel subscription');
                }

                showError(
                    "Subscription Cancelled", 
                    "Your subscription has been cancelled. Your API key will be valid until the end of your current billing period."
                );
            }
            else {
                // Handle premium upgrade - redirect to Stripe checkout
                const response = await fetch(`${API_GATEWAY_URL}/stripe/checkout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        walletAddress: address,
                        tier: 'premium'
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
        }
        catch (err) {
            console.error('Error during checkout process:', err);
            setError((err as Error).message || 'An unexpected error occurred');
        }
        finally {
            setIsLoading(false);
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
                        key={tier.id}
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
                                    {tier.id === 'free' && (
                                        <Shield className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                    )}
                                    {tier.id === 'premium' && (
                                        <Crown className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                                    )}
                                    {tier.id === 'web3' && (
                                        <WalletCards className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                                    )}
                                    {tier.name}
                                </h3>
                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${getAccountTypeColor(tier.id)}`}>
                                    {getAccountTypeName(tier.id)}
                                </span>
                            </div>
                            <div className="mb-4">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">${tier.price}</span>
                                {tier.price > 0 && <span className="text-gray-500 dark:text-gray-400">/month</span>}
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 mb-4 min-h-[48px]">
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
                                    onClick={() => handleCheckout(tier.id)}
                                    disabled={isLoading || (tier.id === accountType.toLowerCase())}
                                    className={`w-full py-2 rounded-md text-center font-medium 
                                        ${tier.highlight
                                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                            : 'bg-gray-200 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                                        }
                                        ${isLoading || (tier.id === accountType.toLowerCase())
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
        </div>
    );
};

export default PremiumSignup;
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { Link } from 'react-router-dom';

interface ApiKeySignupProps {
    onSuccess?: (apiKey: string) => void;
}

const ApiKeySignup: React.FC<ApiKeySignupProps> = ({ onSuccess }) => {
    const { address } = useUser();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);

    const API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'https://api.totembound.com/v1';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        if (!address) {
            setError('Wallet not connected');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`${API_GATEWAY_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    walletAddress: address,
                    tier: 'free'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409 && data.keyExists) {
                    setError('An API key is already associated with this email or wallet address. Please check your email or contact support.');
                }
                else {
                    setError(data.message || 'Failed to generate API key');
                }
                return;
            }

            // Handle successful response
            if (data.apiKey) {
                setApiKey(data.apiKey);
                setSuccessMessage('Your API key has been generated! It has been sent to your email.');
                if (onSuccess) onSuccess(data.apiKey);
            }
            else if (data.redirectUrl) {
                // This would be for premium signup flow
                window.location.href = data.redirectUrl;
            }
        }
        catch (err) {
            console.error('Error signing up for API key:', err);
            setError('An unexpected error occurred. Please try again later.');
        }
        finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Get Your Free API Key
            </h2>

            {successMessage ? (
                <div className="mb-6">
                    <div className="p-4 bg-green-100 dark:bg-green-900 rounded-md mb-4">
                        <p className="text-green-800 dark:text-green-200">{successMessage}</p>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-4 bg-red-100 dark:bg-red-900 rounded-md mb-4">
                            <p className="text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="your@email.com"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            We'll send your API key to this email address
                        </p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Connected Wallet
                        </label>
                        <input
                            type="text"
                            value={address || 'Wallet not connected'}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !address}
                        className={`w-full py-2 px-4 rounded-md text-white font-medium bg-purple-600 hover:bg-purple-700 ${isSubmitting || !address
                                ? 'opacity-50 cursor-not-allowed' 
                                : ''
                            }`}
                    >
                        {isSubmitting ? 'Generating...' : 'Get Free API Key'}
                    </button>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Want higher limits and priority processing?
                        </p>
                        <Link
                            to="/account/premium"
                            className="text-sm font-medium text-purple-600 hover:text-purple-800 dark:text-purple-400"
                        >
                            Upgrade to Premium
                        </Link>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ApiKeySignup;
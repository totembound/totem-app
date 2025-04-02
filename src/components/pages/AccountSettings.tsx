import React, { useState, useEffect } from 'react';
import { Info, AlertCircle, Zap, Award, Key, ChevronUp, ChevronDown } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { Link } from 'react-router-dom';
import SubscriptionStatus from '../SubscriptionStatus';
import { TIER_TYPES } from '../../config/constants';
import TokensDisplay from '../TokensDisplay';

const AccountSettings = () => {
    const {
        isGaslessEnabled,
        setGaslessEnabled,
        gaslessApiKey,
        setGaslessApiKey,
        accountType,
        updateAccountType
    } = useUser();

    const [apiKey, setApiKey] = useState(gaslessApiKey || '');
    const [gaslessEnabled, setGaslessEnabledLocal] = useState(isGaslessEnabled);
    const [error, setError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showApiKey, setShowApiKey] = useState(gaslessApiKey === '');

    useEffect(() => {
        setApiKey(gaslessApiKey || '');
        setGaslessEnabledLocal(isGaslessEnabled);
        setError('');
    }, [gaslessApiKey, isGaslessEnabled]);

    const handleSave = () => {
        // Validate settings
        if (gaslessEnabled && (!apiKey || apiKey.trim() === '')) {
            setError('API key is required when gasless transactions are enabled');
            return;
        }

        setGaslessEnabled(gaslessEnabled);
        setGaslessApiKey(apiKey);
        updateAccountType(apiKey);
        setSaveSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    const handleGaslessToggle = (enabled: boolean) => {
        setGaslessEnabledLocal(enabled);
        if (!enabled) {
            setError('');
        } else if (!apiKey) {
            setError('API key is required when gasless transactions are enabled');
        }
    };

    const getAccountTypeColor = () => {
        switch (accountType) {
            case TIER_TYPES.premium:
                return 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20';
            case TIER_TYPES.free:
                return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
            default: // Advanced
                return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20';
        }
    };

    const getAccountTypeDescription = () => {
        switch (accountType) {
            case TIER_TYPES.premium:
                return 'Premium users have access to all gasless features with higher usage limits.';
            case TIER_TYPES.free:
                return 'Free users have access to basic gasless features with limited usage.';
            default: // Advanced
                return 'Advanced users pay their own transaction fees directly through their wallet.';
        }
    };

    const getAccountTypeIcon = () => {
        switch (accountType) {
            case TIER_TYPES.premium:
                return <Award className="w-5 h-5" />;
            case TIER_TYPES.free:
                return <Key className="w-5 h-5" />;
            default: // Advanced
                return <Zap className="w-5 h-5" />;
        }
    };

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Account Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your API key and transaction settings
                </p>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Settings Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                            Transaction Settings
                        </h2>

                        <div className="space-y-6">
                            {/* Account Type Display */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Account Type
                                </label>
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getAccountTypeColor()}`}>
                                        {getAccountTypeIcon()}
                                        {accountType}
                                    </span>
                                    <Link 
                                        to="/account/premium" 
                                        className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                                    >
                                        View Plans
                                    </Link>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {getAccountTypeDescription()}
                                </p>
                            </div>

                            {/* Gasless Toggle */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Enable Gasless Transactions
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => handleGaslessToggle(!gaslessEnabled)}
                                        className={`
                                            relative inline-flex h-6 w-11 items-center rounded-full
                                            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                                            focus:ring-purple-500 dark:focus:ring-purple-400 focus:ring-offset-white dark:focus:ring-offset-gray-900
                                            ${gaslessEnabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}
                                        `}>
                                        <span className={`
                                            inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-200
                                            transition-transform
                                            ${gaslessEnabled ? 'translate-x-6' : 'translate-x-1'}
                                            `}
                                        />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Info size={14} />
                                    When enabled, transaction gas fees will be covered by our relayer service (requires API key)
                                </p>
                            </div>

                            {/* API Key */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-left">
                                    <div className="flex items-center gap-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Gasless API Key
                                        </label>
                                    </div>
                                    <button 
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <span className="text-sm font-medium">
                                            {showApiKey ? 'hide' : 'show'}
                                        </span>
                                        {showApiKey ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                                {showApiKey && 
                                    <input
                                        type="text"
                                        value={apiKey}
                                        onChange={(e) => {
                                            setApiKey(e.target.value);
                                            if (gaslessEnabled && e.target.value.trim() === '') {
                                                setError('API key is required when gasless transactions are enabled');
                                            } else {
                                                setError('');
                                            }
                                        }}
                                        placeholder="Enter your API key"
                                        className={`w-full px-3 py-2 border rounded-md
                                            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                            disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed
                                            ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}
                                            `}
                                        disabled={!gaslessEnabled}
                                    />
                                }
                                {error && (
                                    <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 mt-1">
                                        <AlertCircle size={14} />
                                        {error}
                                    </p>
                                )}
                            </div>

                            {/* Save Button */}
                            <div className="pt-2">
                                <button
                                    onClick={handleSave}
                                    disabled={gaslessEnabled && (!apiKey || apiKey.trim() === '')}
                                    className={`px-4 py-2 bg-purple-600 text-white rounded-md transition-colors
                                        ${(gaslessEnabled && (!apiKey || apiKey.trim() === ''))
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'
                                        }`}
                                >
                                    Save Changes
                                </button>

                                {saveSuccess && (
                                    <span className="ml-3 text-green-600 dark:text-green-400">
                                        Settings saved successfully!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Get API Key Card */}
                    {accountType === TIER_TYPES.advanced && 
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
                                Need an API Key?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                Get a free API key to enable gasless transactions and enhance your gaming experience.
                            </p>
                            <Link
                                to="/account/api-key"
                                className="block w-full text-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                            >
                                Get Free API Key
                            </Link>
                        </div>
                    }
                    {/* Upgrade Card */}
                    {accountType !== TIER_TYPES.premium && 
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
                                Upgrade to Premium
                            </h3>
                            <p className="text-sm mb-4 text-gray-600 dark:text-gray-400">
                                Unlock higher transaction limits, priority processing, and exclusive features.
                            </p>
                            <ul className="text-sm space-y-2 mb-4 text-gray-600 dark:text-gray-400">
                                <li className="flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>1000 transactions per day</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Priority transaction processing</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Monthly bonus credits</span>
                                </li>
                            </ul>
                            <Link
                                to="/account/premium"
                                className="block w-full text-center px-4 py-2 text-white rounded-md transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                Upgrade Now
                            </Link>
                        </div>
                    }
                    {/* Premium Options */}
                    {accountType === TIER_TYPES.premium && 
                        <SubscriptionStatus/>
                    }
                </div>
            </div>
        </div>
    );
};

export default AccountSettings;
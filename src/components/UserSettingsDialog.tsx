import React, { useState, useEffect } from 'react';
import { X, Info, AlertCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

interface UserSettingsDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserSettingsDialog: React.FC<UserSettingsDialogProps> = ({
    isOpen,
    onClose
}) => {
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

    useEffect(() => {
        setApiKey(gaslessApiKey || '');
        setGaslessEnabledLocal(isGaslessEnabled);
        setError('');
    }, [gaslessApiKey, isGaslessEnabled, isOpen]);

    const handleSave = () => {
        // Validate settings
        if (gaslessEnabled && (!apiKey || apiKey.trim() === '')) {
            setError('API key is required when gasless transactions are enabled');
            return;
        }

        setGaslessEnabled(gaslessEnabled);
        setGaslessApiKey(apiKey);
        updateAccountType(apiKey);
        onClose();
    };

    const handleGaslessToggle = (enabled: boolean) => {
        setGaslessEnabledLocal(enabled);
        if (!enabled) {
            setError('');
        } else if (!apiKey) {
            setError('API key is required when gasless transactions are enabled');
        }
    };

    if (!isOpen) return null;

    const getAccountTypeColor = () => {
        switch (accountType) {
            case 'Premium':
                return 'text-blue-600 dark:text-blue-400';
            case 'Free':
                return 'text-green-600 dark:text-green-400';
            default: // Web3
                return 'text-purple-600 dark:text-purple-400';
                
        }
    };

    const getAccountTypeDescription = () => {
        switch (accountType) {
            case 'Premium':
                return 'Premium users have access to all gasless features with higher usage limits.';
            case 'Free':
                return 'Free users have access to basic gasless features with limited usage.';
            default: // Web3
                return 'Advanced users pay their own transaction fees directly through their wallet.';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative w-[calc(100%-2rem)] max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl mx-4">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100 pr-8">
                        User Settings
                    </h2>

                    <div className="space-y-6">
                        {/* Account Type */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Account Type
                            </label>
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold text-lg ${getAccountTypeColor()}`}>
                                    {accountType}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
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
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Info size={12} />
                                When enabled, transaction gas fees will be covered by our relayer service (requires API key)
                            </p>
                        </div>

                        {/* API Key */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Gasless API Key
                            </label>
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
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Info size={12} />
                                Request an API key at{" "}
                                <a 
                                    href="/accounts" 
                                    className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium underline underline-offset-2 transition-colors"
                                >
                                    accounts
                                </a>
                            </p>

                            {error && (
                                <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1 mt-1">
                                    <AlertCircle size={12} />
                                    {error}
                                </p>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600
                                    text-gray-700 dark:text-gray-300 rounded-md
                                    hover:bg-gray-50 dark:hover:bg-gray-700
                                    transition-colors"
                            >
                                Cancel
                            </button>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSettingsDialog;
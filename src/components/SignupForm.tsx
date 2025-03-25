import React, { useState, useEffect } from 'react';
import { useTotemGame } from '../hooks/useTotemGame';
import { useUser } from '../contexts/UserContext';
import { ComingSoon } from './ComingSoon';
import { Feature } from './Feature';
import { useTransactionService } from '../hooks/useTransactionService';

export const SignupForm: React.FC = () => {
    const { isSignedUp, checkSignupStatus, isConnected, connect, disconnect, address, isGaslessEnabled, comingSoon } = useUser();
    const { signup } = useTotemGame();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const normalizedAddress = (address as string || '').toLowerCase();

    const txService = useTransactionService({
        gaslessEnabled: isGaslessEnabled,
        waitForConfirmation: true
    });

    const handleSignup = async () => {
        setLoading(true);
        setError('');

        try {
            if (!txService) throw new Error('Transaction service not initialized');

            const result = await txService.signup();
            //const tx = await signup();
            console.log('Signup transaction complete:', result);
            // Add a small delay before checking status
            await new Promise(resolve => setTimeout(resolve, 1000));
            await checkSignupStatus(); // Update global state
        }
        catch (err) {
            console.error('Signup error:', err);
            setError(err instanceof Error ? err.message : 'Failed to sign up');
        }
        finally {
            setLoading(false);
        }
    };
    
    const handleConnect = async () => {
        console.log('SignupForm: FORCEFULLY Connecting wallet');
        connect();
    };

    const handleDisconnect = () => {
        console.log('SignupForm: FORCEFULLY Disconnecting wallet');
        disconnect();
    };

    if (!isConnected) {
        return (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 md:p-8 rounded-lg max-w-[95%] md:max-w-2xl mx-auto 
            shadow-lg border border-gray-100 dark:border-gray-700">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                Welcome to TotemBound! 🎮✨
            </h1>
            
            {comingSoon ? <ComingSoon /> : null}

            <div className="bg-gray-200 dark:bg-gray-800 p-4 md:p-6 rounded-lg mb-8">
                <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                    What are Totems? 🦉
                </h2>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                    Totems are your unique, evolving companions, each representing a powerful animal spirit. 
                    Each Totem grows stronger through your guidance and training.
                </p>

                <div className="space-y-3 md:space-y-4">
                    <Feature icon="🦉" text="Collect unique companions with real power" />
                    <Feature icon="⚡" text="Train and evolve your mystical animal spirits" />
                    <Feature icon="💎" text="Trade and grow your collection of rare Totems" />
                    <Feature icon="🌿" text="Unlock new abilities and rewards" />
                    <Feature icon="🏆" text="Compete in challenges and events" />
                    <Feature icon="🪙" text="Stake Wise Elder Totems to earn rewards" />
                </div>

                <p className="mt-6 text-gray-700 dark:text-gray-300">
                    As a chosen Keeper, you'll harness primal energies, unlock hidden abilities, 
                    and even ascend your totem companions to their ultimate Wise Elder forms.
                </p>
                <p className="mt-4 mb-4 text-gray-700 dark:text-gray-300">
                    The path to mastery begins with a single connection. Start your spiritual journey in TotemBound today!
                </p>
                
                <div className="text-xl text-center mt-6">
                    🐻🐺🦫🐟🦉<span className="raven-emoji">🦅</span>🦢🐍🦅🦌🦦🐦
                </div>
            </div>

            <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg mb-8 text-center">
                <p className="text-lg text-purple-800 dark:text-purple-200">
                    ✨ Future updates include Totem combinations, rarity upgrades, and epic challenges! ✨
                </p>
            </div>
            
            <button
                onClick={handleConnect}
                disabled={comingSoon}
                className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 
                    rounded-lg w-full text-lg transition-all focus:ring-2 focus:ring-purple-500 
                    focus:ring-offset-2 dark:focus:ring-offset-gray-800
                    ${comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}>
                Connect Wallet 🔮
            </button>
        </div>
        );
    }

    return (
        <div className={`bg-gray-50 dark:bg-gray-900 p-4 md:p-8 rounded-lg max-w-[95%] md:max-w-2xl mx-auto 
                shadow-lg border border-gray-100 dark:border-gray-700
                ${!isSignedUp ? 'max-w-2xl' :''} mx-auto`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                {!isSignedUp ? (
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        TotemBound ✨
                    </h1>
                ) : null}
                <div className="w-full sm:w-auto space-y-2">
                    <button 
                        onClick={handleDisconnect}
                        className="bg-purple-600 text-white font-bold hover:bg-purple-700 
                            px-4 py-2 rounded-lg w-full sm:w-auto transition-colors
                            focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 
                            dark:focus:ring-offset-gray-800">
                        Disconnect
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Connected: {normalizedAddress.slice(0, 6)}...{normalizedAddress.slice(-4)}
                    </p>
                </div>
            </div>

            {isSignedUp ? (
                <>
                    <div className="text-green-600 dark:text-green-400 mb-4">
                        Signup Complete!
                    </div>
                </>
            ) : (
                <>
                    <div className="bg-gray-200 dark:bg-gray-800 p-4 md:p-6 rounded-lg mb-8">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                            Begin Your Journey 🔮
                        </h2>
                        
                        <div className="space-y-4">
                            <Feature 
                                icon="🪙" 
                                text={<>Receive <span className="font-bold text-purple-600 dark:text-purple-400">2,000 TOTEM</span> tokens as your welcome gift to start</>}
                            />
                            <Feature 
                                icon="⚡" 
                                text="Quick setup with one-time POL fee for gas and initial costs"
                            />
                            <Feature 
                                icon="🎮" 
                                text="Instant access to collect and train your mystical companions"
                            />
                        </div>

                        <div className="text-xl text-center mt-6">
                            🐻🐺🦫🐟🦉<span className="raven-emoji">🦅</span>🦢🐍🦅🦌🦦🐦
                        </div>
                    </div>

                    <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg mb-8 text-center">
                        <p className="text-lg text-purple-800 dark:text-purple-200">
                            🚀 Gasless transactions coming soon to make your adventure even smoother!
                        </p>
                    </div>

                    <button 
                        onClick={handleSignup} 
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold 
                            py-3 px-6 rounded-lg w-full text-lg transition-all
                            focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 
                            dark:focus:ring-offset-gray-800
                            disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Signing up...' : 'Start Your Journey (Pay POL Fee) ✨'}
                    </button>
                </>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                    Error: {error}
                </div>
            )}
        </div>
    );
};
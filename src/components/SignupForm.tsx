import React, { useState, useEffect } from 'react';
import { useTotemGame } from '../hooks/useTotemGame';
import { useUser } from '../contexts/UserContext';
import UserInfoPanel from './UserInfoPanel';
import { ComingSoon } from './ComingSoon';

export const SignupForm: React.FC = () => {
    const { isSignedUp, checkSignupStatus, isConnected, connect, disconnect, address } = useUser();
    const { signup } = useTotemGame();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const normalizedAddress = (address as string || '').toLowerCase();
    const comingSoon = true;

    useEffect(() => {
        console.log('SignupForm - Current State:', { 
          isSignedUp 
        });
      }, [isSignedUp]);

    const handleSignup = async () => {
        setLoading(true);
        setError('');
        
        try {
            const tx = await signup();
            console.log('Signup transaction complete:', tx);
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
        <div className="bg-white p-6 rounded-lg max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Welcome to TotemBound! 🎮✨</h1>
            
            { comingSoon ? <ComingSoon /> : <></>}

            <div className="bg-gray-200 text-black p-6 rounded-lg mb-8">
                <h2 className="text-2xl font-bold mb-6">What are Totems? 🦁</h2>
                <p className="mb-6">
                    Totems are your unique, evolving companions, each representing a powerful animal spirit. Each Totem grows stronger through your guidance and training.
                </p>

                <div className="space-y-2">
                <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">🦁</span>
                    <p className="text-lg">Collect unique NFT companions with real power</p>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">⚡</span>
                    <p className="text-lg">Train and evolve your mystical animal spirits</p>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">💎</span>
                    <p className="text-lg">Trade and grow your collection of rare Totems</p>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">🌿</span>
                    <p className="text-lg">Unlock new abilities and rewards</p>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">🏆</span>
                    <p className="text-lg">Compete in challenges and events</p>
                </div>

                <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">🪙</span>
                    <p className="text-lg">Stake Wise Elder Totems to earn rewards</p>
                </div>
            
                </div>

                <p className="mt-6">As a chosen Keeper, you'll harness primal energies, unlock hidden abilities, and even ascend your totem companions to their ultimate Wise Elder forms. </p>
                <p className="mt-4">The path to mastery begins with a single connection. Start your spiritual journey in TotemBound today!🦉</p>
            </div>

            <div className="bg-purple-300/50 p-4 rounded-lg mb-8 text-center">
                <p className="text-lg">✨ Future updates include Totem combinations, rarity upgrades, and epic challenges! ✨</p>
            </div>
            
            <button
                onClick={handleConnect}
                disabled={comingSoon}
                className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg w-full text-lg transition-all
                    ${comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}>
                Connect Wallet 🔮
            </button>

        </div>
        );
    }

    return (
        <div className={`bg-white p-6 rounded-lg ${!isSignedUp ? 'max-w-2xl' :''} mx-auto`}>
            <div className="flex justify-between items-start mb-8">
                <h1 className="text-3xl font-bold">TotemBound ✨</h1>
                <div className="space-y-2">
                <button 
                    onClick={handleDisconnect}
                    className="bg-purple-600 text-white font-bold hover:bg-purple-700 px-4 py-2 rounded-lg w-full">Disconnect</button>
                <p className="text-sm text-gray-400">Connected: {normalizedAddress.slice(0, 6)}...{normalizedAddress.slice(-4)}</p>
                </div>
            </div>

            {isSignedUp ? (<>
                <div className="text-green-600">
                    Signup Complete!<br></br>
                </div>
                <UserInfoPanel></UserInfoPanel>
                </>
            ) : (<>
                <div className="bg-gray-200 p-6 rounded-lg mb-8">
                    <h2 className="text-2xl font-bold mb-6">Begin Your Journey 🔮</h2>
                    
                    <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="text-lg mt-1">🪙</span>
                        <p className="text-xl">Receive <span className="font-bold text-purple-600">2,000 $TOTEM</span> tokens as your welcome gift to start</p>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="text-lg mt-1">⚡</span>
                        <p className="text-xl">Quick setup with one-time POL fee for gas and initial costs</p>
                    </div>

                    <div className="flex items-start gap-3">
                        <span className="text-lg mt-1">🎮</span>
                        <p className="text-xl">Instant access to collect and train your mystical companions</p>
                    </div>
                    </div>
                </div>

                <div className="bg-purple-300/50 p-4 rounded-lg mb-8 text-center">
                    <p className="text-lg">🚀 Gasless transactions coming soon to make your adventure even smoother!</p>
                </div>

                <button 
                    onClick={handleSignup} 
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg w-full text-lg transition-all">
                    {loading ? 'Signing up...' : 'Start Your Journey (Pay POL Fee) ✨'}
                </button>
            </>)}

            {error && (
                <div className="mt-4 text-red-600">
                    Error: {error}
                </div>
            )}
        </div>
    );
};
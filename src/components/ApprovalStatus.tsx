import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { AlertTriangle, CheckCircle2, Coins, Gamepad2, PawPrint, ShoppingCart, Swords, X } from 'lucide-react';

const ApprovalStatus: React.FC = () => {
    const { 
        address, 
        provider, 
        isSignedUp, 
        isTokenApproved, 
        checkTokenApproval,
        approveTokens,
        isApprovalMessageDismissed,
        setApprovalMessageDismissed
    } = useUser();
    const [isApproving, setIsApproving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleApprove = async () => {
        if (!address || !provider) {
            setError('Please connect your wallet first.');
            return;
        }

        setIsApproving(true);
        setError(null);

        try {
            // Assuming approveTokens is a method in useTotemGame hook
            const success = await approveTokens();
            
            if (success) {
                // Double-check approval status
                const approved = await checkTokenApproval();
                
                if (!approved) {
                    throw new Error('Approval failed. Please try again.');
                }
            }
            else {
                throw new Error('Approval transaction was not successful.');
            }
        }
        catch (err: any) {
            setError(
                err.message?.includes('user rejected') 
                    ? 'You cancelled the approval. Please try again.' 
                    : err.message || 'An unexpected error occurred during token approval.'
            );
        }
        finally {
            setIsApproving(false);
        }
    };

    if (isTokenApproved && isApprovalMessageDismissed) {
        return null;
    }

    if (isTokenApproved) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                            Tokens Approved!
                        </h2>
                    </div>
                    <button 
                        onClick={() => setApprovalMessageDismissed(true)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        aria-label="Dismiss message"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    You're all set to explore the TotemBound universe. Here's what you can do next:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <button className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-3 rounded-lg text-gray-900 dark:text-white transition-colors">
                        <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span>Purchase Totems</span>
                    </button>
                    <button className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-3 rounded-lg text-gray-900 dark:text-white transition-colors">
                        <PawPrint className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span>Explore Your Totems</span>
                    </button>
                    <button className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-3 rounded-lg text-gray-900 dark:text-white transition-colors">
                        <Swords className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <span>Challenges</span>
                    </button>
                    <button className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-3 rounded-lg text-gray-900 dark:text-white transition-colors">
                        <Coins className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <span>Claim Daily Rewards</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 p-6 bg-yellow-50 dark:bg-yellow-900/30 text-black dark:text-white rounded-lg shadow border border-yellow-200 dark:border-yellow-700/50">
            <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-200">
                    Token Approval Required
                </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">


            <div className="space-y-4 col-span-2">
                <p className="text-gray-700 dark:text-gray-300">
                    Congratulations! You've received 2,000 TOTEM tokens to start your adventure. 
                    To unlock and use these tokens in the game, you'll need to complete a one-time approval.
                </p>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 p-3 rounded-lg">
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                <button 
                    className={`
                        w-full md:w-auto px-6 py-3 rounded-md font-bold transition-all duration-300
                        ${isApproving 
                            ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                            : 'bg-green-500 hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600 text-white'
                        }
                    `}
                    onClick={handleApprove}
                    disabled={isApproving}
                >
                    {isApproving ? 'Approving...' : 'Approve TOTEM'}
                </button>
            </div>

            <div className="text-gray-600 dark:text-gray-400">
                    <p>What happens after approval?</p>
                    <ul className="list-disc list-inside space-y-2 mt-2">
                        <li>Unlock full access to game features</li>
                        <li>Claim daily rewards</li>
                        <li>Purchase and interact with Totems</li>
                        <li>Start your TotemBound adventure!</li>
                    </ul>
                </div>
    


            </div>
        </div>
    );
};

export default ApprovalStatus;
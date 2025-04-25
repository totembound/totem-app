import React, { useState } from 'react';
import { Clock, CheckCircle, Gift, Droplets, Sparkles, Users, Loader2 } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { getDomainColor, getRarityBorderColor } from "../../utils/totems";
import CountdownTimer from '../CountdownTimer';

interface ActiveExpeditionPanelProps {
    expedition: {
        expeditionId: string;
        totemIds: bigint[];
        endTime: number;
        completed: boolean;
        canClaim: boolean;
    };
    expeditionConfig: any; 
    onClaim: () => void;
}

const ActiveExpeditionPanel: React.FC<ActiveExpeditionPanelProps> = ({
    expedition,
    expeditionConfig,
    onClaim
}) => {
    const [isClaiming, setIsClaiming] = useState(false);
    const { getTotem } = useUser();
    
    // Get all totems in the expedition
    const captain = getTotem(BigInt(expedition.totemIds[0]));
    const memberOne = getTotem(BigInt(expedition.totemIds[1]));
    const memberTwo = getTotem(BigInt(expedition.totemIds[2]));

    const captainRarityColors = getRarityBorderColor(captain?.attributes.rarity!);
    const memberOneRarityColors = getRarityBorderColor(memberOne?.attributes.rarity!);
    const memberTwoRarityColors = getRarityBorderColor(memberTwo?.attributes.rarity!);

    // Calculate time remaining
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = expedition.endTime - now;
    const isComplete = timeRemaining <= 0 || expedition.canClaim;
    
    // Calculate progress percentage
    const calculateProgress = () => {
        if (!expeditionConfig) return 100;
        
        const total = expeditionConfig.duration;
        const elapsed = total - timeRemaining;
        
        const percent = Math.min(100, Math.max(0, (elapsed / total) * 100));

        if (!isComplete && percent >= 99) {
            return 99;
        }

        return percent;
    };
    
    // Handle claim with loading state
    const handleClaim = async () => {
        setIsClaiming(true);
        try {
            await onClaim();
        }
        finally {
            // This will run whether the claim succeeds or fails
            setTimeout(() => setIsClaiming(false), 500); // Keep spinner visible briefly
        }
    };

    if (!expeditionConfig || !captain || !memberOne || !memberTwo) {
        return <div>Loading...</div>;
    }
        
    return (
        <div className="flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg h-full border border-gray-300 dark:border-gray-700">
            {/* Header with background image */}
            <div className="relative h-40">
                {expeditionConfig.image && (
                    <img 
                        src={expeditionConfig.image || '/expeditions/placeholder.png'}
                        alt={`${expeditionConfig.domainName} expedition background`}
                        className="absolute inset-0 w-full h-full object-cover brightness-50 contrast-50"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
                <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-white">
                            {expeditionConfig.name}
                        </h3>
                        <div className={`
                            px-2 py-1 rounded-lg text-sm font-semibold shadow-md ml-auto mr-2
                            ${isComplete 
                                ? 'bg-green-500 text-white' 
                                : 'bg-blue-500 text-white'}
                        `}>
                            {isComplete ? 'Complete' : 'In Progress'}
                        </div>
                        <div className={`
                            px-2 py-1 rounded-lg text-sm font-semibold shadow-md
                            ${getDomainColor(expeditionConfig.domain)}
                        `}>
                            {expeditionConfig.domainName}
                        </div>
                    </div>
                    {/* Description */}
                    <p className="font-medium text-sm text-gray-200 mb-auto mt-4">
                        {expeditionConfig.description}
                    </p>
                    {/* Progress bar */}
                    {!isComplete && (
                        <div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-blue-500 dark:bg-blue-400"
                                    style={{ width: `${calculateProgress()}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-1">
                                <div className="flex items-center text-xs text-gray-300 dark:text-gray-400">
                                    <Clock className="w-3.5 h-3.5 inline mr-1" />
                                    <CountdownTimer
                                        endTime={expedition.endTime} 
                                    /> 
                                    <span className="ml-1">remaining</span>
                                </div>
                                <div className="text-xs text-gray-300 dark:text-gray-400">
                                    {Math.round(calculateProgress())}%
                                </div>
                            </div>
                        </div>
                    )}
                    {isComplete && (
                        <div className="flex items-center text-xs text-gray-300 dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            0:00 remaining
                        </div>
                    )}
                </div>
            </div>
            {/* Reward Preview */}
            <div className="px-4 mb-2 mt-2">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
                    Expected Rewards
                </h4>
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-2 text-center">
                        <Sparkles className="w-5 h-5 text-green-500 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {expeditionConfig.baseExperience} XP
                        </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-2 text-center">
                        <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {expeditionConfig.durationHours >= 24 ? "3× " : expeditionConfig.durationHours >= 12 ? "2× " : ""}
                            Runes
                        </div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-2 text-center">
                        <Gift className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Surprise
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Team Members Section */}
            <div className="px-4 mb-4">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    Expedition Team
                </h4>
                <div className="grid grid-cols-3 gap-2">
                    {/* Captain */}
                    <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-2">
                        <div className="flex flex-col items-center">
                            <div className={`relative w-10 h-10 overflow-hidden rounded-lg border ${captainRarityColors.border}`}>
                                <img 
                                    src={captain.image?.replace("ipfs://", "https://ipfs.io/ipfs/") || '/images/placeholder.png'} 
                                    alt={captain.attributes.displayName || `Totem #${captain.id}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="text-xs font-medium text-center mt-1 text-gray-800 dark:text-gray-200">
                                {captain.attributes.displayName || `#${captain.id}`}
                            </div>
                        </div>
                    </div>
                    
                    {/* Member 1 */}
                    <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-2">
                        <div className="flex flex-col items-center">
                            <div className={`relative w-10 h-10 overflow-hidden rounded-lg border ${memberOneRarityColors.border}`}>
                                <img 
                                    src={memberOne.image?.replace("ipfs://", "https://ipfs.io/ipfs/") || '/images/placeholder.png'} 
                                    alt={memberOne.attributes.displayName || `Totem #${memberOne.id}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="text-xs font-medium text-center mt-1 text-gray-800 dark:text-gray-200">
                                {memberOne.attributes.displayName || `#${memberOne.id}`}
                            </div>
                        </div>
                    </div>
                    
                    {/* Member 2 */}
                    <div className="bg-gray-100 dark:bg-gray-700/30 rounded-lg p-2">
                        <div className="flex flex-col items-center">
                            <div className={`relative w-10 h-10 overflow-hidden rounded-lg border ${memberTwoRarityColors.border}`}>
                                <img 
                                    src={memberTwo.image?.replace("ipfs://", "https://ipfs.io/ipfs/") || '/images/placeholder.png'} 
                                    alt={memberTwo.attributes.displayName || `Totem #${memberTwo.id}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="text-xs font-medium text-center mt-1 text-gray-800 dark:text-gray-200">
                                {memberTwo.attributes.displayName || `#${memberTwo.id}`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Claim button */}
            <div className="px-4 pb-4 mt-auto">
            <button
                    onClick={handleClaim}
                    disabled={!isComplete || isClaiming}
                    className={`w-full py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2
                        ${isComplete && !isClaiming
                            ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white' 
                            : isClaiming
                              ? 'bg-green-600 dark:bg-green-700 text-white cursor-wait'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}
                    `}
                >
                    {isClaiming ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Claiming...
                        </>
                    ) : isComplete ? (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Claim Rewards
                        </>
                    ) : (
                        <>
                            <Clock className="w-5 h-5" />
                            In Progress...
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ActiveExpeditionPanel;

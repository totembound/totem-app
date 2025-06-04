import React, { useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { NFTMetadata } from '../../types/types';
import { useGame } from '../../contexts/GameContext';
import { getGameDifficulty, getTotemStage } from '../../utils/totems';
import ChallengeGame from './ChallengeGame';
import { IPFS_GATEWAY_URL } from '../../config/constants';

interface ChallengeDialogProps {
    isOpen: boolean;
    challengeId: string;
    title: string;
    onClose: () => void;
    challengeType: string;
    requirements: {
        stage: number;
        strength: number;
        agility: number;
        wisdom: number;
    };
}

const TotemSelectionCard: React.FC<{
    totem: NFTMetadata;
    challengeType: string;
    isSelected: boolean;
    isAvailable: boolean; // Add this new prop
    onClick: () => void;
}> = ({ totem, challengeType, isSelected, onClick, isAvailable }) => (
    <div
        onClick={isAvailable ? onClick : undefined} // Disable click when unavailable
        className={`relative transition-all duration-200 transform rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800
        ${!isAvailable 
            ? 'cursor-not-allowed'
            : `cursor-pointer ${isSelected ? 'scale-105 ring-2 ring-purple-500' : 'hover:scale-102'}`
        }`}
    >
        <div className="aspect-square relative">
            <div className={`w-full h-full transition-all duration-200 ${!isAvailable ? 'opacity-50 grayscale brightness-75' : ''}`}>
                <img
                    src={totem.image.replace('ipfs://', IPFS_GATEWAY_URL)}
                    alt={totem.attributes.displayName || totem.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            {/* Move the GIF overlay outside the filtered div */}
            {!isAvailable && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="relative">
                        <img 
                            src="/challenges/owl_walk.gif" 
                            alt="Unavailable"
                            className="w-full h-full object-contain"
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-center px-1"
                              style={{WebkitTextStroke: '1px black'}}>
                            Out on Expedition
                        </span>
                    </div>
                </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 p-2">
                <h3 className="text-white truncate">{totem.attributes.displayName || totem.name}</h3>
            </div>
        </div>
        <div className="p-2 bg-white dark:bg-gray-700">
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">Stage: {getTotemStage(totem)}</span>
                <span className="text-gray-600 dark:text-gray-300">
                    {challengeType === 'strength' && 
                        <span>Str: {totem.attributes.strength}</span>
                    }
                    {challengeType === 'agility' && 
                        <span>Agi: {totem.attributes.agility}</span>
                    }
                    {challengeType === 'wisdom' && 
                        <span>Wis: {totem.attributes.wisdom}</span>
                    }
                </span>
            </div>
        </div>
    </div>
);

export const ChallengeDialog: React.FC<ChallengeDialogProps> = ({
    isOpen,
    challengeId,
    title,
    onClose,
    challengeType,
    requirements
}) => {
    const { getEligibleTotems, isTotemAvailable } = useGame();
    const [selectedTotem, setSelectedTotem] = useState<NFTMetadata | null>(null);
    const [showSelection, setShowSelection] = useState(true);
    const stage = requirements.stage;
    const name = selectedTotem?.attributes.displayName || selectedTotem?.name;
    const difficulty = getGameDifficulty(selectedTotem!, requirements.stage);

    if (!isOpen) return null;

    const eligibleTotems = getEligibleTotems(challengeId);

    const handleTotemSelect = (totem: NFTMetadata) => {
        setSelectedTotem(totem);
        setShowSelection(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col">
                {/* Header Section - Always Visible */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {showSelection ? 'Select a Totem' : title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {showSelection ? (
                    <div className="p-4 overflow-y-auto">
                        {eligibleTotems.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600 dark:text-gray-400">
                                    None of your totems meet the requirements for this challenge:
                                    <br />
                                    {challengeType === 'strength' && `Strength: ${requirements.strength}`}
                                    {challengeType === 'agility' && `Agility: ${requirements.agility}`}
                                    {challengeType === 'wisdom' && `Wisdom: ${requirements.wisdom}`}
                                    <br />
                                    Stage: {stage}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {eligibleTotems.map((totem) => (
                                    <TotemSelectionCard
                                        key={totem.id}
                                        totem={totem}
                                        challengeType={challengeType}
                                        isSelected={selectedTotem?.id === totem.id}
                                        isAvailable={isTotemAvailable(totem.id)}
                                        onClick={() => handleTotemSelect(totem)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {/* Info Bar */}
                        <div className="flex flex-row items-center justify-between p-4 bg-gray-50 dark:bg-gray-900">
                            {/* Selected Totem Info */}
                            <div className="flex items-center gap-2 sm:mb-0">
                                <button
                                    onClick={() => setShowSelection(true)}
                                    className="p-2 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-800 rounded"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <img
                                    src={selectedTotem?.image.replace('ipfs://', IPFS_GATEWAY_URL)}
                                    alt={name}
                                    className="w-12 h-12 rounded object-cover"
                                />
                                <div className="text-gray-900 dark:text-gray-100">
                                    <p>{name}</p>
                                    <p className="text-sm opacity-80">Stage {getTotemStage(selectedTotem!)}</p>
                                </div>
                            </div>
                            <div className="text-gray-900 dark:text-gray-100 mr-2">
                                Difficulty {difficulty}
                            </div>
                        </div>

                        {/* Challenge Game Area */}
                        <div className="flex-1 overflow-hidden p-4">
                            {selectedTotem && (
                                <ChallengeGame
                                    challengeId={challengeId}
                                    tokenId={selectedTotem.id}
                                    attributes={selectedTotem.attributes}
                                    challengeType={challengeType}
                                    difficulty={difficulty}
                                    onClose={onClose}
                            />)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChallengeDialog;
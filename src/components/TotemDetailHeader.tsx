import React, { useState } from 'react';
import { X, Edit2 } from 'lucide-react';
import { Rarity } from '../types/types';
import DisplayNameEditor from './DisplayNameEditor';

interface TotemDetailHeaderProps {
    tokenId: bigint;
    name: string;
    displayName: string;
    rarity: Rarity;
    onClose: () => void;
    onUpdateTotem: (tokenId: bigint, actionType: number) => Promise<void>;
}

const TotemDetailHeader: React.FC<TotemDetailHeaderProps> = ({
    tokenId,
    name,
    displayName,
    rarity,
    onClose,
    onUpdateTotem
}) => {
    const [isEditingName, setIsEditingName] = useState(false);

    const formatDisplayName = (name: string | null | undefined) => {
        // If name is null, undefined, or not a string, return default
        if (name == null || typeof name !== 'string') {
            return 'Set nickname...';
        }
        
        // If name contains only special characters/boxes, treat as empty
        if (/^[\u{FFF0}-\u{FFFF}\u{10FFFF}]+$/u.test(name)) {
            return 'Set nickname...';
        }
    
        // If it's just spaces or invisible characters
        if (!name.trim()) return 'Set nickname...';
    
        // Otherwise show the name with quotes
        return `"${name}"`;
    };

    return (
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <h2 className="text-lg sm:text-xl font-bold truncate">
                        {name}
                    </h2>
                    <div className="flex items-center h-8">
                        {isEditingName ? (
                            <DisplayNameEditor
                                tokenId={tokenId}
                                currentName={displayName || ''}
                                onClose={async () => {
                                    await onUpdateTotem(tokenId, 99); // ActionType.None = 99
                                    setIsEditingName(false);
                                }}
                            />
                        ) : (
                            <div className="flex items-center">
                                <p className="text-md text-gray-400 dark:text-gray-300 italic">
                                    {formatDisplayName(displayName)}
                                </p>
                                <button
                                    onClick={() => setIsEditingName(true)}
                                    className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    aria-label="Edit nickname"
                                >
                                    <Edit2 size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Close details"
            >
                <X size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
        </div>
    );
};

export default TotemDetailHeader;
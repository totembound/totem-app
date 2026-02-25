import React, { useState } from 'react';
import { X, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Rarity } from '../types/types';
import DisplayNameEditor from './DisplayNameEditor';

interface TotemDetailHeaderProps {
    totemId: string;
    name: string;
    displayName: string;
    rarity: Rarity;
    onClose: () => void;
    onNicknameUpdate?: (nickname: string | null) => void;
    onPrev?: () => void;
    onNext?: () => void;
    totalTotems?: number;
    currentIndex?: number;
}

const TotemDetailHeader: React.FC<TotemDetailHeaderProps> = ({
    totemId,
    name,
    displayName,
    onClose,
    onNicknameUpdate,
    onPrev,
    onNext,
    totalTotems,
    currentIndex
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

    const hasPrev = currentIndex !== undefined && currentIndex > 0;
    const hasNext = currentIndex !== undefined && totalTotems !== undefined && currentIndex < totalTotems - 1;

    return (
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {/* Main header row: title + close */}
            <div className="flex items-center justify-between p-3 sm:p-4 pb-0 sm:pb-0">
                <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold truncate">
                        {name}
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1.5 sm:p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors ml-2"
                    aria-label="Close details"
                >
                    <X size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
            </div>

            {/* Second row: nickname + mobile nav */}
            <div className="flex items-center justify-between px-3 sm:px-4 pb-2 sm:pb-3">
                {/* Nickname */}
                <div className="flex items-center h-7 min-w-0 flex-1">
                    {isEditingName ? (
                        <DisplayNameEditor
                            totemId={totemId}
                            currentName={displayName || ''}
                            onClose={() => setIsEditingName(false)}
                            onSuccess={onNicknameUpdate}
                        />
                    ) : (
                        <div className="flex items-center min-w-0">
                            <p className="text-sm text-gray-400 dark:text-gray-300 italic truncate">
                                {formatDisplayName(displayName)}
                            </p>
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="ml-1.5 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                                aria-label="Edit nickname"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Mobile nav arrows - only on mobile when nav props exist */}
                {onPrev && onNext && totalTotems !== undefined && currentIndex !== undefined && (
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                            onClick={onPrev}
                            disabled={!hasPrev}
                            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-default transition-colors"
                            aria-label="Previous Totem"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tabular-nums min-w-[3ch] text-center">
                            {currentIndex + 1}/{totalTotems}
                        </span>
                        <button
                            onClick={onNext}
                            disabled={!hasNext}
                            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-default transition-colors"
                            aria-label="Next Totem"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TotemDetailHeader;
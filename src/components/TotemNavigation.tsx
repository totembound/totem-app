import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TotemNavigationProps {
    onPrev: () => void;
    onNext: () => void;
    totalTotems?: number;
    currentIndex?: number;
    mobileView?: boolean;
}

const TotemNavigation: React.FC<TotemNavigationProps> = ({
    onPrev,
    onNext,
    totalTotems,
    currentIndex,
    mobileView = false
}) => {

    if (mobileView) {
        // Mobile version - more compact, scrolls with content
        return (
            <div className="flex justify-between items-center px-2 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-900">
                <button
                    onClick={onPrev}
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1 text-sm transition-colors"
                    aria-label="Previous Totem"
                >
                    <ChevronLeft size={16} className="flex-shrink-0" />
                    <span>Prev</span>
                </button>
                
                {totalTotems && currentIndex !== undefined && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2">
                        {currentIndex + 1}/{totalTotems}
                    </div>
                )}
                
                <button
                    onClick={onNext}
                    className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1 text-sm transition-colors"
                    aria-label="Next Totem"
                >
                    <span>Next</span>
                    <ChevronRight size={16} className="flex-shrink-0" />
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Desktop Navigation (bottom bar) */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-2 sm:p-4 flex justify-between items-center">
                <button
                    onClick={onPrev}
                    className="
                        px-3 sm:px-4 py-2 
                        text-gray-600 dark:text-gray-300 
                        hover:bg-gray-100 dark:hover:bg-gray-800 
                        rounded-lg 
                        flex items-center gap-2
                        text-base
                        transition-all duration-300
                    "
                    aria-label="Previous Totem"
                >
                    <ChevronLeft size={20} />
                    Previous Totem
                </button>
                
                {totalTotems && currentIndex !== undefined && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {currentIndex + 1} of {totalTotems}
                    </div>
                )}
                
                <button
                    onClick={onNext}
                    className="
                        px-3 sm:px-4 py-2 
                        text-gray-600 dark:text-gray-300 
                        hover:bg-gray-100 dark:hover:bg-gray-800 
                        rounded-lg 
                        flex items-center gap-2
                        text-base
                        transition-all duration-300
                    "
                    aria-label="Next Totem"
                >
                    Next Totem
                    <ChevronRight size={20} />
                </button>
            </div>
        </>
    );
};

export default TotemNavigation;
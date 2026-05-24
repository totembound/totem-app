import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    isMobile?: boolean;
    /** When true, the "N Total" label is hidden on mobile to save horizontal space. */
    compact?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
    compact = false
}) => {
    const paginationClasses = "sm:flex flex items-center gap-2";
    const containerClasses = "h-10 flex items-center border rounded-lg px-2 bg-white dark:bg-gray-800 dark:border-gray-600";

    return (
        <div className={paginationClasses}>
            {/* Total Items */}
            <span className={`text-sm text-gray-600 dark:text-gray-300 ${compact ? 'hidden sm:inline' : ''}`}>
                {totalItems} Total
            </span>

            {/* Pagination Controls */}
            <div className={containerClasses}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700
                        disabled:opacity-50 text-gray-700 dark:text-gray-300"
                >
                    <ChevronLeft size={18} />
                </button>
                <span
                    className="text-sm px-2 text-gray-700 dark:text-gray-300"
                    aria-label={`Page ${currentPage} of ${totalPages}`}
                >
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    aria-label="Next page"
                    className="p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700
                        disabled:opacity-50 text-gray-700 dark:text-gray-300"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

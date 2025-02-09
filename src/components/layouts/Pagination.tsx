import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    isMobile?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage, 
    totalPages, 
    totalItems, 
    onPageChange,
    isMobile = false
}) => {
    const paginationClasses = isMobile 
        ? "flex items-center justify-between p-4 border-t dark:border-gray-700" 
        : "sm:flex flex items-center gap-2 hidden";

    const containerClasses = isMobile 
        ? ""
        : "h-10 flex items-center border rounded-lg px-2 bg-white dark:bg-gray-800 dark:border-gray-600";

    return (
        <div className={paginationClasses}>
            {/* Total Items */}
            <span className={`text-sm text-gray-600 dark:text-gray-300 ${isMobile ? '' : 'hidden sm:block'}`}>
                {totalItems} Totems
            </span>

            {/* Pagination Controls */}
            <div className={containerClasses}>
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 
                        disabled:opacity-50 dark:text-gray-300"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="text-sm px-2 dark:text-gray-300">
                    {currentPage} / {totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 
                        disabled:opacity-50 dark:text-gray-300"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

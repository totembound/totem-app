import React, { useState } from 'react';
import { 
    LayoutGrid, 
    List, 
    Filter,
    ArrowUpDown,
    Clock,
    Sparkles,
    Heart,
    X
} from 'lucide-react';
import { Rarity, Species } from '../../types/types';
import { Pagination } from './Pagination';

type SortDirection = 'asc' | 'desc';
type SortKey = 'created' | 'experience' | 'happiness' | 'stage';

interface SortConfig {
    key: SortKey;
    direction: SortDirection;
}
interface ToolbarProps {
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    filters: any;
    setFilters: (filters: any) => void;
    sortConfig: SortConfig;
    onSortChange: (key: SortKey) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    viewMode,
    setViewMode,
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    filters,
    setFilters,
    sortConfig,
    onSortChange
}) => {
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const sortOptions = [
        { key: 'created', label: 'Date Acquired', icon: Clock },
        { key: 'experience', label: 'Experience', icon: Sparkles },
        { key: 'happiness', label: 'Happiness', icon: Heart }
    ];

    const isSortKey = (value: string): value is SortKey => {
        return ['created', 'experience', 'happiness'].includes(value);
    };

    const handleSortChange = (value: string) => {
        if (isSortKey(value)) {
            onSortChange(value);
        } else {
            console.error('Invalid sort key:', value);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-sm rounded-t-lg z-10">
            <div className="py-4 sm:py-4">
                {/* Mobile Sort & Filter Bar */}
                <div className="flex items-center gap-2 mb-3 lg:hidden">
                    <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex-1 flex items-center justify-center gap-2 h-10 px-4 
                            bg-gray-100 dark:bg-gray-800 rounded-lg
                            text-gray-700 dark:text-gray-300 text-sm font-medium"
                    >
                        <ArrowUpDown size={16} />
                        Sort
                    </button>
                    <button
                        onClick={() => setIsMobileFiltersOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 h-10 px-4 
                            bg-gray-100 dark:bg-gray-800 rounded-lg
                            text-gray-700 dark:text-gray-300 text-sm font-medium"
                    >
                        <Filter size={16} />
                        Filter
                    </button>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-between">
                    {/* Left Side: Filters (Desktop) */}
                    <div className="hidden lg:flex items-center gap-2">
                        {/* Species Filter */}
                        <select
                            value={filters.species}
                            onChange={(e) => setFilters({...filters, species: e.target.value})}
                            className="h-10 border rounded-lg px-3 text-sm 
                                bg-white dark:bg-gray-800 dark:text-white
                                dark:border-gray-600"
                        >
                            <option value="">All Species</option>
                            {Object.keys(Species)
                                .filter(key => isNaN(Number(key)) && key !== 'None')
                                .map(species => (
                                    <option key={species} value={species}>{species}</option>
                                ))
                            }
                        </select>

                        {/* Rarity Filter */}
                        <select
                            value={filters.rarity}
                            onChange={(e) => setFilters({...filters, rarity: e.target.value})}
                            className="h-10 border rounded-lg px-3 text-sm 
                                bg-white dark:bg-gray-800 dark:text-white 
                                dark:border-gray-600"
                        >
                            <option value="">All Rarities</option>
                            {Object.keys(Rarity)
                                .filter(key => isNaN(Number(key)))
                                .map(rarity => (
                                    <option key={rarity} value={rarity}>{rarity}</option>
                                ))
                            }
                        </select>

                        {/* Stage Filter */}
                        <select
                            value={filters.stage}
                            onChange={(e) => setFilters({...filters, stage: e.target.value})}
                            className="h-10 border rounded-lg px-3 text-sm 
                                bg-white dark:bg-gray-800 dark:text-white 
                                dark:border-gray-600"
                        >
                            <option value="">All Stages</option>
                            {[0,1,2,3,4].map(stage => (
                                <option key={stage} value={stage}>Stage {stage + 1}</option>
                            ))}
                        </select>

                        {/* Affinity Filter */}
                        <select
                            value={filters.affinity}
                            onChange={(e) => setFilters({...filters, affinity: e.target.value})}
                            className="hidden h-10 border rounded-lg px-3 text-sm 
                                bg-white dark:bg-gray-800 dark:text-white 
                                dark:border-gray-600"
                        >
                            <option value="">All Affinities</option>
                            <option value="Strength">Strength</option>
                            <option value="Wisdom">Wisdom</option>
                            <option value="Agility">Agility</option>
                        </select>

                        {/* Domain Filter */}
                        <select
                            value={filters.domain}
                            onChange={(e) => setFilters({...filters, domain: e.target.value})}
                            className="hidden h-10 border rounded-lg px-3 text-sm 
                                bg-white dark:bg-gray-800 dark:text-white 
                                dark:border-gray-600"
                        >
                            <option value="">All Domains</option>
                            <option value="Air">Air</option>
                            <option value="Land">Land</option>
                            <option value="Water">Water</option>
                        </select>
                    </div>

                    {/* Right Side: Desktop View Toggle, Sort & Pagination */}
                    <div className="flex items-center gap-3 ml-auto">
                        {/* Sort Dropdown with Direction Toggle */}
                        <div className="hidden sm:flex flex items-center gap-2">
                            <select
                                value={sortConfig.key}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="h-10 border rounded-lg px-3 text-sm 
                                    bg-white dark:bg-gray-800 dark:text-white 
                                    dark:border-gray-600"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.key} value={option.key}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={() => onSortChange(sortConfig.key)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                                    text-gray-600 dark:text-gray-300"
                                title={`Sort ${sortConfig.direction === 'asc' ? 'Descending' : 'Ascending'}`}
                            >
                                {sortConfig.direction === 'asc' ? (
                                    <ArrowUpDown className="transform rotate-0" />
                                ) : (
                                    <ArrowUpDown className="transform rotate-180" />
                                )}
                            </button>
                        </div>

                        {/* View Toggle - Always Visible */}
                        <div className="flex h-10 border rounded-lg dark:bg-gray-800 dark:border-gray-600">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-4 sm:px-3 flex items-center justify-center sm:justify-start gap-2 rounded-l-lg min-w-[64px] sm:min-w-0
                                    ${viewMode === 'grid' 
                                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400' 
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                title="Grid View"
                            >
                                <LayoutGrid size={20} className="flex-shrink-0" />
                                <span className="text-sm font-medium hidden sm:block">Grid</span>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 sm:px-3 flex items-center justify-center sm:justify-start gap-2 rounded-r-lg border-l min-w-[64px] sm:min-w-0
                                    ${viewMode === 'list' 
                                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400' 
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                title="List View"
                            >
                                <List size={20} className="flex-shrink-0" />
                                <span className="text-sm font-medium hidden sm:block">List</span>
                            </button>
                        </div>

                        {/* Pagination */}
                        <Pagination 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            onPageChange={onPageChange}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Filters Panel */}
            {isMobileFiltersOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
                    <div className="fixed inset-x-0 bottom-14 w-full bg-white dark:bg-gray-800 rounded-t-2xl p-6 space-y-4 z-50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold dark:text-white">Filter Totems</h3>
                            <button 
                                onClick={() => setIsMobileFiltersOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X size={20} className="dark:text-white" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Species Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Species
                                </label>
                                <select
                                    value={filters.species}
                                    onChange={(e) => setFilters({...filters, species: e.target.value})}
                                    className="w-full h-12 border rounded-lg px-3 text-sm 
                                        bg-white dark:bg-gray-700 dark:text-white 
                                        dark:border-gray-600"
                                >
                                    <option value="">All Species</option>
                                    {Object.keys(Species)
                                        .filter(key => isNaN(Number(key)) && key !== 'None')
                                        .map(species => (
                                            <option key={species} value={species}>{species}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            {/* Rarity Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Rarity
                                </label>
                                <select
                                    value={filters.rarity}
                                    onChange={(e) => setFilters({...filters, rarity: e.target.value})}
                                    className="w-full h-12 border rounded-lg px-3 text-sm 
                                        bg-white dark:bg-gray-700 dark:text-white 
                                        dark:border-gray-600"
                                >
                                    <option value="">All Rarities</option>
                                    {Object.keys(Rarity)
                                        .filter(key => isNaN(Number(key)))
                                        .map(rarity => (
                                            <option key={rarity} value={rarity}>{rarity}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            {/* Stage Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Evolution Stage
                                </label>
                                <select
                                    value={filters.stage}
                                    onChange={(e) => setFilters({...filters, stage: e.target.value})}
                                    className="w-full h-12 border rounded-lg px-3 text-sm 
                                        bg-white dark:bg-gray-700 dark:text-white 
                                        dark:border-gray-600"
                                >
                                    <option value="">All Stages</option>
                                    {[0,1,2,3,4].map(stage => (
                                        <option key={stage} value={stage}>Stage {stage + 1}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Affinity Filter */}
                            <div className="hidden">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Affinity
                                </label>
                                <select
                                    value={filters.affinity}
                                    onChange={(e) => setFilters({...filters, affinity: e.target.value})}
                                    className="w-full h-12 border rounded-lg px-3 text-sm 
                                        bg-white dark:bg-gray-700 dark:text-white 
                                        dark:border-gray-600"
                                >
                                    <option value="">All Affinities</option>
                                    <option value="Strength">Strength</option>
                                    <option value="Wisdom">Wisdom</option>
                                    <option value="Agility">Agility</option>
                                </select>
                            </div>

                            {/* Domain Filter */}
                            <div className="hidden">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Domain
                                </label>
                                <select
                                    value={filters.domain}
                                    onChange={(e) => setFilters({...filters, domain: e.target.value})}
                                    className="w-full h-12 border rounded-lg px-3 text-sm 
                                        bg-white dark:bg-gray-700 dark:text-white 
                                        dark:border-gray-600"
                                >
                                    <option value="">All Domains</option>
                                    <option value="Air">Air</option>
                                    <option value="Land">Land</option>
                                    <option value="Water">Water</option>
                                </select>
                            </div>
                            
                            {/* Reset Filters Button */}
                            <button 
                                onClick={() => {
                                    setFilters({
                                        species: '',
                                        rarity: '',
                                        stage: '',
                                        affinity: '',
                                        domain: ''
                                    });
                                    setIsMobileFiltersOpen(false);
                                }}
                                className="w-full py-3 mt-4 bg-purple-600 text-white rounded-lg 
                                    hover:bg-purple-700 transition-colors font-medium"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Sort Menu */}
            {isSortOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
                    <div className="fixed inset-x-0 bottom-14 w-full bg-white dark:bg-gray-800 rounded-t-2xl p-6 z-50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold dark:text-white">Sort Totems</h3>
                            <button 
                                onClick={() => setIsSortOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X size={20} className="dark:text-white" />
                            </button>
                        </div>
                        {/* Mobile Sort Menu */}
                        <div className="space-y-2">
                            {sortOptions.map(option => (
                                <button
                                    key={option.key}
                                    onClick={() => {
                                        handleSortChange(option.key);
                                        setIsSortOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg 
                                        ${sortConfig.key === option.key
                                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400'
                                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <option.icon size={18} />
                                        <span className="font-medium">{option.label}</span>
                                    </div>
                                    {sortConfig.key === option.key && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSortChange(option.key); // This will toggle direction
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                                        >
                                            {sortConfig.direction === 'asc' ? (
                                                <ArrowUpDown className="transform rotate-0" />
                                            ) : (
                                                <ArrowUpDown className="transform rotate-180" />
                                            )}
                                        </button>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Toolbar;
import React, { useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import { useAchievements } from '../../contexts/AchievementsContext';
import { Shield, Trophy, Swords, Sparkles, Crown, CheckCircle2, Lock, Flame, Map, LucideIcon, ChevronDown, ChevronUp } from 'lucide-react';
import Tooltip from '../Tooltip';
import { AchievementCategory, AchievementProgress, AchievementType, AchievementView, Milestone } from '../../types/types';

// Define sort order configurations
const categoryOrder = {
    [AchievementCategory.Collection]: 1,
    [AchievementCategory.Action]: 2,
    [AchievementCategory.Evolution]: 3,
    [AchievementCategory.Streak]: 4,
    [AchievementCategory.Challenge]: 5,
    [AchievementCategory.Expedition]: 6
};

const categoryIcons: Record<AchievementCategory, LucideIcon> = {
    [AchievementCategory.Evolution]: Crown,
    [AchievementCategory.Collection]: Shield,
    [AchievementCategory.Streak]: Flame,
    [AchievementCategory.Action]: Sparkles,
    [AchievementCategory.Challenge]: Swords,
    [AchievementCategory.Expedition]: Map
};

const categoryNames: Record<AchievementCategory, string> = {
    [AchievementCategory.Evolution]: 'Evolution',
    [AchievementCategory.Collection]: 'Collection',
    [AchievementCategory.Streak]: 'Streak',
    [AchievementCategory.Action]: 'Action',
    [AchievementCategory.Challenge]: 'Challenge',
    [AchievementCategory.Expedition]: 'Expedition'
};

type CategoryRefs = {
    [key in AchievementCategory]?: React.RefObject<HTMLDivElement>;
};

interface AchievementCardProps {
    achievement: AchievementView;
}

interface AchievementStats {
    total: number;
    completed: number;
    category: AchievementCategory;
}

// Achievement type priority (OneTime before Progression)
const typeOrder = {
    OneTime: 1,
    Progression: 2
} as const;

type TypeOrderKey = keyof typeof typeOrder;

// Specific achievement ordering within categories
const achievementOrder = {
    // Evolution category
    evolution_progression: 1,
    mixed_affinity_evolution: 2,
    rare_evolution: 3,
    epic_evolution: 4,
    legendary_evolution: 5,
    color_collector_evolution: 6,
    
    // Collection category
    collector_progression: 1,
    species_mastery: 2,
    rare_collector: 3,
    epic_collector: 4,
    legendary_collector: 5,
    affinity_specialist: 6,
    affinity_diversity: 7,
    domain_specialist: 8,
    domain_diversity: 9,
    anti_meta_collector: 10,
    seasonal_collector: 11,

    // Streak category
    login_progression: 1,
    persistence_reward: 2,
    referral_master: 3,
    community_ambassador: 4,

    // Action category
    train_progression: 1,
    feed_progression: 2,
    treat_progression: 3,
    balanced_care: 4,
    
    // Challenge category
    challenge_initiate: 1,
    challenge_progression: 2,
    
    // Expedition category
    expedition_explorer: 1,
    expedition_progression: 2
};
type AchievementOrderKey = keyof typeof achievementOrder;

const useAchievementOrderHashes = () => {
    return useMemo(() => {
        const hashedOrder: Record<string, number> = {};
        
        Object.entries(achievementOrder).forEach(([key, value]) => {
            const hashedKey = ethers.id(key);
            hashedOrder[hashedKey] = value;
        });
        
        return hashedOrder;
    }, []); // Empty dependency array ensures this is calculated only once
};

const DialChart: React.FC<{
    value: number;
    Icon: React.FC<any>;
    label: string;
    sublabel: string;
    onClick?: () => void;
}> = ({ value, Icon, label, sublabel, onClick }) => {
     // Calculate the circle's circumference - using smaller radius for mobile
     const mobileRadius = 24;
     const desktopRadius = 32;
     const mobileCircumference = 2 * Math.PI * mobileRadius;
     const desktopCircumference = 2 * Math.PI * desktopRadius;
     
     // Calculate progress for both sizes
     const mobileProgress = (value / 100) * mobileCircumference;
     const desktopProgress = (value / 100) * desktopCircumference;
     const mobileRemainingDash = mobileCircumference - mobileProgress;
     const desktopRemainingDash = desktopCircumference - desktopProgress;
 
     return (
         <div 
             className={`flex flex-col items-center ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
             onClick={onClick}
         >
             {/* Mobile version */}
             <div className="relative w-16 h-16 sm:hidden">
                 <svg className="w-full h-full transform -rotate-90">
                     <circle
                         cx="32"
                         cy="32"
                         r={mobileRadius}
                         stroke="currentColor"
                         strokeWidth="3"
                         fill="transparent"
                         className="text-gray-200 dark:text-gray-700"
                     />
                     <circle
                         cx="32"
                         cy="32"
                         r={mobileRadius}
                         stroke="currentColor"
                         strokeWidth="3"
                         fill="transparent"
                         strokeDasharray={mobileCircumference}
                         strokeDashoffset={mobileRemainingDash}
                         className="text-purple-500 dark:text-purple-400 transition-all duration-500"
                     />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                     <Icon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                 </div>
             </div>
 
             {/* Desktop version */}
             <div className="relative w-24 h-24 hidden sm:block">
                 <svg className="w-full h-full transform -rotate-90">
                     <circle
                         cx="48"
                         cy="48"
                         r={desktopRadius}
                         stroke="currentColor"
                         strokeWidth="4"
                         fill="transparent"
                         className="text-gray-200 dark:text-gray-700"
                     />
                     <circle
                         cx="48"
                         cy="48"
                         r={desktopRadius}
                         stroke="currentColor"
                         strokeWidth="4"
                         fill="transparent"
                         strokeDasharray={desktopCircumference}
                         strokeDashoffset={desktopRemainingDash}
                         className="text-purple-500 dark:text-purple-400 transition-all duration-500"
                     />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                     <Icon className="w-8 h-8 text-gray-600 dark:text-gray-300" />
                 </div>
             </div>
 
             {/* Text content with responsive sizing */}
             <div className="mt-1 sm:mt-2 text-center">
                 <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                     {label}
                 </div>
                 <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                     {sublabel}
                 </div>
             </div>
         </div>
     );
};

interface AchievementStatsRowProps {
    achievements: Record<AchievementCategory, AchievementView[]>;
    progress: Record<string, AchievementProgress>;
    onCategoryClick: (category: AchievementCategory) => void;
}

const AchievementStatsRow: React.FC<AchievementStatsRowProps> = ({ 
    achievements, 
    progress,
    onCategoryClick 
}) => {
    // Calculate stats for each category including milestones
    const calculateStats = (category: AchievementCategory): AchievementStats => {
        const categoryAchievements = achievements[category] || [];
        
        let totalCount = 0;
        let completedCount = 0;
        
        categoryAchievements.forEach(achievement => {
            const achievementType = Number(achievement.achievementType) as AchievementType;
            if (achievementType === AchievementType.Progression) {
                if (achievement.milestones.length > 0) {
                    totalCount += achievement.milestones.length;
                    // Count completed milestones
                    const achievementProgress = progress[achievement.id];
                    if (achievementProgress?.unlockedMilestones) {
                        completedCount += achievementProgress.unlockedMilestones.filter(Boolean).length;
                    }
                }
            } else {
                totalCount++;
                if (achievement.isCompleted) {
                    completedCount++;
                }
            }
        });
    
        return { total: totalCount, completed: completedCount, category };
    };

    // Get stats using our custom category order
    const stats = Object.entries(categoryOrder)
        .sort(([, orderA], [, orderB]) => orderA - orderB)
        .map(([category]) => calculateStats(Number(category) as AchievementCategory));

    // Calculate total completion percentage
    const totalAchievements = stats.reduce((sum, stat) => sum + stat.total, 0);
    const totalCompleted = stats.reduce((sum, stat) => sum + stat.completed, 0);
    const totalPercentage = totalAchievements > 0 
        ? Math.round((totalCompleted / totalAchievements) * 100) 
        : 0;

    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 pb-6">
            <div className="w-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-7 gap-2 sm:gap-26">
                {/* Total Progress */}
                <div className="col-span-2 sm:col-span-1">
                    <DialChart
                        value={totalPercentage}
                        Icon={Trophy}
                        label={`${totalPercentage}%`}
                        sublabel={`${totalCompleted}/${totalAchievements}`}
                    />
                </div>
                {/* Category Progress */}
                {stats.map(stat => {
                    const percentage = stat.total > 0 
                        ? Math.round((stat.completed / stat.total) * 100) 
                        : 0;
                    
                    const Icon = categoryIcons[stat.category];
                    
                    return (
                        <Tooltip 
                            key={stat.category} 
                            content={`${categoryNames[stat.category]}: ${Math.round(stat.completed)} of ${stat.total} completed\n(includes achievements & milestones)`}
                        >
                            <div className="relative z-10">
                                <DialChart
                                    value={percentage}
                                    Icon={Icon}
                                    label={`${Math.round(percentage)}%`}
                                    sublabel={`${Math.round(stat.completed)}/${stat.total}`}
                                    onClick={() => onCategoryClick(stat.category)}
                                />
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};

const getBadgeUri = (uri: string | undefined) => {
    if (!uri) return "";
    if (uri?.startsWith('ipfs://badge')) return "";
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
};

const AchievementBadge: React.FC<{
    achievement: AchievementView;
    hasPrereqs: boolean;
    progress?: AchievementProgress;
}> = ({ achievement, hasPrereqs, progress }) => {
    const DefaultIcon = categoryIcons[achievement.category] || Trophy;
    const uri = getBadgeUri(achievement.badgeUri);

    // For progression achievements, check if any milestone is completed
    const hasStartedProgress = achievement.achievementType === AchievementType.Progression && 
                             achievement.currentCount > 0;

    const allMilestonesCompleted = achievement.milestones.length > 0 && 
        progress?.unlockedMilestones?.length === achievement.milestones.length &&
        progress?.unlockedMilestones?.every(completed => completed === true);

    // Determine badge color based on achievement state
    const getBadgeColor = () => {
        if (achievement.isCompleted || allMilestonesCompleted) {
            return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400';
        }
        
        if (!hasPrereqs) {
            return 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500';
        }
        
        if (hasStartedProgress) {
            return 'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400';
        }
        
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400';
    };

    return (
        <Tooltip content={achievement.description}>
            <div className={`
                relative flex items-center justify-center w-12 h-12 rounded-full
                ${getBadgeColor()}
            `}>
                {uri ? (
                    <img 
                        src={uri}
                        alt={achievement.name}
                        className="w-8 h-8 object-contain"
                    />
                ) : (
                    <DefaultIcon className={`w-8 h-8 ${
                        (achievement.isCompleted || allMilestonesCompleted) ? 
                        'text-purple-500 dark:text-purple-400' : ''
                    }`} />
                )}
                {achievement.isCompleted && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                )}
                {!achievement.isCompleted && achievement.requirements.length > 0 && !hasPrereqs && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500 rounded-full border-2 border-white dark:border-gray-800">
                        <Lock className="w-4 h-4 text-white" />
                    </div>
                )}
                {hasStartedProgress && !achievement.isCompleted && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800">
                        <div className="w-3 h-3 bg-white rounded-full m-0.5" />
                    </div>
                )}
            </div>
        </Tooltip>
    );
};

const MilestoneProgress: React.FC<{
    milestone: Milestone;
    currentCount: bigint;
    isUnlocked: boolean;
    badgeUri?: string;
}> = ({ milestone, currentCount, isUnlocked, badgeUri }) => {
    const requirement = Number(milestone.requirement);
    const count = Number(currentCount);
    const progress = Math.min((count / requirement) * 100, 100);
    const uri = getBadgeUri(badgeUri);

    return (
        <div className="flex items-center gap-4">
            <Tooltip content={milestone.description}>
                <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${isUnlocked 
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}
                `}>
                    {uri ? (
                        <img 
                            src={uri}
                            alt={milestone.name}
                            className="w-8 h-8 object-contain"
                        />
                    ) : (
                        <Trophy className="w-6 h-6" />
                    )}
                </div>
            </Tooltip>
            <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className={`font-medium ${
                        isUnlocked ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                        {milestone.name}
                    </span>
                    <span className="text-gray-500">
                        {count.toLocaleString()}/{requirement.toLocaleString()}
                    </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                            isUnlocked ? 'bg-purple-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
    const { achievementsById, progress } = useAchievements();
    const achievementProgress = progress[achievement.id];

    // Check if all prerequisites are met
    const hasPrereqs = achievement.requirements.length === 0 ||
        achievement.requirements.every(reqId =>
            achievementsById[reqId]?.isCompleted
        );
    
    return (
        <div className={`
            bg-white dark:bg-gray-800 rounded-lg p-4 border 
            ${!achievement.isCompleted && !hasPrereqs
                ? 'border-red-200 dark:border-red-800/50'
                : 'border-gray-200 dark:border-gray-700'}
            transition-all duration-200 hover:shadow-md flex flex-col
        `}>
            <div className="flex items-start gap-4 flex-grow">
                <AchievementBadge
                    achievement={achievement}
                    hasPrereqs={hasPrereqs}
                    progress={achievementProgress}
                />
                <div className="flex-1 flex flex-col min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {achievement.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                        {achievement.description}
                    </p>
                </div>
            </div>
            <div>
                {achievement.milestones.length > 0 && (
                    <div className="space-y-4 mt-4">
                    {achievement.milestones.map((milestone, index) => (
                        <MilestoneProgress
                        key={index}
                        milestone={milestone}
                        badgeUri={milestone.badgeUri}
                        currentCount={achievement.currentCount}
                        isUnlocked={achievementProgress?.unlockedMilestones[index] || false}
                        />
                    ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const CategorySection: React.FC<{
    category: AchievementCategory;
    achievements: AchievementView[];
    isExpanded: boolean;
    onToggle: () => void;
}> = ({ category, achievements, isExpanded, onToggle }) => {
    const Icon = categoryIcons[category];
    const achievementOrderHashes = useAchievementOrderHashes();

    // Sort achievements within the category
    const sortedAchievements = useMemo(() => {
        return [...achievements].sort((a, b) => {
            // First sort by specific achievement order if defined
            const aOrder = achievementOrderHashes[a.id] || 999;
            const bOrder = achievementOrderHashes[b.id] || 999;
            if (aOrder !== bOrder) return aOrder - bOrder;
            
            // Then sort by achievement type
            if (a.achievementType !== b.achievementType) {
                const aTypeName = AchievementType[a.achievementType] as keyof typeof AchievementType;
                const bTypeName = AchievementType[b.achievementType] as keyof typeof AchievementType;
            
                return typeOrder[aTypeName] - typeOrder[bTypeName];
            }
            
            // Finally sort by name
            return a.name.localeCompare(b.name);
        });
    }, [achievements]);
    
    return (
        <div className={`
            mt-4 rounded-lg transition-all duration-200
            ${isExpanded ? 'bg-gray-50/50 dark:bg-gray-800/50 shadow-sm' : ''}
        `}>
            <button 
                onClick={onToggle}
                className={`
                    w-full flex items-center justify-between p-4 
                    rounded-lg transition-colors
                    ${isExpanded 
                        ? 'bg-purple-50 dark:bg-purple-900/20 shadow-sm' 
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}
                `}
            >
                <div className="flex items-center gap-3">
                    <Icon className={`
                        w-8 h-8 transition-colors
                        ${isExpanded 
                            ? 'text-purple-600 dark:text-purple-400' 
                            : 'text-purple-500'}
                    `} />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {categoryNames[category]}
                    </h2>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                )}
            </button>

            {isExpanded && (
                <div className="grid grid-cols-1 gap-4 p-4">
                    {sortedAchievements.map(achievement => (
                        <AchievementCard
                            key={achievement.id}
                            achievement={achievement}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Achievements: React.FC = () => {
    const { achievements, progress, isLoading, error } = useAchievements();

    // Initialize expanded categories with proper type filtering
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(() => {
        const numericCategories = Object.values(AchievementCategory)
            .filter((v): v is number => typeof v === 'number');
        return new Set(numericCategories);
    });
    
    const isAllExpanded = useMemo(() => {
        const numericCategories = Object.values(AchievementCategory)
            .filter((v): v is number => typeof v === 'number');
        return numericCategories.every(category => expandedCategories.has(category));
    }, [expandedCategories]);

    const toggleAll = () => {
        const numericCategories = Object.values(AchievementCategory)
            .filter((v): v is number => typeof v === 'number');
        
        setExpandedCategories(prev => {
            if (isAllExpanded) {
                return new Set(); // Collapse all
            } else {
                return new Set(numericCategories); // Expand all
            }
        });
    };

    // Create refs at the top level
    const categoryRefs = {
        [AchievementCategory.Evolution]: useRef<HTMLDivElement>(null),
        [AchievementCategory.Collection]: useRef<HTMLDivElement>(null),
        [AchievementCategory.Streak]: useRef<HTMLDivElement>(null),
        [AchievementCategory.Action]: useRef<HTMLDivElement>(null),
        [AchievementCategory.Challenge]: useRef<HTMLDivElement>(null),
        [AchievementCategory.Expedition]: useRef<HTMLDivElement>(null)
    };
    
    const toggleCategory = (category: number) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(category)) {
                next.delete(category);
            } else {
                next.add(category);
            }
            return next;
        });
    };

    const scrollToCategory = (category: AchievementCategory) => {
        const ref = categoryRefs[category]?.current;
        if (ref) {
            // Get the page header height plus some padding
            const headerOffset = 66; 

            if (!expandedCategories.has(category)){
                toggleCategory(category);
            }
            // Calculate the element's position relative to the viewport
            const elementPosition = ref.getBoundingClientRect().top;
            // Get the current scroll position
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            // Smooth scroll to the adjusted position
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    // Sort categories by defined order
    const sortedCategories = useMemo(() => {
        return Object.entries(achievements)
            .sort(([catA], [catB]) => {
                const orderA = categoryOrder[Number(catA) as AchievementCategory] || 999;
                const orderB = categoryOrder[Number(catB) as AchievementCategory] || 999;
                return orderA - orderB;
            });
    }, [achievements]);

    if (isLoading) {
        return (
            <div className="p-6 text-center">
                <span className="text-gray-600 dark:text-gray-400">Loading achievements...</span>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg pb-6">
            {/* Header Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Achievements
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Track your progress and unlock rewards as you grow in wisdom and power.
                        </p>
                    </div>
                    <button
                        onClick={toggleAll}
                        className="p-2 text-gray-500 text-nowrap hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                        title={isAllExpanded ? "Collapse All" : "Expand All"}
                    >
                        {isAllExpanded ? (
                            <>
                                <ChevronUp className="w-5 h-5" />
                                <span className="text-sm hidden sm:block">Collapse All</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-5 h-5" />
                                <span className="text-sm hidden sm:block">Expand All</span>
                            </>
                        )}
                    </button>
                </div>
                
                {/* Add stats row */}
                {!isLoading && !error && (
                    <AchievementStatsRow 
                        achievements={achievements} 
                        progress={progress} 
                        onCategoryClick={scrollToCategory} 
                    />
                )}

                {error ? (
                    <div className="p-6 text-center text-red-500">{error}</div>
                ) : (
                    <>
                        {sortedCategories.map(([category, categoryAchievements]) => (
                            <div 
                                key={category}
                                ref={categoryRefs[Number(category) as AchievementCategory]}
                                // Add class to provide scroll margin
                                className="scroll-mt-24"
                            >
                                <CategorySection
                                    key={category}
                                    category={Number(category) as AchievementCategory}
                                    achievements={categoryAchievements}
                                    isExpanded={expandedCategories.has(Number(category))}
                                    onToggle={() => toggleCategory(Number(category))}
                                />
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default Achievements;
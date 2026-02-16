/**
 * UserContext - Web2 REST API version
 *
 * Manages user state including totems, balances, and game preferences.
 * This version uses REST API calls via ApiClient instead of smart contracts.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserContextType, UserContextState, ActionType, TotemData, AccountType, RateLimitError } from '../types/types';
import { STORAGE_KEYS } from '../config/constants';
import { getUserStorage, setUserStorage } from '../utils/localStorage';
import apiClient from '../services/ApiClient';
import { useAuth } from './AuthContext';
import { getTotemImageUrl, getStageName } from '../utils/species';

export const UserContext = createContext<UserContextType | null>(null);
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();

    const [state, setState] = useState<UserContextState>({
        isConnected: false,
        isSignedUp: false,
        address: '',
        essenceBalance: '0',
        gemsBalance: '0',
        totems: [],
        totemLoading: false,
        totemError: null,
        tutorialWizardVisible: true,
        messageDialog: {
            isOpen: false,
            title: '',
            message: ''
        },
        accountType: 'Free',
        comingSoon: false,
        linkTracking: {},
        rateLimitState: {
            isExceeded: false,
            resetTime: null,
            currentUsage: 0,
            dailyLimit: 0
        }
    });

    const [midnightTimeout, setMidnightTimeout] = useState<NodeJS.Timeout | null>(null);
    const [totems, setTotems] = useState<TotemData[]>([]);
    const [totemLoading, setTotemLoading] = useState(false);
    const [totemError, setTotemError] = useState<string | null>(null);
    const [_totemCache, setTotemCache] = useState<Map<string, TotemData>>(new Map());
    const [linkTracking, setLinkTracking] = useState<Record<string, any>>(
        getUserStorage(STORAGE_KEYS.linkTracking, user?.id || '', {})
    );

    // Rate limit callback
    const handleRateLimitUpdate = useCallback((resetTime: string | null, currentUsage: number, dailyLimit: number, isExceeded: boolean) => {
        setState(prev => ({
            ...prev,
            rateLimitState: {
                resetTime,
                currentUsage,
                dailyLimit,
                isExceeded
            }
        }));
    }, []);

    const showError = (title: string, message: string, isRateLimit = false) => {
        setState(prev => ({
            ...prev,
            messageDialog: {
                isOpen: true,
                title,
                message,
                isRateLimit,
                isSuccess: false
            }
        }));
    };

    const showSuccess = (title: string, message: string) => {
        setState(prev => ({
            ...prev,
            messageDialog: {
                isOpen: true,
                title,
                message,
                isRateLimit: false,
                isSuccess: true
            }
        }));
    };

    const handleRateLimitError = (error: RateLimitError) => {
        handleRateLimitUpdate(error.resetTime, error.currentUsage, error.dailyLimit, true);
        showError(
            'API Limit Reached',
            'You have reached your daily API usage limit. Your quota will reset at midnight UTC.',
            true
        );
    };

    const hideError = () => {
        setState(prev => ({
            ...prev,
            messageDialog: {
                ...prev.messageDialog,
                isOpen: false
            }
        }));
    };

    const canSpendEssence = (amount: number) => {
        const balance = Number(state.essenceBalance);
        return balance >= amount;
    };

    const canSpendGems = (amount: number) => {
        const balance = Number(state.gemsBalance);
        return balance >= amount;
    };

    const trackLink = useCallback((linkId: string, _metadata?: Record<string, any>) => {
        setLinkTracking(prev => {
            const updated = {
                ...prev,
                [linkId]: true
            };

            if (user?.id) {
                setUserStorage(STORAGE_KEYS.linkTracking, user.id, updated);
            }

            return updated;
        });
    }, [user?.id]);

    const hasClickedLink = useCallback((linkId: string) => {
        return linkTracking[linkId];
    }, [linkTracking]);

    // Web2: Fetch totems via REST API
    const fetchTotems = useCallback(async () => {
        if (!apiClient.isAuthenticated()) return;

        setTotemLoading(true);
        setTotemError(null);

        try {
            const response = await apiClient.getTotems();

            if (response.success && response.data) {
                // Transform API response to TotemData format
                const totemList: TotemData[] = response.data.map((totem: any) => ({
                    id: totem.id,
                    name: totem.name,
                    displayName: getStageName(totem.attributes?.species || 0, totem.attributes?.color || 0, totem.attributes?.stage || 0),
                    description: totem.description,
                    image: getTotemImageUrl(totem.attributes?.species || 0, totem.attributes?.color || 0, totem.attributes?.stage || 0) || totem.image,
                    affinity: totem.affinity,
                    domain: totem.domain,
                    attributes: {
                        species: totem.attributes?.species || 0,
                        color: totem.attributes?.color || 0,
                        rarity: totem.attributes?.rarity || 0,
                        happiness: totem.attributes?.happiness || 50,
                        experience: totem.attributes?.experience || 0,
                        stage: totem.attributes?.stage || 0,
                        strength: totem.attributes?.strength || 10,
                        agility: totem.attributes?.agility || 10,
                        wisdom: totem.attributes?.wisdom || 10,
                        isStaked: false,
                        nickname: totem.attributes?.nickname || null,
                        prestigeLevel: totem.attributes?.prestigeLevel || 0
                    },
                    trackings: totem.trackings || {}
                }));

                setTotems(totemList);

                // Update cache
                const newCache = new Map<string, TotemData>();
                totemList.forEach(totem => {
                    newCache.set(totem.id, totem);
                });
                setTotemCache(newCache);
            } else {
                setTotems([]);
            }
        } catch (err) {
            console.error('Error fetching totems:', err);
            setTotemError('Failed to load your Totems. Please try again.');
        } finally {
            setTotemLoading(false);
        }
    }, []);

    // Web2: Update totem after evolution
    const updateTotemEvolved = async (totemId: string) => {
        if (!apiClient.isAuthenticated()) return;

        try {
            const response = await apiClient.getTotem(totemId);

            if (response.success && response.data) {
                const totemData = response.data as any;

                setTotems(prev => prev.map(totem => {
                    if (totem.id !== totemId) return totem;
                    const newStage = totemData.attributes?.stage || totem.attributes.stage;
                    const speciesId = totemData.attributes?.species || totem.attributes.species;
                    const colorId = totemData.attributes?.color || totem.attributes.color;
                    return {
                        ...totem,
                        name: totemData.name,
                        displayName: getStageName(speciesId, colorId, newStage),
                        image: getTotemImageUrl(speciesId, colorId, newStage) || totemData.image,
                        attributes: {
                            ...totem.attributes,
                            happiness: totemData.attributes?.happiness || totem.attributes.happiness,
                            experience: totemData.attributes?.experience || totem.attributes.experience,
                            stage: newStage,
                            nickname: totemData.attributes?.nickname || totem.attributes.nickname,
                            prestigeLevel: totemData.attributes?.prestigeLevel || 0
                        },
                    };
                }));

                // Update cache
                setTotemCache(prev => {
                    const updated = new Map(prev);
                    updated.delete(totemId);
                    return updated;
                });
            }

            await updateBalances();
        } catch (error) {
            console.error('Error updating totem:', error);
            throw error;
        }
    };

    // Web2: Update single totem after action
    const updateTotem = async (totemId: string, type: ActionType) => {
        if (!apiClient.isAuthenticated()) return;

        try {
            const response = await apiClient.getTotem(totemId);

            if (response.success && response.data) {
                const totemData = response.data as any;

                if (type === ActionType.None) {
                    // Update single totem in minimal state, no tracking
                    setTotems(prev => prev.map(totem =>
                        totem.id === totemId ? {
                            ...totem,
                            attributes: {
                                ...totem.attributes,
                                happiness: totemData.attributes?.happiness || totem.attributes.happiness,
                                experience: totemData.attributes?.experience || totem.attributes.experience,
                                stage: totemData.attributes?.stage || totem.attributes.stage,
                                nickname: totemData.attributes?.nickname || totem.attributes.nickname,
                                prestigeLevel: totemData.attributes?.prestigeLevel || 0
                            }
                        } : totem
                    ));
                } else {
                    // Update totem with tracking data
                    setTotems(prev => prev.map(totem =>
                        totem.id === totemId ? {
                            ...totem,
                            attributes: {
                                ...totem.attributes,
                                happiness: totemData.attributes?.happiness || totem.attributes.happiness,
                                experience: totemData.attributes?.experience || totem.attributes.experience,
                                stage: totemData.attributes?.stage || totem.attributes.stage,
                                nickname: totemData.attributes?.nickname || totem.attributes.nickname,
                                prestigeLevel: totemData.attributes?.prestigeLevel || 0
                            },
                            trackings: totemData.trackings || totem.trackings
                        } : totem
                    ));
                }

                // Check if evolution occurred
                const currentTotem = totems.find(t => t.id === totemId);
                if (currentTotem && totemData.attributes?.stage !== currentTotem.attributes.stage) {
                    // Refresh totem data after evolution
                    await fetchTotems();
                }
            }

            await updateBalances();
        } catch (error) {
            console.error('Error updating totem:', error);
            throw error;
        }
    };

    const getTotem = (totemId: string) => {
        return totems?.find(t => t.id === totemId);
    };

    // Web2: Add new totem to local state (after purchase)
    const addTotem = async (totemId: string) => {
        if (!apiClient.isAuthenticated()) return;

        try {
            const response = await apiClient.getTotem(totemId);

            if (response.success && response.data) {
                const totemData = response.data as any;

                const speciesId = totemData.attributes?.species || 0;
                const colorId = totemData.attributes?.color || 0;
                const stage = totemData.attributes?.stage || 0;
                const newTotem: TotemData = {
                    id: totemId,
                    name: totemData.name,
                    displayName: getStageName(speciesId, colorId, stage),
                    description: totemData.description,
                    image: getTotemImageUrl(speciesId, colorId, stage) || totemData.image,
                    affinity: totemData.affinity,
                    domain: totemData.domain,
                    attributes: {
                        species: speciesId,
                        color: colorId,
                        rarity: totemData.attributes?.rarity || 0,
                        happiness: totemData.attributes?.happiness || 50,
                        experience: totemData.attributes?.experience || 0,
                        stage,
                        strength: totemData.attributes?.strength || 10,
                        agility: totemData.attributes?.agility || 10,
                        wisdom: totemData.attributes?.wisdom || 10,
                        isStaked: false,
                        nickname: totemData.attributes?.nickname || null,
                        prestigeLevel: totemData.attributes?.prestigeLevel || 0
                    },
                    trackings: totemData.trackings || {}
                };

                setTotemCache(prev => new Map(prev.set(totemId, newTotem)));
                setTotems(prev => [...prev, newTotem]);
            }
        } catch (err) {
            console.error('Error adding new totem:', err);
            throw err;
        }
    };

    const removeTotem = (totemId: string) => {
        setTotems(prev => prev.filter(totem => totem.id !== totemId));
        setTotemCache(prev => {
            const updated = new Map(prev);
            updated.delete(totemId);
            return updated;
        });
    };

    // Update a totem's nickname directly in state
    const updateTotemNickname = (totemId: string, nickname: string | null) => {
        setTotems(prev => prev.map(totem =>
            totem.id === totemId ? {
                ...totem,
                attributes: {
                    ...totem.attributes,
                    nickname
                }
            } : totem
        ));
    };

    // Update totem attributes locally (no API call) - used for immediate UI updates after actions
    const updateTotemAttributes = useCallback((
        totemId: string,
        updates: {
            experience?: number;
            happiness?: number;
            stage?: number;
            nickname?: string | null;
            displayName?: string;
            strength?: number;
            agility?: number;
            wisdom?: number;
        }
    ) => {
        setTotems(prev => prev.map(totem => {
            if (totem.id !== totemId) return totem;
            const newStage = updates.stage !== undefined ? updates.stage : totem.attributes.stage;
            // Recalculate image URL and display name when stage changes
            const newImage = updates.stage !== undefined
                ? getTotemImageUrl(totem.attributes.species, totem.attributes.color, newStage)
                : totem.image;
            const newDisplayName = updates.stage !== undefined
                ? getStageName(totem.attributes.species, totem.attributes.color, newStage)
                : (updates.displayName !== undefined ? updates.displayName : totem.displayName);
            return {
                ...totem,
                image: newImage,
                displayName: newDisplayName,
                attributes: {
                    ...totem.attributes,
                    ...(updates.experience !== undefined && { experience: updates.experience }),
                    ...(updates.happiness !== undefined && { happiness: updates.happiness }),
                    ...(updates.stage !== undefined && { stage: updates.stage }),
                    ...(updates.nickname !== undefined && { nickname: updates.nickname }),
                    ...(updates.strength !== undefined && { strength: updates.strength }),
                    ...(updates.agility !== undefined && { agility: updates.agility }),
                    ...(updates.wisdom !== undefined && { wisdom: updates.wisdom }),
                }
            };
        }));
    }, []);

    // Web2: Update balances from user profile
    const updateBalances = useCallback(async () => {
        if (!apiClient.isAuthenticated()) return;

        try {
            const response = await apiClient.getProfile();

            if (response.success && response.data) {
                const { currencies } = response.data;
                setState(prev => ({
                    ...prev,
                    essenceBalance: String(currencies?.essence || 0),
                    gemsBalance: String(currencies?.gems || 0)
                }));
            }
        } catch (error) {
            console.error('Error updating balances:', error);
        }
    }, []);

    // Set essence balance directly from inline response data (no API call)
    const setEssenceBalance = useCallback((balance: number) => {
        setState(prev => ({
            ...prev,
            essenceBalance: String(balance)
        }));
    }, []);

    // Web2: Update achievement status via REST API
    const updateAchievementStatus = async () => {
        if (!apiClient.isAuthenticated()) return;

        try {
            const response = await apiClient.getAchievements();

            if (response.success && response.data) {
                // Web2: Check for specific achievements that unlock features
                // API format: { "ach_id": [{ unlocked: bool, progress: number }, ...] }
                const achievements = response.data.achievements || {};

                // Check login progression - first milestone's progress is the login count
                const loginMilestones = achievements['ach_login_progression'] || [];
                const loginProgress = loginMilestones[0]?.progress ?? 0;

                // Check evolution progression - check if first milestone is unlocked
                const evolutionMilestones = achievements['ach_evolution_progression'] || [];
                const hasEvolved = evolutionMilestones[0]?.unlocked ?? false;

                setState(prev => ({
                    ...prev,
                    hasWeeklyUnlocked: loginProgress >= 7,
                    hasStakingUnlocked: hasEvolved
                }));
            }
        } catch (error) {
            console.error("Error checking achievement status:", error);
        }
    };

    const setTutorialWizardVisible = (visible: boolean) => {
        if (user?.id) {
            setUserStorage(STORAGE_KEYS.tutorialWizardVisible, user.id, visible);
        }
        setState(prev => ({ ...prev, tutorialWizardVisible: visible }));
    };

    // Load link tracking data when user changes
    useEffect(() => {
        if (user?.id) {
            const userLinkTracking = getUserStorage(STORAGE_KEYS.linkTracking, user.id, {});
            setLinkTracking(userLinkTracking);
        } else {
            setLinkTracking({});
        }
    }, [user?.id]);

    // Sync isConnected/isSignedUp with AuthContext
    useEffect(() => {
        setState(prev => ({
            ...prev,
            isConnected: isAuthenticated,
            isSignedUp: isAuthenticated,
            address: user?.id || '',
            essenceBalance: String(user?.currencies?.essence ?? 0),
            gemsBalance: String(user?.currencies?.gems || 0),
            tutorialWizardVisible: user?.id
                ? getUserStorage(STORAGE_KEYS.tutorialWizardVisible, user.id, window.innerWidth >= 640)
                : window.innerWidth >= 640
        }));
    }, [isAuthenticated, user]);

    // Setup refresh timers when authenticated
    useEffect(() => {
        if (!isAuthenticated) return;

        // Calculate time until next UTC midnight
        const getTimeUntilMidnight = () => {
            const now = new Date();
            const tomorrow = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + 1,
                0, 0, 0
            ));
            return tomorrow.getTime() - now.getTime();
        };

        // Handle midnight rollover
        const handleMidnightRollover = async () => {
            try {
                await Promise.all([
                    updateAchievementStatus(),
                    updateBalances()
                ]);
            } catch (error) {
                console.error('Error handling midnight rollover:', error);
            }
        };

        // Initial load of balances and achievements
        const initialLoad = async () => {
            try {
                await Promise.all([
                    updateBalances(),
                    updateAchievementStatus()
                ]);
            } catch (error) {
                console.error('Error loading initial state:', error);
            }
        };

        // Check for midnight rollover (daily rewards reset)
        const now = new Date();
        if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
            handleMidnightRollover();
        }

        // Set up midnight timer for daily reset
        const timeUntilMidnight = getTimeUntilMidnight();
        const midnight = setTimeout(async () => {
            await handleMidnightRollover();
            setMidnightTimeout(setInterval(handleMidnightRollover, 24 * 60 * 60 * 1000));
        }, timeUntilMidnight);

        setMidnightTimeout(midnight);

        // Load initial state (no polling - state updates after user actions)
        initialLoad();

        return () => {
            if (midnightTimeout) clearTimeout(midnightTimeout);
        };
    }, [isAuthenticated, updateBalances]);

    // Fetch totems when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchTotems();
        } else {
            setTotems([]);
            setTotemCache(new Map());
        }
    }, [isAuthenticated, fetchTotems]);

    // Web2: connect/disconnect are no-ops (handled by AuthContext)
    const connect = async () => {
        // In Web2, authentication is handled by AuthContext
        console.log('connect() called - use AuthContext.login() instead');
    };

    const disconnect = () => {
        // In Web2, logout is handled by AuthContext
        localStorage.removeItem(STORAGE_KEYS.notifications);
        setState(prev => ({
            ...prev,
            totems: [],
            address: '',
            isSignedUp: false,
            isConnected: false
        }));
    };

    const updateAccountType = () => {
        // In Web2, account type is based on user tier from profile
        const accountType: AccountType = user?.tier === 'premium' ? 'Premium' : 'Free';
        setState(prev => ({ ...prev, accountType }));
        return accountType;
    };

    const checkSignupStatus = useCallback(async () => {
        // In Web2, signup status is managed by AuthContext
        setState(prev => ({ ...prev, isSignedUp: isAuthenticated }));
    }, [isAuthenticated]);

    return (
        <UserContext.Provider
            value={{
                isSignedUp: state.isSignedUp,
                essenceBalance: state.essenceBalance,
                gemsBalance: state.gemsBalance,
                isConnected: state.isConnected,
                address: state.address,
                checkSignupStatus,
                updateBalances,
                setEssenceBalance,
                connect,
                disconnect,
                totems,
                totemLoading,
                totemError,
                getTotem,
                fetchTotems,
                updateTotemNickname,
                updateTotemAttributes,
                addTotem,
                removeTotem,
                updateTotem,
                updateTotemEvolved,
                updateAchievementStatus,
                messageDialog: state.messageDialog,
                showError,
                showSuccess,
                hideError,
                accountType: state.accountType,
                updateAccountType,
                comingSoon: false,
                canSpendEssence,
                canSpendGems,
                tutorialWizardVisible: state.tutorialWizardVisible,
                setTutorialWizardVisible,
                linkTracking,
                trackLink,
                hasClickedLink,
                rateLimitState: state.rateLimitState,
                handleRateLimitUpdate,
                handleRateLimitError,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

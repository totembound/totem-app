// contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { UserContextType, UserContextState, ActionType, ActionTracking, StreakStatus, WeeklyStatus, NFTMetadata, TokenActionTrackings, Attribute } from '../types/types';
import { CONTRACT_ADDRESSES, createGameContract, createTokenContract, createTotemNFTContract, createRewardsContract, TotemRewardsContract, TotemTokenContract, createAchievementsContract } from '../config/contracts';
import { STORAGE_KEYS } from '../config/constants';

export const UserContext = createContext<UserContextType | null>(null);
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<UserContextState>({
        isConnected: false,
        isSignedUp: false,
        isTokenApproved: false,
        address: '',
        provider: null,
        signer: null,
        totemBalance: '0',
        polBalance: '0',
        totems: [],
        totemLoading: false,
        totemError: null,
        isApprovalMessageDismissed: localStorage.getItem(STORAGE_KEYS.tokenApprovalMessageDismissed) === 'true',
        streakStatus: null,
        isClaimLoading: false,
        weeklyStatus: null,
        hasWeeklyUnlocked: false,
        hasStakingUnlocked: false,
        messageDialog: {
            isOpen: false,
            title: '',
            message: ''
        },
        comingSoon: true
    });
    const normalizeAddress = (addr: string) => addr.toLowerCase();
    const comingSoon = false;
    const [midnightTimeout, setMidnightTimeout] = useState<NodeJS.Timeout | null>(null);
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
    const [totems, setTotems] = useState<NFTMetadata[]>([]);
    const [totemLoading, setTotemLoading] = useState(false);
    const [totemError, setTotemError] = useState<string | null>(null);
    const [totemCache, setTotemCache] = useState<Map<string, NFTMetadata>>(new Map());
    
    //console.log('UserContext - Provider:', state.provider);
    const SECONDS_PER_DAY = 86400;

    const showError = (title: string, message: string) => {
        setState(prev => ({
            ...prev,
            messageDialog: {
                isOpen: true,
                title,
                message
            }
        }));
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

    const fetchTotems = useCallback(async () => {
        if (!state.provider || !state.address || !state.isConnected || !state.isSignedUp) return;

        setTotemLoading(true);
        setTotemError(null);

        console.log('loading totems');
        try {
            const contract = createTotemNFTContract(state.provider);
            const tokenIds = await contract.tokensOfOwner(state.address);
            const gameContract = createGameContract(state.provider);

            // Batch fetch trackings
            const trackings = await Promise.all(tokenIds.map(async (tokenId) => {
                const tokenTrackings: {[key in ActionType]?: ActionTracking} = {};
                    
                // Fetch tracking for each action type
                for (const actionType of [ActionType.Feed, ActionType.Train, ActionType.Treat]) {
                    try {
                        const tracking = await gameContract.getActionTracking(tokenId, actionType);
                        tokenTrackings[actionType] = {
                            lastUsed: Math.min(Number(tracking.lastUsed), Math.floor(Date.now() / 1000)),
                            dailyUses: Number(tracking.dailyUses),
                            dayStartTime: Math.min(Number(tracking.dayStartTime), Math.floor(Date.now() / 1000) + SECONDS_PER_DAY)
                        };
                    } catch (err) {
                        console.error(`Error fetching tracking for token ${tokenId}, action ${actionType}:`, err);
                        // Provide default tracking
                        tokenTrackings[actionType] = {
                            lastUsed: 0,
                            dailyUses: 0,
                            dayStartTime: 0
                        };
                    }
                }

                return { 
                    tokenId: tokenId.toString(), 
                    tracking: tokenTrackings 
                };
            }));

            // Convert to a more accessible object with explicit typing
            const trackingMap: TokenActionTrackings = trackings.reduce((acc, item) => {
                acc[item.tokenId] = item.tracking;
                return acc;
            }, {} as TokenActionTrackings);

            // Process totems with cache
            const updatedTotems = await Promise.all(tokenIds.map(async (tokenId) => {
                const cachedTotem = totemCache.get(tokenId.toString());

                // Check if we need to fetch new metadata
                if (cachedTotem) {
                    const attrs = await contract.attributes(tokenId);
                    if (Number(attrs.stage) === cachedTotem.attributes.stage) {
                        // Update only attributes and trackings
                        return {
                            ...cachedTotem,
                            attributes: {
                                ...cachedTotem.attributes,
                                happiness: Number(attrs.happiness),
                                experience: Number(attrs.experience),
                                displayName: attrs.displayName
                            },
                            trackings: trackingMap[tokenId.toString()] || {}
                        };
                    }
                }

                // Fetch full metadata if needed
                const uri = await contract.tokenURI(tokenId);
                const ipfsMetadata = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/')).then(res => res.json());
                const attrs = await contract.attributes(tokenId);
                const affinity = ipfsMetadata.attributes.find((a: Attribute) => a.trait_type === 'Affinity')?.value;
                const domain = ipfsMetadata.attributes.find((a: Attribute) => a.trait_type === 'Domain')?.value;

                const newTotem = {
                    id: tokenId.toString(),
                    tokenId,
                    affinity,
                    domain,
                    ...ipfsMetadata,
                    attributes: {
                        species: Number(attrs.species),
                        color: Number(attrs.color),
                        rarity: Number(attrs.rarity),
                        happiness: Number(attrs.happiness),
                        experience: Number(attrs.experience),
                        stage: Number(attrs.stage),
                        isStaked: Boolean(attrs.isStaked),
                        displayName: attrs.displayName
                    },
                    trackings: trackingMap[tokenId.toString()] || {}
                };

                // Update cache
                setTotemCache(prev => new Map(prev.set(tokenId.toString(), newTotem)));
                return newTotem;
            }));

            setTotems(updatedTotems);
        }
        catch (err) {
            console.error('Error fetching totems:', err);
            setTotemError('Failed to load your Totems. Please try again.');
        }
        finally {
            setTotemLoading(false);
        }
    }, [state.provider, state.address, state.isConnected, state.isSignedUp, totemCache]);

    const updateTotem = async (tokenId: bigint, type: ActionType) => {
        if (!state.provider || !state.address) return;
        
        try {
            const contract = createTotemNFTContract(state.provider);
            const [attrs, gameContract] = await Promise.all([
                contract.attributes(tokenId),
                createGameContract(state.provider)
            ]);
                        
            // Get new tracking data
            const tracking = await gameContract.getActionTracking(tokenId, type);

            // Update single totem in state
            setTotems(prev => prev.map(totem => 
                totem.tokenId === tokenId ? {
                ...totem,
                attributes: {
                    ...totem.attributes,
                    happiness: Number(attrs.happiness),
                    experience: Number(attrs.experience),
                    stage: Number(attrs.stage)
                },
                trackings: {
                    ...totem.trackings,
                    [type]: {
                    lastUsed: Math.min(Number(tracking.lastUsed), Math.floor(Date.now() / 1000)),
                    dailyUses: Number(tracking.dailyUses),
                    dayStartTime: Math.min(Number(tracking.dayStartTime), Math.floor(Date.now() / 1000) + 86400)
                    }
                }
                } : totem
            ));

            // Check if evolution occurred
            const currentTotem = totems.find(t => t.tokenId === tokenId);
            if (currentTotem && Number(attrs.stage) !== currentTotem.attributes.stage) {
                // Fetch new metadata after evolution
                const uri = await contract.tokenURI(tokenId);
                const ipfsMetadata = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/')).then(res => res.json());

                setTotems(prev => prev.map(totem =>
                    totem.tokenId === tokenId ? {
                        ...totem,
                        ...ipfsMetadata,
                        attributes: {
                            ...totem.attributes,
                            ...attrs
                        }
                    } : totem
                ));

                // Update cache
                setTotemCache(prev => {
                    const updated = new Map(prev);
                    updated.delete(tokenId.toString()); // Force fresh metadata next fetch
                    return updated;
                });
            }

            await updateBalances();

        } catch (error) {
            console.error('Error updating totem:', error);
            throw error;
        }
    };
    
    const addTotem = async (tokenId: bigint) => {
        if (!state.provider || !state.address) return;

        try {
            const contract = createTotemNFTContract(state.provider);
            const gameContract = createGameContract(state.provider);

            // Get token tracking
            const tokenTrackings: {[key in ActionType]?: ActionTracking} = {};
            for (const actionType of [ActionType.Feed, ActionType.Train, ActionType.Treat]) {
                try {
                    const actionTracking = await gameContract.getActionTracking(tokenId, actionType);
                    tokenTrackings[actionType] = {
                        lastUsed: Math.min(Number(actionTracking.lastUsed), Math.floor(Date.now() / 1000)),
                        dailyUses: Number(actionTracking.dailyUses),
                        dayStartTime: Math.min(Number(actionTracking.dayStartTime), Math.floor(Date.now() / 1000) + 86400)
                    };
                }
                catch (err) {
                    console.warn(`Error fetching tracking for token ${tokenId}, action ${actionType}:`, err);
                }
            }

            // Get metadata and attributes
            const [uri, attrs] = await Promise.all([
                contract.tokenURI(tokenId),
                contract.attributes(tokenId)
            ]);

            const ipfsMetadata = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/')).then(res => res.json());
            const affinity = ipfsMetadata.attributes.find((a: Attribute) => a.trait_type === 'Affinity')?.value;
            const domain = ipfsMetadata.attributes.find((a: Attribute) => a.trait_type === 'Domain')?.value;

            const newTotem = {
                id: tokenId.toString(),
                tokenId,
                affinity,
                domain,
                ...ipfsMetadata,
                attributes: {
                    species: Number(attrs.species),
                    color: Number(attrs.color),
                    rarity: Number(attrs.rarity),
                    happiness: Number(attrs.happiness),
                    experience: Number(attrs.experience),
                    stage: Number(attrs.stage),
                    isStaked: Boolean(attrs.isStaked),
                    displayName: attrs.displayName
                },
                trackings: tokenTrackings
            };

            // Update cache and totems list
            setTotemCache(prev => new Map(prev.set(tokenId.toString(), newTotem)));
            setTotems(prev => [...prev, newTotem]);
        }
        catch (err) {
            console.error('Error adding new totem:', err);
            throw err;
        }
    };

    const removeTotem = (tokenId: bigint) => {
        setTotems(prev => prev.filter(totem => totem.tokenId !== tokenId));
        setTotemCache(prev => {
            const updated = new Map(prev);
            updated.delete(tokenId.toString());
            return updated;
        });
    };

    const checkTokenApproval = useCallback(async () => {
        if (!state.provider || !state.address) return false;

        try {
            const tokenContract = createTokenContract(state.provider);
            const allowance = await tokenContract.allowance(state.address, CONTRACT_ADDRESSES.game);
            const isApproved = allowance > 0n;

            // Update state if approval status has changed
            setState(prev => ({
                ...prev,
                isTokenApproved: isApproved
            }));

            return isApproved;
        }
        catch (error) {
            console.error('Error checking token approval:', error);
            return false;
        }
    }, [state.provider, state.address]);

    const approveTokens = useCallback(async () => {
        console.log(state);
        if (!state.provider || !state.signer) throw new Error('Not connected');

        try {
            const tokenContract = createTokenContract(state.provider);
            const connectedToken = tokenContract.connect(state.signer) as TotemTokenContract;

            const tx = await connectedToken.approve(CONTRACT_ADDRESSES.game, ethers.MaxUint256);

            console.log('Approval tx:', tx.hash);
            await tx.wait();
            return true;
        }
        catch (error) {
            console.error('Error approving tokens:', error);
            return false;
        }
    }, [state.provider, state.signer]);

    const setApprovalMessageDismissed = useCallback((dismissed: boolean) => {
        setState(prev => ({ ...prev, isApprovalMessageDismissed: dismissed }));
        localStorage.setItem(STORAGE_KEYS.tokenApprovalMessageDismissed, dismissed.toString());
    }, []);

    const handleAccountsChanged = useCallback(async (accounts: any) => {
        if (!window.ethereum) return;
        try {
            if (!accounts || accounts.length === 0) {
                setState(prev => ({
                    ...prev,
                    isSignedUp: false,
                    address: '',
                    signer: null,
                    isConnected: false
                }));
                return;
            }
    
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const gameContract = createGameContract(provider);
            const normalizedAddress = normalizeAddress(accounts[0]?.address || '');
            const hasSignedUp = await gameContract.hasSignedUp(normalizedAddress);

            setState(prev => ({
                ...prev,
                isSignedUp: hasSignedUp,
                address: normalizedAddress,
                signer,
                isConnected: true
            }));
        }
        catch (err) {
            console.error('Error getting signer:', err);
        }
    }, []);

    // Initialize provider on mount
    const initializeProvider = useCallback(async () => {
        if (!window.ethereum) return;
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        setState(prev => ({ ...prev, provider, signer }));
        
        // Check if already connected
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
            await handleAccountsChanged(accounts);
        }
    }, [handleAccountsChanged]);

    const updateBalances = useCallback(async () => {
        if (!state.provider || !state.address) return;
    
        try {
            const tokenContract = createTokenContract(state.provider);
    
            const [totemBal, polBal] = await Promise.all([
                tokenContract.balanceOf(state.address),
                state.provider.getBalance(state.address)
            ]);
    
            setState(prev => ({
                ...prev,
                totemBalance: ethers.formatEther(totemBal),
                polBalance: ethers.formatEther(polBal)
            }));
        } catch (error) {
            console.error('Error updating balances:', error);
        }
    }, [state.provider, state.address]);

    const updateStreakStatus = async (): Promise<StreakStatus | undefined> => {
        if (!state.provider || !state.address) return undefined;
    
        try {
            const rewardsContract = createRewardsContract(state.provider);
            const dailyRewardId = ethers.id("daily_login");
            const status = await rewardsContract.getStreakStatus(dailyRewardId, state.address);
            const newStatus: StreakStatus = {
                streakDays: Number(status.currentStreak),
                canClaimToday: status.canClaim,
                bestStreak: Number(status.bestStreak),
                nextClaimTime: Number(status.nextClaimTime),
                isProtected: status.isProtected,
                protectionExpiry: Number(status.protectionExpiry)
            };

            setState(prev => ({
                ...prev,
                streakStatus: newStatus
            }));

            return newStatus;
        } catch (error) {
            console.error("Error fetching streak data:", error);
            return undefined;
        }
    };

    const getUserStreak = async (): Promise<StreakStatus | undefined> => {
        return state.streakStatus || await updateStreakStatus();
    };

    const getWeeklyStatus = async (): Promise<WeeklyStatus | undefined> => {
        return state.weeklyStatus || await updateWeeklyStatus();
    };

    const claimDailyReward = async () => {
        if (!state.provider || !state.signer || !state.address) return false;
        
        setState(prev => ({ ...prev, isClaimLoading: true }));

        try {
            const rewardsContract = createRewardsContract(state.provider);
            const connectedRewards = rewardsContract.connect(state.signer) as TotemRewardsContract;
            const dailyRewardId = ethers.id("daily_login");

            // Check if claiming is allowed first
            const canClaim = await rewardsContract.isClaimingAllowed(dailyRewardId, state.address);
            if (!canClaim) return false;

            // Attempt to claim
            const tx = await connectedRewards.claim(dailyRewardId);
            await tx.wait();

            // Update balances and streak status after successful claim
            await Promise.all([
                updateBalances(),
                updateStreakStatus()
            ]);

            return true;
        }
        catch (error) {
            console.error("Error claiming daily reward:", error);
            return false;
        }
        finally {
            setState(prev => ({ ...prev, isClaimLoading: false }));
        }
    };

    const updateWeeklyStatus = async (): Promise<WeeklyStatus | undefined> => {
        if (!state.provider || !state.address) return undefined;
    
        try {
            const rewardsContract = createRewardsContract(state.provider);
            const weeklyRewardId = ethers.id("weekly_bonus");
            
            // Get streak status from contract
            const status = await rewardsContract.getStreakStatus(weeklyRewardId, state.address);
            
            // Get user info for additional details
            const userInfo = await rewardsContract.getUserInfo(weeklyRewardId, state.address);

            const newStatus: WeeklyStatus = {
                weeklyStreak: Number(status.currentStreak),
                canClaimWeekly: status.canClaim,
                bestWeeklyStreak: Number(status.bestStreak),
                nextClaimTime: Number(status.nextClaimTime),
                isProtected: status.isProtected,
                protectionExpiry: Number(status.protectionExpiry)
            };

            // Check for Week Warrior achievement
            const achievementsContract = createAchievementsContract(state.provider);
            const loginProgressionId = ethers.id("login_progression");
            const progress = await achievementsContract.getDetailedProgress(loginProgressionId, state.address);
            const hasWeeklyUnlocked = progress.count >= 7;

            setState(prev => ({
                ...prev,
                 weeklyStatus: newStatus,
                hasWeeklyUnlocked
            }));

            return newStatus;
        }
        catch (error) {
            console.error("Error fetching weekly streak data:", error);
            return undefined;
        }
    };

    const claimWeeklyReward = async () => {
        if (!state.provider || !state.signer || !state.address) return false;
        
        try {
          const rewardsContract = createRewardsContract(state.provider);
          const connectedRewards = rewardsContract.connect(state.signer) as TotemRewardsContract;
          const weeklyRewardId = ethers.id("weekly_bonus");
    
          // Check if claiming is allowed
          const canClaim = await rewardsContract.isClaimingAllowed(weeklyRewardId, state.address);
          if (!canClaim) return false;
    
          // Attempt to claim
          const tx = await connectedRewards.claim(weeklyRewardId);
          await tx.wait();
    
          // Update balances and status
          await Promise.all([
            updateBalances(),
            updateWeeklyStatus()
          ]);
    
          return true;
        }
        catch (error) {
          console.error("Error claiming weekly reward:", error);
          return false;
        }
    };
    
    const purchaseProtection = async (type: 'daily' | 'weekly', tier: number) => {
        if (!state.provider || !state.signer || !state.address) return false;
    
        // Check streak requirements
        const requiredStreak = type === 'daily' 
            ? (tier === 0 ? 7 : 14)   // Daily: Tier 1 = 7 days, Tier 2 = 14 days
            : 28;                     // Weekly: 4 weeks required
    
        const currentStreak = type === 'daily'
            ? state.streakStatus?.streakDays || 0
            : state.weeklyStatus?.weeklyStreak || 0;
    
        if (currentStreak < requiredStreak) {
            throw new Error(`Insufficient streak. Required: ${requiredStreak}`);
        }
    
        try {
            const rewardsContract = createRewardsContract(state.provider);
            const connectedRewards = rewardsContract.connect(state.signer) as TotemRewardsContract;
            const rewardId = type === 'daily' ? ethers.id("daily_login") : ethers.id("weekly_bonus");
    
            // Check if protection is already active
            const status = await rewardsContract.getStreakStatus(rewardId, state.address);
            if (status.isProtected) {
                throw new Error('Protection is already active');
            }
    
            const tx = await connectedRewards.purchaseProtection(rewardId, tier);
            await tx.wait();
    
            // Update status
            await Promise.all([
                updateStreakStatus(),
                updateWeeklyStatus()
            ]);
    
            return true;
        }
        catch (error) {
            console.error("Error purchasing protection:", error);
            throw error;
        }
    };

    const updateAchievementStatus = async () => {
        if (!state.provider || !state.address) return;

        try {
            const achievementsContract = createAchievementsContract(state.provider);
            
            // Check Week Warrior achievement
            const loginProgressionId = ethers.id("login_progression");
            const progress = await achievementsContract.getDetailedProgress(loginProgressionId, state.address);
            const hasWeeklyUnlocked = progress.count >= 7;

            // Check Elder Evolution achievement
            const elderEvolutionId = ethers.id("evolution_progression");
            const elderStatus = await achievementsContract.getDetailedProgress(elderEvolutionId, state.address);
    
            // Check if all evolution milestones are completed
            const hasElderEvolution = elderStatus.unlockedMilestones.length === 4 && 
                elderStatus.unlockedMilestones.every(milestone => milestone === true);

            setState(prev => ({
                ...prev,
                hasWeeklyUnlocked: hasWeeklyUnlocked,
                hasStakingUnlocked: hasElderEvolution
            }));
        } catch (error) {
            console.error("Error checking achievement status:", error);
        }
    };

    // Setup listeners only once on mount
    useEffect(() => {
        if (window.ethereum) {
            //initializeProvider();
            
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', () => window.location.reload());

            return () => {
                window?.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
            };
        }
    }, [handleAccountsChanged, initializeProvider]);

    useEffect(() => {
        if (!state.isConnected || !state.isSignedUp) return;
    
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
                // Update all states
                await Promise.all([
                    updateStreakStatus(),
                    updateWeeklyStatus(),
                    updateAchievementStatus()
                ]);
            } catch (error) {
                console.error('Error handling midnight rollover:', error);
            }
        };
    
        // Set up periodic refresh (every 30 seconds)
        const refreshStates = async () => {
            try {
                console.log('refreshing state');
                await Promise.all([
                    updateBalances(),
                    updateStreakStatus(),
                    updateWeeklyStatus(),
                    updateAchievementStatus()
                ]);
            } catch (error) {
                console.error('Error refreshing states:', error);
            }
        };
    
        // Initial check for midnight + 1 minute window
        const now = new Date();
        if (now.getUTCHours() === 0 && now.getUTCMinutes() === 0) {
            handleMidnightRollover();
        }
    
        // Set up midnight timer
        const timeUntilMidnight = getTimeUntilMidnight();
        const midnight = setTimeout(async () => {
            await handleMidnightRollover();
            
            // Set up recurring daily check
            setMidnightTimeout(setInterval(handleMidnightRollover, 24 * 60 * 60 * 1000));
        }, timeUntilMidnight);
    
        // Set up refresh interval
        const refresh = setInterval(refreshStates, 30000); // 30 seconds
    
        // Store the timeouts/intervals
        setMidnightTimeout(midnight);
        setRefreshInterval(refresh);
    
        // Call immediately
        refreshStates();

        // Cleanup function
        return () => {
            if (midnightTimeout) clearTimeout(midnightTimeout);
            if (refreshInterval) clearInterval(refreshInterval);
        };
    }, [
        state.isConnected, 
        state.isSignedUp
    ]);

    // Watch for signed up users to update balances
    useEffect(() => {
        if (state.isConnected && state.isSignedUp) {
            checkTokenApproval();
            updateBalances();
        }
    }, [state.isConnected, state.isSignedUp, checkTokenApproval, updateBalances]);

    useEffect(() => {
        if (state.isConnected && state.isSignedUp) {
            fetchTotems();
        } else {
            setTotems([]);
            setTotemCache(new Map());
        }
    }, [state.isConnected, state.isSignedUp]);

    const connect = async () => {
        if (!window.ethereum) {
          alert('Please install MetaMask!');
          return;
        }
    
        try {
            await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            initializeProvider();
        }
        catch (err) {
            console.error('Error connecting wallet:', err);
        }
    };
    
    const disconnect = () => {
        localStorage.removeItem(STORAGE_KEYS.notifications);
        localStorage.removeItem(STORAGE_KEYS.tokenApprovalMessageDismissed);

        setState(prev => ({
            ...prev,
            address: '',
            signer: null,
            isConnected: false,
            isTokenApproved: false,
            isApprovalMessageDismissed: false
        }));
    };

    const checkSignupStatus = useCallback(async () => {
        if (!state.provider || !state.address) return;

        try {
            const gameContract = createGameContract(state.provider);
            const normalizedAddress = normalizeAddress(state.address);
            const hasSignedUp = await gameContract.hasSignedUp(normalizedAddress);

            setState(prev => ({ ...prev, isSignedUp: hasSignedUp }));
        }
        catch (error) {
            console.error('Error checking signup status:', error);
            setState(prev => ({ ...prev, isSignedUp: false }));
        }
    }, [state.provider, state.address]);

    return (
        <UserContext.Provider
            value={{
                isSignedUp: state.isSignedUp,
                isTokenApproved: state.isTokenApproved,
                totemBalance: state.totemBalance,
                polBalance: state.polBalance,
                isConnected: state.isConnected,
                provider: state.provider,
                signer: state.signer,
                address: state.address,
                checkSignupStatus,
                updateBalances,
                connect,
                disconnect,
                totems,
                totemLoading,
                totemError,
                addTotem,
                removeTotem,
                updateTotem,
                getUserStreak,
                claimDailyReward,
                checkTokenApproval,
                approveTokens,
                isApprovalMessageDismissed: state.isApprovalMessageDismissed,
                setApprovalMessageDismissed,
                streakStatus: state.streakStatus,
                isClaimLoading: state.isClaimLoading,
                updateStreakStatus,
                weeklyStatus: state.weeklyStatus,
                hasWeeklyUnlocked: state.hasWeeklyUnlocked,
                hasStakingUnlocked: state.hasStakingUnlocked,
                updateAchievementStatus,
                updateWeeklyStatus,
                claimWeeklyReward,
                purchaseProtection,
                messageDialog: state.messageDialog,
                showError,
                hideError,
                comingSoon
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
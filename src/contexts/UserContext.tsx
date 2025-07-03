import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { UserContextType, UserContextState, ActionType, ActionTracking, NFTMetadata, TokenActionTrackings, Attribute, AccountType, RateLimitState, RateLimitError } from '../types/types';
import { CONTRACT_ADDRESSES, createGameContract, createTokenContract, createTotemNFTContract, TotemTokenContract, createAchievementsContract } from '../config/contracts';
import { IPFS_GATEWAY_URL, STORAGE_KEYS } from '../config/constants';
import { getSpeciesBaseStats } from '../utils/totems';
import { getUserStorage, setUserStorage } from '../utils/localStorage';

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
        tutorialWizardVisible: true,
        isApprovalMessageDismissed: getUserStorage(STORAGE_KEYS.tokenApprovalMessageDismissed, '', false),
        messageDialog: {
            isOpen: false,
            title: '',
            message: ''
        },
        isGaslessEnabled: getUserStorage(STORAGE_KEYS.isGaslessEnabled, '', false),
        gaslessApiKey: getUserStorage(STORAGE_KEYS.gaslessApiKey, '', ''),
        accountType: initialAccountType(''),
        comingSoon: true,
        linkTracking: {}
        rateLimitState: {
            isExceeded: false,
            resetTime: null,
            currentUsage: 0,
            dailyLimit: 0
        }
    });
    const normalizeAddress = (addr: string) => addr.toLowerCase();
    const comingSoon = false;
    const [midnightTimeout, setMidnightTimeout] = useState<NodeJS.Timeout | null>(null);
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
    const [totems, setTotems] = useState<NFTMetadata[]>([]);
    const [totemLoading, setTotemLoading] = useState(false);
    const [totemError, setTotemError] = useState<string | null>(null);
    const [totemCache, setTotemCache] = useState<Map<string, NFTMetadata>>(new Map());
    const SECONDS_PER_DAY = 86400;
    const [linkTracking, setLinkTracking] = useState<Record<string, any>>(
        getUserStorage(STORAGE_KEYS.linkTracking, state.address || '', {})
    );

    // Rate limit callback for TransactionService
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
                isRateLimit
            }
        }));
    };

    // Helper function to handle rate limit errors consistently
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

    const canSpendTotem = (amount: number) => {
        if (!state.isTokenApproved) {
            return false;
        }

        if (state.totemBalance) {
            const balance = Number(state.totemBalance);
            if (Number(balance) > amount) {
                return true;
            }
        }

        return false;
    };

    const canSpendCurrency = (amount: number) => {
        if (!state.isTokenApproved) {
            return false;
        }

        if (state.polBalance) {
            const balance = Number(state.polBalance);
            if (balance > amount) {
                return true;
            }
        }

        return false;
    }

    const trackLink = useCallback((linkId: string, metadata?: Record<string, any>) => {
        const now = Date.now();

        setLinkTracking(prev => {
            const updated = {
                ...prev,
                [linkId]: true
            };

            // Save to localStorage
            if (state.address) {
                setUserStorage(STORAGE_KEYS.linkTracking, state.address, updated);
            }

            return updated;
        });
    }, [state.address]);

    const hasClickedLink = useCallback((linkId: string) => {
        return linkTracking[linkId];
    }, [linkTracking]);

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
                const ipfsMetadata = await fetch(uri.replace('ipfs://', IPFS_GATEWAY_URL)).then(res => res.json());
                const attrs = await contract.attributes(tokenId);
                const affinity = ipfsMetadata.attributes.find((a: Attribute) => a.trait_type === 'Affinity')?.value;
                const domain = ipfsMetadata.attributes.find((a: Attribute) => a.trait_type === 'Domain')?.value;
                const stats = getSpeciesBaseStats(Number(attrs.species), Number(attrs.rarity));

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
                        strength: stats.strength,
                        agility: stats.agility,
                        wisdom: stats.wisdom,
                        isStaked: Boolean(attrs.isStaked),
                        displayName: attrs.displayName,
                        prestigeLevel: attrs.prestigeLevel
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

    const updateTotemEvolved = async (tokenId: bigint) => {
        if (!state.provider || !state.address) return;

        try {
            const contract = createTotemNFTContract(state.provider);
            const [attrs, gameContract] = await Promise.all([
                contract.attributes(tokenId),
                createGameContract(state.provider)
            ]);
                        
            // Check if evolution occurred
            const currentTotem = totems.find(t => t.tokenId === tokenId);
            if (currentTotem && Number(attrs.stage) !== currentTotem.attributes.stage) {
                // Fetch new metadata after evolution
                const uri = await contract.tokenURI(tokenId);
                const ipfsMetadata = await fetch(uri.replace('ipfs://', IPFS_GATEWAY_URL)).then(res => res.json());

                setTotems(prev => prev.map(totem =>
                    totem.tokenId === tokenId ? {
                        ...totem,
                        ...ipfsMetadata,
                        attributes: {
                            ...totem.attributes,
                            happiness: Number(attrs.happiness),
                            experience: Number(attrs.experience),
                            stage: Number(attrs.stage),
                            isStaked: Boolean(attrs.isStaked),
                            displayName: attrs.displayName,
                            prestigeLevel: attrs.prestigeLevel
                        },
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

    const updateTotem = async (tokenId: bigint, type: ActionType) => {
        if (!state.provider || !state.address) return;
        
        try {
            const contract = createTotemNFTContract(state.provider);
            const [attrs, gameContract] = await Promise.all([
                contract.attributes(tokenId),
                createGameContract(state.provider)
            ]);

            if (type === ActionType.None) {
                // Update single totem in min state, no tracking 
                setTotems(prev => prev.map(totem => 
                    totem.tokenId === tokenId ? {
                    ...totem,
                    attributes: {
                        ...totem.attributes,
                        happiness: Number(attrs.happiness),
                        experience: Number(attrs.experience),
                        stage: Number(attrs.stage),
                        isStaked: Boolean(attrs.isStaked),
                        displayName: attrs.displayName,
                        prestigeLevel: attrs.prestigeLevel
                    }
                    } : totem
                ));
            }
            else {
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
                        stage: Number(attrs.stage),
                        isStaked: Boolean(attrs.isStaked),
                        displayName: attrs.displayName,
                        prestigeLevel: attrs.prestigeLevel
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
            }

            // Check if evolution occurred
            const currentTotem = totems.find(t => t.tokenId === tokenId);
            if (currentTotem && Number(attrs.stage) !== currentTotem.attributes.stage) {
                // Fetch new metadata after evolution
                const uri = await contract.tokenURI(tokenId);
                const ipfsMetadata = await fetch(uri.replace('ipfs://', IPFS_GATEWAY_URL)).then(res => res.json());

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

    const getTotem = (tokenId: bigint) => {
        return totems?.find(t => t.tokenId === tokenId);
    }

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

            const ipfsMetadata = await fetch(uri.replace('ipfs://', IPFS_GATEWAY_URL)).then(res => res.json());
            const affinity = ipfsMetadata.attributes.find((a: Attribute) => a.trait_type === 'Affinity')?.value;
            const domain = ipfsMetadata.attributes.find((a: Attribute) => a.trait_type === 'Domain')?.value;
            const stats = getSpeciesBaseStats(Number(attrs.species), Number(attrs.rarity));

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
                    strength: stats.strength,
                    agility: stats.agility,
                    wisdom: stats.wisdom,
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
        setUserStorage(STORAGE_KEYS.tokenApprovalMessageDismissed, state.address, dismissed);
    }, [state.address]);
    
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
                isConnected: true,
                isApprovalMessageDismissed: getUserStorage(STORAGE_KEYS.tokenApprovalMessageDismissed, normalizedAddress, false),
                isGaslessEnabled: getUserStorage(STORAGE_KEYS.isGaslessEnabled, normalizedAddress, false),
                gaslessApiKey: getUserStorage(STORAGE_KEYS.gaslessApiKey, normalizedAddress, ''),
                accountType: initialAccountType(normalizedAddress),
                tutorialWizardVisible: getUserStorage(STORAGE_KEYS.tutorialWizardVisible, normalizedAddress, true)
            }));
        }
        catch (err) {
            console.error('Error getting signer:', err);
        }
    }, []);

    // Initialize provider on mount
    const initializeProvider = useCallback(async () => {
        if (!window.ethereum) return;
        
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setState(prev => ({ ...prev, provider }));
            
            // Check if already connected without prompting
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                // User already has an account connected, get signer and set up state
                const signer = await provider.getSigner();
                setState(prev => ({ ...prev, signer }));
                await handleAccountsChanged(accounts);
                console.log("Auto-connected to previously connected wallet");
            }
            else {
                console.log("No previously connected wallet found");
                // Don't prompt - let user click connect button
            }
        }
        catch (error) {
            console.error('Error initializing provider:', error);
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
    
    const setTutorialWizardVisible = (visible: boolean) => {
        setUserStorage(STORAGE_KEYS.tutorialWizardVisible, state.address, visible);
        setState(prev => ({ ...prev, tutorialWizardVisible: visible }));
    };

    // Load link tracking data when address changes
    useEffect(() => {
        if (state.address) {
            const userLinkTracking = getUserStorage(STORAGE_KEYS.linkTracking, state.address, {});
            setLinkTracking(userLinkTracking);
        } else {
            setLinkTracking({});
        }
    }, [state.address]);

    // Setup listeners only once on mount
    useEffect(() => {
        if (window.ethereum) {
            initializeProvider();
            
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

    useEffect(() => {
        updateAccountType();
    }, []);

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
            totems: [],
            address: '',
            signer: null,
            isSignedUp: false,
            isConnected: false,
            isTokenApproved: false,
            isApprovalMessageDismissed: false
        }));
    };

    const setGaslessEnabled = (enabled: boolean) => {
        setUserStorage(STORAGE_KEYS.isGaslessEnabled, state.address, enabled);
        setState(prev => ({ ...prev, isGaslessEnabled: enabled }));
        updateAccountType();
    };
    
    const setGaslessApiKey = (apiKey: string) => {
        setUserStorage(STORAGE_KEYS.gaslessApiKey, state.address, apiKey);
        setState(prev => ({ ...prev, gaslessApiKey: apiKey }));
        updateAccountType();
    };
    
    const updateAccountType = (providedApiKey?: string) => {
        const isEnabled = getUserStorage(STORAGE_KEYS.isGaslessEnabled, state.address, false);
        const apiKey = providedApiKey || getUserStorage(STORAGE_KEYS.gaslessApiKey, state.address, '');
        
        let accountType: AccountType = 'Free';
        
        if (!isEnabled) {
            accountType = 'Advanced';
        }
        else if (apiKey && apiKey.trim() !== '') {
            // If gasless is enabled and they have an API key, check key type
            if (apiKey.startsWith('premium_')) {
                accountType = 'Premium';
            } else {
                accountType = 'Free';
            }
        }
        else {
            // Gasless enabled but no key should be Advanced
            accountType = 'Advanced';
        }
        
        if (state.address) {
            setUserStorage<AccountType>(STORAGE_KEYS.accountType, state.address, accountType);
        }        
        setState(prev => ({ ...prev, accountType }));
        
        return accountType;
    };

    function initialAccountType(addr: string) {
        const isEnabled = getUserStorage<boolean>(STORAGE_KEYS.isGaslessEnabled, addr, false);
        const apiKey = getUserStorage<string>(STORAGE_KEYS.gaslessApiKey, addr, '');
        
        if (!isEnabled) return 'Advanced';
        if (apiKey && apiKey.trim() !== '') {
            return apiKey.startsWith('premium_') ? 'Premium' : 'Free';
        }
        return 'Advanced';
    }

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
                getTotem,
                addTotem,
                removeTotem,
                updateTotem,
                updateTotemEvolved,
                checkTokenApproval,
                approveTokens,
                isApprovalMessageDismissed: state.isApprovalMessageDismissed,
                setApprovalMessageDismissed,
                updateAchievementStatus,
                messageDialog: state.messageDialog,
                showError,
                hideError,
                isGaslessEnabled: state.isGaslessEnabled,
                setGaslessEnabled,
                gaslessApiKey: state.gaslessApiKey,
                setGaslessApiKey,
                accountType: state.accountType,
                updateAccountType,
                comingSoon,
                canSpendTotem,
                canSpendCurrency,
                tutorialWizardVisible: state.tutorialWizardVisible,
                setTutorialWizardVisible,
                linkTracking,
                trackLink,
                hasClickedLink
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
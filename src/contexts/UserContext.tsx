// contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { UserContextType, UserContextState } from '../types/types';
import { createGameContract, createTokenContract } from '../config/contracts';

export const UserContext = createContext<UserContextType | null>(null);
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<UserContextState>({
        isSignedUp: false,
        totemBalance: '0',
        polBalance: '0',
        isConnected: false,
        address: '',
        provider: null,
        signer: null,
        totemUpdateCounter: 0,
        lastUpdatedTotem: 0n
    });

    const normalizeAddress = (addr: string) => addr.toLowerCase();

    console.log('UserContext - Provider:', state.provider);

    const totemUpdated = (tokenId: bigint) => {
        setState(prev => ({
            ...prev,
            lastUpdatedTotem: tokenId,
            totemUpdateCounter: state.totemUpdateCounter + 1
        }));
    };

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
        setState(prev => ({ ...prev, provider }));
        
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

    // Watch for signed up users to update balances
    useEffect(() => {
        if (state.isConnected && state.isSignedUp) {
            updateBalances();
        }
    }, [state.isConnected, state.isSignedUp, updateBalances]);

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
        setState(prev => ({
            ...prev,
            address: '',
            signer: null,
            isConnected: false
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
                totemUpdateCounter: state.totemUpdateCounter,
                lastUpdatedTotem: state.lastUpdatedTotem,
                totemUpdated
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
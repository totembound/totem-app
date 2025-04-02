import { useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { TransactionConfig } from '../types/types';
import { TransactionService } from '../services/TransactionService';

export const useTransactionService = (initialConfig: TransactionConfig = {}) => {
    const { 
        provider, 
        signer, 
        address, 
        isGaslessEnabled, 
        gaslessApiKey, 
        accountType 
    } = useUser();

    // Use useMemo to create the transaction service
    const service = useMemo(() => {
        // Only create service if all required dependencies are present
        if (!provider || !signer || !address) {
            return null;
        }

        // Merge initial config with dynamic configurations
        const fullConfig: TransactionConfig = {
            ...initialConfig,
            forwarderAddress: initialConfig.forwarderAddress || CONTRACT_ADDRESSES.forwarder,
            relayerUrl: initialConfig.relayerUrl || 'http://localhost:3001',
            gaslessEnabled: isGaslessEnabled,
            apiKey: gaslessApiKey,
            waitForConfirmation: initialConfig.waitForConfirmation ?? true
        };

        // Create and return new TransactionService
        return new TransactionService(provider, signer, address, fullConfig);
    }, [
        provider, 
        signer, 
        address, 
        isGaslessEnabled, 
        gaslessApiKey, 
        accountType
    ]);

    return service;
};
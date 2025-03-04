import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { TransactionConfig } from '../types/types';
import { TransactionService } from '../services/TransactionService';

export const useTransactionService = (config: TransactionConfig) => {
    const { provider, signer, address, isGaslessEnabled, gaslessApiKey, accountType } = useUser();
    const [service, setService] = useState<TransactionService | null>(null);

    useEffect(() => {
        if (provider && signer && address) {
            // Apply default configuration
            const fullConfig: TransactionConfig = {
                ...config,
                forwarderAddress: config.forwarderAddress || CONTRACT_ADDRESSES.forwarder,
                relayerUrl: 'http://localhost:3001',
                gaslessEnabled: isGaslessEnabled,
                apiKey: gaslessApiKey
            };

            setService(new TransactionService(provider, signer, address, fullConfig));
        }
    }, [provider, signer, address, isGaslessEnabled, gaslessApiKey, accountType]);

    return service;
};

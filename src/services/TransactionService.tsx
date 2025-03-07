// src/services/TransactionService.ts
import { ethers } from 'ethers';
import { FORWARDER_ABI } from '../config/contracts';
import { createGameContract, createTokenContract, createTotemNFTContract, createRewardsContract } from '../config/contracts';
import { ContractEvent, ContractType, ForwardRequest, TransactionConfig, TransactionResult } from '../types/types';

export class TransactionService {
    private provider: ethers.BrowserProvider;
    private signer: ethers.JsonRpcSigner;
    private contracts: Map<string, ethers.Contract>;
    private config: TransactionConfig;
    private userAddress: string;

    constructor(
        provider: ethers.BrowserProvider,
        signer: ethers.JsonRpcSigner,
        userAddress: string,
        config: TransactionConfig
    ) {
        this.provider = provider;
        this.signer = signer;
        this.userAddress = userAddress.toLowerCase();
        this.config = config;
        this.contracts = new Map();
    }

    // Initialize contract instances
    private async getContract(contractType: ContractType): Promise<ethers.Contract> {
        if (this.contracts.has(contractType)) {
            return this.contracts.get(contractType)!;
        }

        let contract: ethers.Contract;
        switch (contractType) {
            case 'game':
                contract = createGameContract(this.provider);
                break;
            case 'nft':
                contract = createTotemNFTContract(this.provider);
                break;
            case 'token':
                contract = createTokenContract(this.provider);
                break;
            case 'rewards':
                contract = createRewardsContract(this.provider);
                break;
            default:
                throw new Error(`Unsupported contract type: ${contractType}`);
        }

        this.contracts.set(contractType, contract);
        return contract;
    }

    // Helper to create event listeners
    private setupEventListeners(events: ContractEvent[]): Promise<any[]> {
        return new Promise((resolve) => {
            const results: any[] = [];
            let completed = 0;

            // If no events expected, resolve immediately
            if (events.length === 0) {
                resolve(results);
                return;
            }

            // Set a timeout to prevent indefinite waiting
            const timeout = setTimeout(() => {
                console.warn('Event listeners timed out');
                resolve(results);
            }, 60000); // 1 minute timeout

            events.forEach(({ contract, eventName, filter }) => {
                const listener = (...args: any[]) => {
                    results.push({ eventName, args });
                    completed++;

                    // Remove this listener to prevent memory leaks
                    contract.off(eventName, listener);

                    if (completed === events.length) {
                        clearTimeout(timeout);
                        resolve(results);
                    }
                };

                // Handle event listening based on whether there's a filter
                if (filter && filter.length > 0) {
                    // For ethers v6, we need a different approach for filtered events
                    // Create a filter using the contract's filters property
                    try {
                        // This approach uses the standard listener pattern
                        contract.on(eventName, listener);
                    } catch (error) {
                        console.error(`Error setting up event listener for ${eventName}:`, error);
                    }
                } else {
                    contract.on(eventName, listener);
                }
            });
        });
    }

    // Execute transaction with consistent behavior
    public async executeTransaction(
        contractType: ContractType,
        functionName: string,
        args: any[],
        expectedEvents: ContractEvent[] = []
    ): Promise<TransactionResult> {
        try {
            const contract = await this.getContract(contractType);

            // Set up event listeners before transaction
            const eventsPromise = this.setupEventListeners(expectedEvents);

            if (this.config.gaslessEnabled) {
                // Gasless transaction flow
                const result = await this.executeGaslessTransaction(
                    contractType,
                    functionName,
                    args
                );

                // If waiting for confirmation
                if (this.config.waitForConfirmation) {
                    const receipt = await this.provider.waitForTransaction(result.hash);
                    const events = await eventsPromise;
                    return {
                        hash: result.hash,
                        success: receipt ? true : false,
                        events,
                        receipt: receipt || undefined
                    };
                }

                return result;
            }
            else {
                // Direct transaction flow
                const result = await this.executeDirectTransaction(
                    contract,
                    functionName,
                    args
                );
                const events = await eventsPromise;
                return {
                    ...result,
                    events
                };
            }
        }
        catch (error) {
            console.error(`Transaction failed: ${contractType}.${functionName}`, error);
            throw error;
        }
    }

    // Execute direct blockchain transaction
    private async executeDirectTransaction(
        contract: ethers.Contract,
        functionName: string,
        args: any[]
    ): Promise<TransactionResult> {
        const connectedContract = contract.connect(this.signer);
        
        // Check if the function exists
        if (!(functionName in connectedContract)) {
            throw new Error(`Function "${functionName}" not found on contract`);
        }

        // Use the dynamic access pattern for ethers v6
        const tx = await (connectedContract as any)[functionName](...args);
        const receipt = await tx.wait();

        return {
            hash: tx.hash,
            success: receipt ? true : false,
            events: [],
            receipt: receipt || undefined
        };
    }

    // Create a forward request for gasless transaction
    private async createForwardRequest(
        contract: ethers.Contract,
        functionName: string,
        args: any[]
    ): Promise<ForwardRequest> {
        if (!this.config.forwarderAddress) {
            throw new Error('Forwarder address not configured');
        }

        // Get the forwarder contract
        const forwarderContract = new ethers.Contract(
            this.config.forwarderAddress,
            FORWARDER_ABI,
            this.provider
        );

        // Encode the function call
        const data = contract.interface.encodeFunctionData(functionName, args);

        // Get the next nonce
        console.log(this.userAddress);
        const nonce = await forwarderContract.getNonce(this.userAddress);

        // Create the forward request
        return {
            from: this.userAddress,
            to: await contract.getAddress(),
            value: BigInt(0),
            gas: BigInt(500000), // Default gas limit
            nonce: nonce,
            data: data
        };
    }

    // Sign a forward request using EIP-712
    private async signRequest(request: ForwardRequest): Promise<string> {
        if (!this.config.forwarderAddress) {
            throw new Error('Forwarder address not configured');
        }

        const chainId = await this.provider.getNetwork().then(n => n.chainId);

        // EIP-712 domain
        const domain = {
            name: 'TotemTrustedForwarder',
            version: '1',
            chainId: chainId,
            verifyingContract: this.config.forwarderAddress
        };

        // EIP-712 types
        const types = {
            ForwardRequest: [
                { name: 'from', type: 'address' },
                { name: 'to', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'gas', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'data', type: 'bytes' }
            ]
        };

        // Sign the request
        return await this.signer.signTypedData(domain, types, request);
    }

    // Execute gasless transaction through relayer
    private async executeGaslessTransaction(
        contractType: ContractType,
        functionName: string,
        args: any[]
    ): Promise<TransactionResult> {
        if (!this.config.relayerUrl) {
            throw new Error('Relayer URL not configured');
        }

        if (!this.config.gaslessEnabled) {
            throw new Error('Gasless transactions are disabled in user settings');
        }
        
        if (!this.config.apiKey || this.config.apiKey.trim() === '') {
            throw new Error('API key is required for gasless transactions');
        }

        const contract = await this.getContract(contractType);

        // Provide more gas for complex operations
        const functionGasLimits: Record<string, bigint> = {
            'purchaseTotem': 1000000n, // Increase substantially
            'sellTotem': 500000n,
            'signup': 500000n,
            'feed': 500000n,
            'train': 500000n,
            'treat': 500000n,
            'evolve': 500000n
        };

        const gasLimit = functionGasLimits[functionName] || 500000n;
        const request = await this.createForwardRequest(contract, functionName, args);
         // Override gas limit
        request.gas = gasLimit;

        const signature = await this.signRequest(request);

        // Convert BigInt to string for JSON serialization
        const serializableRequest = {
            ...request,
            value: request.value.toString(),
            gas: request.gas.toString(),
            nonce: request.nonce.toString()
        };
        
        console.log(`Sending ${functionName} with gas: ${request.gas.toString()}`);

        try {
            const response = await fetch(`${this.config.relayerUrl}/relay`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-API-KEY': this.config.apiKey
                },
                body: JSON.stringify({
                    contractType,
                    functionName,
                    request: serializableRequest,
                    signature
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Relay request failed: ${errorData.error || response.statusText}`);
            }

            const result = await response.json();
            return {
                hash: result.txHash,
                success: true,
                events: []
            };
        }
        catch (error) {
            console.error(`Gasless transaction failed (${functionName}):`, error);
            throw error;
        }
    }

    public async evolveTotem(tokenId: bigint): Promise<TransactionResult> {
        // Set up expected events
        const nftContract = await this.getContract('nft');
        const expectedEvents = [{
            contract: nftContract,
            eventName: 'TotemEvolved',
            filter: [tokenId]
        }];

        return this.executeTransaction('nft', 'evolve', [tokenId], expectedEvents);
    }

    public async signup(): Promise<TransactionResult> {
        const gameContract = await this.getContract('game');
        const expectedEvents = [{
            contract: gameContract,
            eventName: 'UserSignedUp',
            filter: [this.userAddress]
        }];

        return this.executeTransaction('game', 'signup', [], expectedEvents);
    }

    public async purchaseTotem(speciesId: number): Promise<TransactionResult> {
        const gameContract = await this.getContract('game');
        const nftContract = await this.getContract('nft');

        // Listen for NFT Transfer event (mint)
        const expectedEvents = [{
            contract: nftContract,
            eventName: 'Transfer',
            filter: [ethers.ZeroAddress, this.userAddress]
        }];

        const result = await this.executeTransaction('game', 'purchaseTotem', [speciesId], expectedEvents);
        
        // Extract tokenId from the Transfer event
        let tokenId: bigint | undefined;
        if (result.events && result.events.length > 0) {
            const transferEvent = result.events.find(event => 
                event.eventName === 'Transfer' && 
                event.args[0] === ethers.ZeroAddress && 
                event.args[1].toLowerCase() === this.userAddress.toLowerCase()
            );
            
            if (transferEvent && transferEvent.args.length >= 3) {
                // The tokenId is the third argument in the Transfer event
                tokenId = transferEvent.args[2];
            }
        }
        
        // Return the result with the tokenId
        return {
            ...result,
            data: { tokenId }
        };
    }

    public async feed(tokenId: bigint): Promise<TransactionResult> {
        const gameContract = await this.getContract('game');
        const expectedEvents = [{
            contract: gameContract,
            eventName: 'ActionPerformed',
            filter: [tokenId, 0] // ActionType.Feed = 0
        }];

        return this.executeTransaction('game', 'feed', [tokenId], expectedEvents);
    }

    public async train(tokenId: bigint): Promise<TransactionResult> {
        const gameContract = await this.getContract('game');
        const expectedEvents = [{
            contract: gameContract,
            eventName: 'ActionPerformed',
            filter: [tokenId, 1] // ActionType.Train = 1
        }];

        return this.executeTransaction('game', 'train', [tokenId], expectedEvents);
    }

    public async treat(tokenId: bigint): Promise<TransactionResult> {
        const gameContract = await this.getContract('game');
        const expectedEvents = [{
            contract: gameContract,
            eventName: 'ActionPerformed',
            filter: [tokenId, 2] // ActionType.Treat = 2
        }];

        return this.executeTransaction('game', 'treat', [tokenId], expectedEvents);
    }

    public async claimDailyReward(): Promise<TransactionResult> {
        const rewardsContract = await this.getContract('rewards');
        const dailyRewardId = ethers.id("daily_login");
        const expectedEvents = [{
            contract: rewardsContract,
            eventName: 'RewardClaimed',
            filter: [dailyRewardId, this.userAddress]
        }];

        return this.executeTransaction('rewards', 'claim', [dailyRewardId], expectedEvents);
    }

    public async claimWeeklyReward(): Promise<TransactionResult> {
        const rewardsContract = await this.getContract('rewards');
        const weeklyRewardId = ethers.id("weekly_bonus");
        const expectedEvents = [{
            contract: rewardsContract,
            eventName: 'RewardClaimed',
            filter: [weeklyRewardId, this.userAddress]
        }];

        return this.executeTransaction('rewards', 'claim', [weeklyRewardId], expectedEvents);
    }

    public async purchaseProtection(rewardId: string, tier: number): Promise<TransactionResult> {
        const rewardsContract = await this.getContract('rewards');
        const expectedEvents = [{
            contract: rewardsContract,
            eventName: 'ProtectionPurchased',
            filter: [rewardId, this.userAddress]
        }];

        return this.executeTransaction('game', 'purchaseProtection', [rewardId, tier], expectedEvents);
    }

    public async setDisplayName(tokenId: bigint, newName: string): Promise<TransactionResult> {
        const nftContract = await this.getContract('nft');
        const expectedEvents = [{
            contract: nftContract,
            eventName: 'DisplayNameSet',
            filter: [tokenId, newName]
        }];

        return this.executeTransaction('nft', 'setDisplayName', [tokenId, newName], expectedEvents);
    }

    public async sellTotem(tokenId: bigint): Promise<TransactionResult> {
        const gameContract = await this.getContract('game');
        const expectedEvents = [{
            contract: gameContract,
            eventName: 'TotemSold',
            filter: [tokenId]
        }];

        return this.executeTransaction('game', 'sellTotem', [tokenId], expectedEvents);
    }

    public async purchaseUnboundTotem(tokenId: bigint): Promise<TransactionResult> {
        const gameContract = await this.getContract('game');
        const expectedEvents = [{
            contract: gameContract,
            eventName: 'TotemUnbound',
            filter: [tokenId]
        }];

        return this.executeTransaction('game', 'purchaseUnboundTotem', [tokenId], expectedEvents);
    }

    public async completeChallenge(challengeId: string, tokenId: bigint, score: number): Promise<TransactionResult> {
        const gameContract = await this.getContract('game');
        const expectedEvents = [{
            contract: gameContract,
            eventName: 'ChallengeCompleted',
            filter: [challengeId, tokenId]
        }];

        return this.executeTransaction('game', 'attemptChallenge', [challengeId, tokenId, score], expectedEvents);
    }
}
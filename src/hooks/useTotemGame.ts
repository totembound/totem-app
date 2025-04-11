import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, TotemGameContract, TotemShopContract, TotemNFTContract, TotemTokenContract, createGameContract, createTokenContract, createTotemNFTContract, createShopContract } from '../config/contracts';
import { useForwarder } from './useForwarder';
import { useUser } from '../contexts/UserContext';

export const useTotemGame = () => {
    const { provider, signer, address, isSignedUp, isTokenApproved } = useUser();

    const approveTokens = async () => {
        if (!provider || !signer) throw new Error('Not connected');

        const tokenContract = createTokenContract(provider);
        const connectedToken = tokenContract.connect(signer) as TotemTokenContract;

        const tx = await connectedToken.approve(CONTRACT_ADDRESSES.game, ethers.MaxUint256);

        console.log('Approval tx:', tx.hash);
        await tx.wait();
    };

    const buyTokens = async (amount: bigint) => {
        if (!provider || !signer) throw new Error('Not connected');
        
        const shopContract = createShopContract(provider);
        const connectedShop = shopContract.connect(signer) as TotemShopContract;
        const tx = await connectedShop.buyTokens({ value: amount }) ;
        if (!tx) throw new Error('Transaction failed');

        console.log('Buy tokens transaction:', tx.hash);
        return await tx.wait();
    };

    const purchaseTotem = async (speciesId: number) => {
        if (!provider || !signer) throw new Error('Not connected');

        try {
            // Check approval first
            if (!isTokenApproved) {
                console.log('Approving tokens...');
                await approveTokens();
            }

            // Setup NFT contract to listen for mint
            const nftContract = createTotemNFTContract(provider);
            const mintPromise = new Promise<bigint>((resolve) => {
                nftContract.once('Transfer', (from, to, tokenId) => {
                    if (from === ethers.ZeroAddress && to === signer.address) {
                        resolve(tokenId);
                    }
                });
            });

            // Purchase the totem
            const gameContract = createGameContract(provider);
            const connectedGame = gameContract.connect(signer) as TotemGameContract;
            console.log('Purchasing totem...', { speciesId });
            
            const tx = await connectedGame.purchaseTotem(speciesId);
            if (!tx) throw new Error('Transaction failed');
            console.log('Purchase tx sent:', tx.hash);
            
            // Wait for both the transaction receipt and the mint event
            const [receipt, tokenId] = await Promise.all([
                tx.wait(),
                mintPromise
            ]);
            
            console.log('Purchase tx mined:', receipt?.hash);
            console.log('Token minted:', tokenId.toString());

            return tokenId;
        }
        catch (error: any) {
            console.error('Purchase failed:', error);
            if (error.message.includes('user rejected')) {
                throw new Error('User rejected transaction');
            }
            else if (error.message.includes('insufficient')) {
                throw new Error('Insufficient TOTEM balance');
            }
            else {
                throw new Error('Failed to purchase totem: ' + error.message);
            }
        }
    };

    const sellTotem = async (tokenId: bigint) => {
        if (!provider || !signer) throw new Error('Not connected');
        
        try {
             // Get contract instances
            const nftContract = createTotemNFTContract(provider);
            const gameContract = createGameContract(provider);
            
            // Get contract addresses
            const gameAddress = CONTRACT_ADDRESSES.game; // Use the constant address
            
            // Connect contracts with signer
            const nftWithSigner = nftContract.connect(signer) as TotemNFTContract;
            const connectedGame = gameContract.connect(signer) as TotemGameContract;

            console.log('Checking approval status...');
            console.log('Game address:', gameAddress);
            console.log('Token ID:', tokenId.toString());
            
            // Check if game contract is approved for NFT
            const isApproved = await nftContract.isApprovedForAll(address, gameAddress) ||
                            (await nftContract.getApproved(tokenId)) === gameAddress;

            if (!isApproved) {
                console.log('Approving NFT transfer...');
                const approveTx = await nftWithSigner.approve(gameAddress, tokenId);
                console.log('Approval tx:', approveTx.hash);
                await approveTx.wait();
                console.log('Approval confirmed');
            }

            console.log('Selling totem...');
            const tx = await connectedGame.sellTotem(tokenId);
            console.log('Sell tx:', tx.hash);
            console.log('Waiting for confirmation...');
            await tx.wait();
            console.log('Sale completed');
        }
        catch (error: any) {
            console.error('Sell totem failed:', error);
            throw new Error(error.message.includes('user rejected') 
                ? 'User rejected transaction' 
                : 'Failed to sell totem');
        }
    };

    const purchaseBundle = async (bundleId: number, polAmount: bigint) => {
        if (!provider || !signer) throw new Error('Not connected');
        
        try {
            // Setup NFT contract to listen for mint
            const nftContract = createTotemNFTContract(provider);
            const mintPromise = new Promise<bigint>((resolve) => {
                nftContract.once('Transfer', (from, to, tokenId) => {
                    if (from === ethers.ZeroAddress && to === signer.address) {
                        resolve(tokenId);
                    }
                });
            });

            const shopContract = createShopContract(provider);
            const connectedShop = shopContract.connect(signer) as TotemShopContract;

            console.log('Purchasing bundle...', { bundleId });

            const tx = await connectedShop.purchaseBundle(bundleId, { value: polAmount });
            if (!tx) throw new Error('Transaction failed');
            console.log('Purchase tx sent:', tx.hash);

            // Wait for both the transaction receipt and the mint event
            const [receipt, tokenId] = await Promise.all([
                tx.wait(),
                mintPromise
            ]);

            return tokenId;
        }
        catch (error: any) {
            console.error('Bundle purchase failed:', error);
            if (error.message.includes('user rejected')) {
                throw new Error('User rejected transaction');
            }
            throw new Error('Failed to purchase bundle: ' + error.message);
        }
    };

    const feed = async (tokenId: bigint) => {
        if (!provider || !signer) throw new Error('Not connected');
        
        try {
            const contract = createGameContract(provider);
            const connectedContract = contract.connect(signer) as TotemGameContract;
            const tx = await connectedContract.feed(tokenId);
            await tx.wait();
        }
        catch (error: any) {
            console.error('Feed failed:', error);
            throw new Error(error.message.includes('user rejected') 
                ? 'User rejected transaction' 
                : 'Failed to feed totem');
        }
    };

    const train = async (tokenId: bigint) => {
        if (!provider || !signer) throw new Error('Not connected');
        
        try {
            const contract = createGameContract(provider);
            const connectedContract = contract.connect(signer) as TotemGameContract;
            const tx = await connectedContract.train(tokenId);
            await tx.wait();
        }
        catch (error: any) {
            console.error('Train failed:', error);
            throw new Error(error.message.includes('user rejected') 
                ? 'User rejected transaction' 
                : 'Failed to train totem');
        }
    };
    
    const treat = async (tokenId: bigint) => {
        if (!provider || !signer) throw new Error('Not connected');
        
        try {
            const contract = createGameContract(provider);
            const connectedContract = contract.connect(signer) as TotemGameContract;
            const tx = await connectedContract.treat(tokenId);
            await tx.wait();
        }
        catch (error: any) {
            console.error('Treat failed:', error);
            throw new Error(error.message.includes('user rejected') 
                ? 'User rejected transaction' 
                : 'Failed to treat totem');
        }
    };

    const evolve = async (tokenId: bigint) => {
        if (!provider || !signer) throw new Error('Not connected');
        
        try {
            const contract = createTotemNFTContract(provider);
            const connectedContract = contract.connect(signer) as TotemNFTContract;
            const tx = await connectedContract.evolve(tokenId);
            await tx.wait();
        }
        catch (error: any) {
            console.error('Evolve totem failed:', error);
            throw new Error(error.message.includes('user rejected') 
                ? 'User rejected transaction' 
                : 'Failed to evolve totem');
        }
    };

    const setDisplayName = async (tokenId: bigint, newName: string) => {
        if (!provider || !signer) throw new Error('Not connected');
        
        try {
            const contract = createTotemNFTContract(provider);
            const connectedContract = contract.connect(signer) as TotemNFTContract;
            const tx = await connectedContract.setDisplayName(tokenId, newName);
            await tx.wait();
        }
        catch (error: any) {
            console.error('Name update failed:', error);
            throw new Error(error.message.includes('user rejected') 
                ? 'User rejected transaction' 
                : 'Failed to update name');
        }
    };

    return {
        buyTokens,
        purchaseTotem,
        purchaseBundle,
        sellTotem,
        approveTokens,
        feed,
        train,
        treat,
        evolve,
        setDisplayName
    };
};

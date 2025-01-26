import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, TotemGameContract, TotemNFTContract, TotemTokenContract, createGameContract, createTokenContract, createTotemNFTContract } from '../config/contracts';
import { useForwarder } from './useForwarder';
import { useUser } from '../contexts/UserContext';

export const useTotemGame = () => {
    const { provider, signer, address, isSignedUp } = useUser();
    const forwarder = useForwarder(provider, signer);

    const checkTokenApproval = async () => {
        if (!provider || !address) return false;

        try {
            const tokenContract = createTokenContract(provider);
            const allowance = await tokenContract.allowance(address, CONTRACT_ADDRESSES.game);
            console.log('Token Allowance: ', allowance);
    
            return allowance > 0;
        }
        catch (error: any) {
            console.error('Token Approval failed:', error);

            if (error.message.includes('user rejected')) {
                throw new Error('User rejected signature request');
            }
            throw new Error('Token Approval failed. Please try again.');
        }
     };

    const signup = async () => {
        if (!provider || !address) throw new Error('Not connected');
        if (isSignedUp) throw new Error("Already signed up");

        console.log('Starting signup process');
        console.log('Connected address:', address);
        console.log('Game contract:', await CONTRACT_ADDRESSES.game);

        console.log('Attempting signup for:', address);

        try {
            const gameContract = createGameContract(provider);
            const connectedGame = gameContract.connect(signer) as TotemGameContract;
            const tx = await connectedGame.signup();
            console.log('Waiting for transaction:', tx.hash);
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);

            return receipt;
        }
        catch (error: any) {
            console.error('Signup failed:', error);

            if (error.message.includes('user rejected')) {
                throw new Error('User rejected signature request');
            }
            throw new Error('Signup failed. Please try again.');
        }
    };

    const approveTokenSpend = async () => {
        if (!provider || !signer) throw new Error('Not connected');

        const tokenContract = createTokenContract(provider);
        const connectedToken = tokenContract.connect(signer) as TotemTokenContract;

        const tx = await connectedToken.approve(CONTRACT_ADDRESSES.game, ethers.MaxUint256);
        console.log('Waiting for transaction:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);

        return receipt;
    };

    // FUTURES: gasless transactions not supported yet
    const signupGasless = async () => {
        if (!provider || !address) throw new Error('Not connected');
        if (isSignedUp) throw new Error("Already signed up");

        console.log('Starting gasless signup process');
        console.log('Connected address:', address);
        console.log('Game contract:', await CONTRACT_ADDRESSES.game);

        console.log('Attempting gasless signup for:', address);

        try {
            // Encode the signup function call
            const gameContract = createGameContract(provider);
            const signupData = gameContract.interface.encodeFunctionData('signup', []);
            console.log('Encoded signup data:', signupData);

            // Create the forward request
            const request = await forwarder.createRequest(
                address,
                CONTRACT_ADDRESSES.game,
                signupData
            );
            
            // Sign the request
            const signature = await forwarder.signRequest(request);
            
            // Execute through the forwarder
            console.log('Relaying transaction through forwarder');
            // Send transaction
            const tx = await forwarder.relay(request, signature);
            console.log('Waiting for transaction:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);

            return receipt;
        }
        catch (error: any) {
            console.error('Gasless signup failed:', error);

            if (error.message.includes('user rejected')) {
                throw new Error('User rejected signature request');
            }
            throw new Error('Gasless signup failed. Please try again.');
        }
    };

    const buyTokens = async (amount: bigint) => {
        if (!provider || !signer) throw new Error('Not connected');
        
        const gameContract = createGameContract(provider);
        const connectedGame = gameContract.connect(signer) as TotemGameContract;
        const tx = await connectedGame.buyTokens({ value: amount }) ;
        console.log('Buy tokens transaction:', tx.hash);
        return await tx.wait();
    };

    const purchaseTotem = async (speciesId: number) => {
        if (!provider || !signer) throw new Error('Not connected');
        
        // Check TOTEM balance first
        const tokenContract = createTokenContract(provider);
        const balance = await tokenContract.balanceOf(address);

        if (balance < ethers.parseEther('500')) {
            throw new Error('Insufficient TOTEM balance');
        }

        // Approve TOTEM spending first
        //const connectedToken = tokenContract.connect(signer) as TotemTokenContract;
        //const approveTx = await connectedToken.approve(
            //CONTRACT_ADDRESSES.game,
            //ethers.parseEther('500')
        //);
        //await approveTx.wait();
        //console.log('Token approval confirmed');

        // Purchase totem
        const gameContract = createGameContract(provider);
        const connectedGame = gameContract.connect(signer) as TotemGameContract;
        const tx = await connectedGame.purchaseTotem(speciesId);
        console.log('Purchase totem transaction:', tx.hash);
        return await tx.wait();
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
        signup,
        signupGasless,
        buyTokens,
        purchaseTotem,
        checkTokenApproval,
        approveTokenSpend,
        feed,
        train,
        evolve,
        setDisplayName
    };
};

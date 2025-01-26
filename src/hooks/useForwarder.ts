import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, FORWARDER_ABI } from '../config/contracts';

interface ForwardRequest {
    from: string;
    to: string;
    value: bigint;
    gas: bigint;
    nonce: bigint;
    data: string;
}

export const useForwarder = (provider: ethers.BrowserProvider | null, signer: ethers.JsonRpcSigner | null) => {
    const forwarderContract = provider && CONTRACT_ADDRESSES.forwarder
        ? new ethers.Contract(CONTRACT_ADDRESSES.forwarder, FORWARDER_ABI, provider)
        : null;

    const createRequest = async (from: string, to: string, data: string): Promise<ForwardRequest> => {
        if (!forwarderContract || !from || !to) {
            throw new Error('Missing required parameters');
        }

        // Debug log the parameters
        console.log('Creating forward request:', {
            from: from.toLowerCase(),
            to: to.toLowerCase(),
            forwarderAddress: CONTRACT_ADDRESSES.forwarder,
            dataHex: data
        });
        
        console.log('Addresses:', {
            game: CONTRACT_ADDRESSES.game,
            forwarder: CONTRACT_ADDRESSES.forwarder,
            token: CONTRACT_ADDRESSES.token
        });

        // Estimate gas for the actual transaction
        //onst gasEstimate = await provider?.estimateGas({
           // from: CONTRACT_ADDRESSES.forwarder,
            //to: to,
           // data: data
        //});

        // Add buffer for forwarder overhead
        //const gasLimit = gasEstimate ? (gasEstimate * BigInt(120)) / BigInt(100) : BigInt(500000);

        const nonce = await forwarderContract.getNonce(from.toLowerCase());

        const request: ForwardRequest = {
            from: from.toLowerCase(),
            to: to.toLowerCase(),
            value: BigInt(0),
            gas: BigInt(1000000), // Fixed gas limit for debugging
            nonce,
            data,
        };

        // Debug log the complete request
        console.log('Created request:', {
            ...request,
            gas: request.gas.toString(),
            nonce: request.nonce.toString()
        });

        return request;
    };

    const signRequest = async (request: ForwardRequest): Promise<string> => {
        if (!signer) throw new Error('No signer available');

        const chainId = await provider?.getNetwork().then(n => n.chainId);
        console.log('Chain ID:', chainId);

        const domain = {
            name: 'TotemTrustedForwarder',
            version: '1',
            chainId: chainId,
            verifyingContract: CONTRACT_ADDRESSES.forwarder,
        };

        const types = {
            ForwardRequest: [
                { name: 'from', type: 'address' },
                { name: 'to', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'gas', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'data', type: 'bytes' },
            ],
        };

        console.log('Signing domain:', domain);
        console.log('Request to sign:', {
            ...request,
            gas: request.gas.toString(),
            nonce: request.nonce.toString()
        });

        try {
            const signature = await signer.signTypedData(domain, types, request);
            console.log('Got signature:', signature);
            return signature;
        } catch (error) {
            console.error('Signing failed:', error);
            throw new Error('Failed to sign request');
        }
    };

    const relay = async (request: ForwardRequest, signature: string) => {
        if (!forwarderContract) throw new Error('Forwarder contract not initialized');
        
        try {
            // First check target contract
            const target = await forwarderContract.targetContract();
            console.log('Forwarder target contract:', target);
            console.log('Expected target:', CONTRACT_ADDRESSES.game);
            
            if (target.toLowerCase() !== CONTRACT_ADDRESSES.game.toLowerCase()) {
                throw new Error('Forwarder target contract mismatch');
            }

            // Debug verification
            const verified = await forwarderContract.verify(request, signature);
            console.log('Request verification:', verified);
            if (!verified) {
                throw new Error('Request verification failed');
            }

            // Get current gas price
            const feeData = await provider?.getFeeData();
            console.log('Current gas price:', ethers.formatUnits(feeData?.gasPrice || 0, 'gwei'), 'gwei');

            const connectedForwarder = forwarderContract.connect(signer!);
            console.log('Sending relay transaction with request:', {
                from: request.from,
                to: request.to,
                value: request.value.toString(),
                gas: request.gas.toString(),
                nonce: request.nonce.toString(),
                data: request.data
            });

            // Send transaction with explicit gas limit
            const tx = await (connectedForwarder as any).relay(request, signature, {
                gasLimit: BigInt(500000),  // Fixed gas limit
                // Tell ethers this is a "type 0" transaction (no EIP-1559)
                type: 0,
                gasPrice: feeData?.gasPrice
            });

            console.log('Meta-transaction sent:', {
                hash: tx.hash,
                userAddress: request.from,
                targetContract: request.to,
            });

            return tx;

            //const tx = await (connectedForwarder as any).relay(request, signature);
            //console.log('Relay transaction sent:', tx.hash);
            //const receipt = await tx.wait();
            //console.log('Relay transaction mined:', receipt);
            //return receipt;
        } catch (error: any) {
            console.error('Relay failed:', error);
            const errorMessage = error.message || 'unknown error';
            
            // Check for specific error conditions
            if (errorMessage.includes('target contract')) {
                throw new Error('Forwarder not properly configured');
            } else if (errorMessage.includes('verify')) {
                throw new Error('Signature verification failed');
            } else {
                throw new Error('Transaction relay failed: ' + errorMessage);
            }
        }
    };

    return {
        createRequest,
        signRequest,
        relay,
    };
};

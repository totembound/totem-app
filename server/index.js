// server/index.js
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Express app
const app = express();
const PORT = process.env.RELAYER_PORT || 3001;
const API_KEY = process.env.RELAY_API_KEY;

// Configure middleware
app.use(helmet()); // Security headers
app.use(express.json()); // Parse JSON request body
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Load configuration
const FORWARDER_ABI = require('../src/contracts/TotemTrustedForwarder.abi.json');
const contractAddresses = {
  forwarder: process.env.FORWARDER_ADDRESS,
  game: process.env.GAME_ADDRESS,
  nft: process.env.NFT_ADDRESS,
  token: process.env.TOKEN_ADDRESS,
  rewards: process.env.REWARDS_ADDRESS
};

// Initialize provider and wallet
let provider;
let wallet;
let forwarderContract;

async function initializeProvider() {
  try {
    console.log('Deployment RPC URL:', process.env.RPC_URL);
    console.log('Deployer Private Key:', process.env.FORWARDER_PRIVATE_KEY);
    
    provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    wallet = new ethers.Wallet(process.env.FORWARDER_PRIVATE_KEY, provider);
    forwarderContract = new ethers.Contract(
      contractAddresses.forwarder,
      FORWARDER_ABI,
      wallet
    );
    
    const balance = await wallet.provider.getBalance(wallet.address);
    console.log(`Relayer wallet balance: ${ethers.formatEther(balance)} POL`);
    
    if (ethers.formatEther(balance) < 0.1) {
      console.warn('WARNING: Relayer wallet balance is low. Please fund the wallet.');
    }
  } catch (error) {
    console.error('Failed to initialize provider:', error);
    process.exit(1);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Relay endpoint
app.post('/relay', async (req, res) => {
    // API Key validation
    const providedApiKey = req.headers['x-api-key'];
    
    if (!providedApiKey || providedApiKey !== API_KEY) {
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Invalid or missing API key'
        });
    }

    try {
    const { contractType, functionName, request, signature } = req.body;

    // Validate request
    if (!request || !signature) {
      return res.status(400).json({ error: 'Missing request or signature' });
    }

    // Validate target contract
    const targetAddress = contractAddresses[contractType];
    if (!targetAddress) {
      return res.status(400).json({ error: 'Invalid contract type' });
    }

    if (request.to.toLowerCase() !== targetAddress.toLowerCase()) {
      return res.status(400).json({ error: 'Request destination does not match specified contract' });
    }

    // Check gas price
    const feeData = await provider.getFeeData();
    const maxGasPrice = ethers.parseUnits(process.env.MAX_GAS_PRICE || '50', 'gwei');
    
    if (feeData.gasPrice > maxGasPrice) {
      return res.status(503).json({ 
        error: 'Gas price too high',
        currentGasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei'),
        maxGasPrice: ethers.formatUnits(maxGasPrice, 'gwei')
      });
    }

    // Check wallet balance
    const balance = await wallet.provider.getBalance(wallet.address);
    const minBalance = ethers.parseEther(process.env.MIN_WALLET_BALANCE || '0.1');

    if (balance < minBalance) {
        return res.status(503).json({ 
            error: 'Insufficient forwarder balance',
            currentBalance: ethers.formatEther(balance),
            minBalance: ethers.formatUnits(minBalance, 'ether')
        });
    }

    // Log request information
    console.log(`Relaying ${contractType}.${functionName} for ${request.from}`);

    // Verify signature
    const isValid = await forwarderContract.verify(request, signature);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Submit transaction
    const tx = await forwarderContract.relay(request, signature, {
      gasLimit: BigInt(request.gas),
      gasPrice: feeData.gasPrice
    });

    console.log(`Transaction sent: ${tx.hash}`);

    // Return response immediately without waiting for confirmation
    res.json({
      success: true,
      txHash: tx.hash
    });

    // Log confirmation in background
    tx.wait().then((receipt) => {
      console.log(`Transaction confirmed: ${receipt.hash} (${contractType}.${functionName})`);
    }).catch((error) => {
      console.error(`Transaction failed: ${tx.hash}`, error);
    });

    const newBalance = await wallet.provider.getBalance(wallet.address);
    console.log(`Relayer wallet balance: ${ethers.formatEther(newBalance)} POL`);
  } catch (error) {
    console.error('Relay error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal relay error: ' + error.message
    });
  }
});

// Start server
async function startServer() {
  await initializeProvider();
  app.listen(PORT, () => {
    console.log(`Relayer API running on port ${PORT}`);
  });
}

startServer().catch(console.error);
# TotemBound Frontend
A React-based decentralized application for collecting, training, and evolving mystical animal spirits as NFTs on the Polygon network.

## Features
- Web3 wallet integration with MetaMask
- NFT collection management and visualization
- Token-based game economy ($TOTEM)
- Interactive training and evolution system
- Real-time blockchain state management
- TypeScript for enhanced type safety
- Tailwind CSS for responsive design

## Prerequisites
- Node.js (v16+)
- npm or yarn
- MetaMask browser extension
- Access to Polygon network (Amoy testnet)

## Core Components
- SignupForm: User onboarding and wallet connection
- GameControls: Token purchase and Totem minting interface
- TotemGallery: NFT collection display and management
- UserInfoPanel: Account status and balance display

## Smart Contract Integration
The frontend interacts with several smart contracts:
- Game Contract: Core game mechanics
- Token Contract: $TOTEM ERC20 token
- NFT Contract: Totem NFT collection (ERC721)
- Forwarder Contract: Meta-transactions (future implementation)

## Development Roadmap
- ✅ Basic game mechanics
- ✅ NFT minting and management
- ✅ Training and evolution system
- ✅ Challenge system
- ✅ Gasless transactions
- 🔲 New Totem species
- 🔲 Staking mechanism
- 🔲 Marketplace for trading
- 🔲 Accessories and customization

## Installation
1. Clone the repository:
```bash
git clone https://github.com/totembound/totem-app.git
```

2. Clone the contracts repository:
```bash
git clone https://github.com/totembound/totem-contracts.git
cd totem-contracts
```

3. Build and export ABIs for frontend:
```bash
npm install
npx hardhat compile
npx hardhat export-abi 
```

4. Install app dependencies:
```bash
cd ../totem-app
npm install
```

5. Configure environment:
Review the hardhat.config.ts for localhost deployment.
```bash
cp .env.example .env
```

6. Set up environment variables for testnet:
```plaintext
REACT_APP_GAME_ADDRESS="game_proxy_address"
REACT_APP_FORWARDER_ADDRESS="forwarder_address"
REACT_APP_TOKEN_ADDRESS="token_proxy_address"
REACT_APP_NFT_ADDRESS="nft_proxy_address"
REACT_APP_REWARDS_ADDRESS="rewards_proxy_address"
REACT_APP_ACHIEVEMENTS_ADDRESS="achievements_proxy_address"
REACT_APP_CHALLENGES_ADDRESS="challenges_proxy_address"
```

## Development

1. Building for Production
```bash
npm run build
```

2. Run tests
```bash
npm run test
```

3. Load development server and app in browser
```bash
npm start
```

## Project Structure
```plaintext
src/
├── components/           # React components
├── config/              # Configuration files
│   ├── contracts.ts     # Contract ABIs and addresses
│   └── network.ts       # Network configuration
├── contexts/            # React contexts
│   └── UserContext.tsx  # User and wallet state management
├── hooks/               # Custom React hooks
│   ├── useForwarder.ts  # Meta-transaction handling
│   └── useTotemGame.ts  # Game interaction logic
├── types/               # TypeScript type definitions
│   └── types.ts         # Game-specific types
└── utils/               # Utility functions
```


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
- 🔲 Gasless transactions
- 🔲 Staking mechanism
- 🔲 New Totem species
- 🔲 Challenge system
- 🔲 Marketplace for trading
- 🔲 Accessories and customization

## Installation
1. Clone the repository:
```bash
git clone https://github.com/starman69/dapp-totembound-frontend.git
cd dapp-totembound-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
Review the hardhat.config.ts for localhost deployment.
```bash
cp .env.example .env
```

4. Set up environment variables for testnet:
```plaintext
REACT_APP_GAME_ADDRESS="game_address"
REACT_APP_FORWARDER_ADDRESS="forwarder_address"
REACT_APP_TOKEN_ADDRESS="token_address"
REACT_APP_NFT_ADDRESS="nft_address"
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
│   ├── ApprovalStatus
│   ├── GameControls
│   ├── SignupForm
│   ├── TotemGallery
│   └── UserInfoPanel
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


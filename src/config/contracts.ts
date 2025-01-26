import { Contract, BrowserProvider } from 'ethers';
import { TotemAttributes } from '../types/types';

export const CONTRACT_ADDRESSES = {
    game: process.env.REACT_APP_GAME_ADDRESS as string,
    forwarder: process.env.REACT_APP_FORWARDER_ADDRESS as string,
    token: process.env.REACT_APP_TOKEN_ADDRESS as string,
    nft: process.env.REACT_APP_NFT_ADDRESS as string,
};

// ABI snippets for the functions we need
export const FORWARDER_ABI = [
    "function getNonce(address from) public view returns (uint256)",
    "function verify(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) public view returns (bool)",
    "function relay(tuple(address from, address to, uint256 value, uint256 gas, uint256 nonce, bytes data) req, bytes signature) returns (bool, bytes)",
    "function targetContract() external view returns (address)",
    "function setTargetContract(address _targetContract) external"
];

export const GAME_ABI = [
    "function signup() external",
    "function hasAccount(address) external view returns (bool)",
    "function buyTokens() external payable",
    "function purchaseTotem(uint8 speciesId) external",
    "function feed(uint256 tokenId) external",
    "function train(uint256 tokenId) external",
    "event UserSignedUp(address indexed user)"
];

export const TOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

export const TOTEM_NFT_ABI = [
    'function tokensOfOwner(address owner) view returns (uint256[])',
    'function attributes(uint256 tokenId) view returns (uint8 species, uint8 color, uint8 rarity, uint256 happiness, uint256 experience, uint256 stage, uint256 lastFed, bool isStaked, string displayName)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function evolve(uint256 tokenId) external',
    'function setDisplayName(uint256 tokenId, string memory newName) external'
];

// Define interface for contract functions
export type TotemGameContract = Contract & {
    signup: () => Promise<any>;
    hasAccount: (address: string) => Promise<boolean>;
    buyTokens: (overrides?: { value: bigint }) => Promise<any>;
    purchaseTotem: (speciesId: number) => Promise<any>;
    feed: (tokenId: bigint) => Promise<any>;
    train: (tokenId: bigint) => Promise<any>;
};

export type TotemTokenContract = Contract & {
    balanceOf: (address: string) => Promise<bigint>;
    approve: (spender: string, amount: bigint) => Promise<any>;
    allowance: (owner: string, spender: string) => Promise<any>;
};

export type TotemNFTContract = Contract & {
    tokensOfOwner: (owner: string) => Promise<bigint[]>;
    attributes: (tokenId: bigint | number) => Promise<TotemAttributes>;
    tokenURI: (tokenId: bigint | number) => Promise<string>;
    evolve: (tokenId: bigint | number) => Promise<any>;
    setDisplayName: (tokenId: bigint | number, displayName: string) => Promise<any>;
};

export const createGameContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.game,
        GAME_ABI,
        provider
    ) as TotemGameContract;
};

export const createTokenContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.token,
        TOKEN_ABI,
        provider
    ) as TotemTokenContract;
};

export const createTotemNFTContract = (provider: BrowserProvider) => {
    return new Contract(
        CONTRACT_ADDRESSES.nft,
        TOTEM_NFT_ABI,
        provider
    ) as TotemNFTContract;
};

export const NETWORK_CONFIG = {
    chainId: import.meta.env.VITE_NETWORK_ID || '31337',
    name: 'Polygon Amoy',
    rpcUrl: import.meta.env.VITE_RPC_URL || 'http://localhost:8545',
};

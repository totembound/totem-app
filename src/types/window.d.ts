interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      selectedAddress: string | null;
      isConnected: () => boolean;
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
      removeAllListeners: () => void;
    };
  }
  
  interface EthereumEvent {
    connect: { chainId: string };
    disconnect: undefined;
    accountsChanged: string[];
    chainChanged: string;
    message: { type: string; data: unknown };
  }
  
  type EthereumEventKey = keyof EthereumEvent;
  type EthereumEventHandler<K extends EthereumEventKey> = (event: EthereumEvent[K]) => void;
  
  // Optional: If you need a more specific provider type
  interface MetaMaskProvider {
    isMetaMask?: boolean;
    selectedAddress: string | null;
    isConnected: () => boolean;
    request: (args: {
      method: string;
      params?: unknown[];
    }) => Promise<unknown>;
    on<K extends EthereumEventKey>(event: K, handler: EthereumEventHandler<K>): void;
    removeListener<K extends EthereumEventKey>(event: K, handler: EthereumEventHandler<K>): void;
  }

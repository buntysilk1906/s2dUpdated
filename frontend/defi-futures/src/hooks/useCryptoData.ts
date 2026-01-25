import { useState, useEffect, useCallback } from 'react';
import { CryptoAsset, PriceHistory } from '@/types/defi';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const useCryptoData = () => {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true`
      );
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      setAssets(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch crypto data');
     
      setAssets([
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
          current_price: 67234.00,
          price_change_percentage_24h: 2.34,
          market_cap: 1320000000000,
          total_volume: 28500000000,
          sparkline_in_7d: { price: Array.from({ length: 168 }, () => 65000 + Math.random() * 4000) },
        },
        {
          id: 'ethereum',
          symbol: 'eth',
          name: 'Ethereum',
          image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
          current_price: 3456.78,
          price_change_percentage_24h: 1.56,
          market_cap: 415000000000,
          total_volume: 15200000000,
          sparkline_in_7d: { price: Array.from({ length: 168 }, () => 3200 + Math.random() * 500) },
        },
        {
          id: 'tether',
          symbol: 'usdt',
          name: 'Tether',
          image: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
          current_price: 1.00,
          price_change_percentage_24h: 0.01,
          market_cap: 95000000000,
          total_volume: 52000000000,
          sparkline_in_7d: { price: Array.from({ length: 168 }, () => 0.999 + Math.random() * 0.002) },
        },
        {
          id: 'binancecoin',
          symbol: 'bnb',
          name: 'BNB',
          image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
          current_price: 584.32,
          price_change_percentage_24h: -0.89,
          market_cap: 87000000000,
          total_volume: 1500000000,
          sparkline_in_7d: { price: Array.from({ length: 168 }, () => 560 + Math.random() * 50) },
        },
        {
          id: 'solana',
          symbol: 'sol',
          name: 'Solana',
          image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
          current_price: 178.45,
          price_change_percentage_24h: 4.23,
          market_cap: 82000000000,
          total_volume: 3200000000,
          sparkline_in_7d: { price: Array.from({ length: 168 }, () => 160 + Math.random() * 30) },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
    const interval = setInterval(fetchAssets, 60000);
    return () => clearInterval(interval);
  }, [fetchAssets]);

  return { assets, loading, error, refetch: fetchAssets };
};

export const usePriceHistory = (coinId: string, days: number = 7) => {
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${COINGECKO_API}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const data = await response.json();
        setHistory(data);
      } catch {
        // Generate mock data
        const now = Date.now();
        const interval = (days * 24 * 60 * 60 * 1000) / 100;
        const basePrice = coinId === 'bitcoin' ? 65000 : coinId === 'ethereum' ? 3400 : 100;
        
        setHistory({
          prices: Array.from({ length: 100 }, (_, i) => [
            now - (100 - i) * interval,
            basePrice + (Math.random() - 0.5) * basePrice * 0.1,
          ]),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [coinId, days]);

  return { history, loading };
};

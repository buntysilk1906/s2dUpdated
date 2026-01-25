import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Search, Filter } from 'lucide-react';
import { useCryptoData } from '@/hooks/useCryptoData';
import { Input } from '@/components/ui/input';
import MiniChart from '@/components/MiniChart';
import DetailedChartPopup from '@/components/DetailedChartPopup';
import { CryptoAsset } from '@/types/defi';

const MarketsPage: React.FC = () => {
  const { assets, loading } = useCryptoData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-display font-bold gradient-text mb-2">
            Markets
          </h1>
          <p className="text-muted-foreground">
            Real-time cryptocurrency prices and market data
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="flex flex-col md:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-primary/20 focus:border-primary"
            />
          </div>
          <motion.button
            className="glass-button flex items-center gap-2 px-6 py-2 rounded-lg text-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter className="w-4 h-4" />
            Filter
          </motion.button>
        </motion.div>

        {/* Market Stats Overview */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="stat-card text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Market Cap</p>
            <p className="text-2xl font-bold gradient-text">$2.45T</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-sm text-muted-foreground mb-2">24h Volume</p>
            <p className="text-2xl font-bold gradient-text">$98.5B</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-sm text-muted-foreground mb-2">BTC Dominance</p>
            <p className="text-2xl font-bold gradient-text">52.3%</p>
          </div>
        </motion.div>

        {/* Markets Table */}
        <motion.div
          className="glass-card overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-sm font-medium text-muted-foreground">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Asset</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">24h Change</div>
            <div className="col-span-2 text-right">Market Cap</div>
            <div className="col-span-2 text-right">Chart (7d)</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-4 animate-pulse">
                  <div className="col-span-1"><div className="h-4 bg-muted rounded w-6" /></div>
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="h-4 bg-muted rounded w-20" />
                  </div>
                  <div className="col-span-2"><div className="h-4 bg-muted rounded w-16 ml-auto" /></div>
                  <div className="col-span-2"><div className="h-4 bg-muted rounded w-12 ml-auto" /></div>
                  <div className="col-span-2"><div className="h-4 bg-muted rounded w-16 ml-auto" /></div>
                  <div className="col-span-2"><div className="h-8 bg-muted rounded w-full" /></div>
                </div>
              ))
            ) : (
              filteredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedAsset(asset)}
                  whileHover={{ x: 4 }}
                >
                  <div className="col-span-1 text-muted-foreground">{index + 1}</div>
                  <div className="col-span-3 flex items-center gap-3">
                    <img src={asset.image} alt={asset.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-semibold text-foreground">{asset.name}</p>
                      <p className="text-xs text-muted-foreground uppercase">{asset.symbol}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-right font-mono font-medium text-foreground">
                    ${asset.current_price.toLocaleString()}
                  </div>
                  <div className={`col-span-2 text-right flex items-center justify-end gap-1 ${
                    asset.price_change_percentage_24h >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                    {asset.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(asset.price_change_percentage_24h).toFixed(2)}%
                  </div>
                  <div className="col-span-2 text-right text-muted-foreground">
                    ${(asset.market_cap / 1e9).toFixed(2)}B
                  </div>
                  <div className="col-span-2">
                    <MiniChart
                      data={asset.sparkline_in_7d?.price.slice(-48) || []}
                      color={asset.price_change_percentage_24h >= 0 ? '#22c55e' : '#ef4444'}
                      height={32}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Detailed Chart Popup */}
      <DetailedChartPopup asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
    </div>
  );
};

export default MarketsPage;

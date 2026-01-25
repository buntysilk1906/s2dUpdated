import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { usePriceHistory } from '@/hooks/useCryptoData';
import { CryptoAsset } from '@/types/defi';

interface DetailedChartPopupProps {
  asset: CryptoAsset | null;
  onClose: () => void;
}

const timeframes = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
];

const DetailedChartPopup: React.FC<DetailedChartPopupProps> = ({ asset, onClose }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(7);
  const { history, loading } = usePriceHistory(asset?.id || '', selectedTimeframe);

  if (!asset) return null;

  const chartData = history?.prices.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString(),
    price,
    timestamp,
  })) || [];

  const priceChange = chartData.length > 1 
    ? ((chartData[chartData.length - 1].price - chartData[0].price) / chartData[0].price) * 100 
    : 0;

  const isPositive = priceChange >= 0;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-card max-w-4xl w-full p-8 relative glow-border"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <img src={asset.image} alt={asset.name} className="w-16 h-16 rounded-full" />
              <div>
                <h2 className="text-3xl font-display font-bold text-foreground">
                  {asset.name}
                </h2>
                <span className="text-lg text-muted-foreground uppercase">{asset.symbol}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold gradient-text">
                ${asset.current_price.toLocaleString()}
              </p>
              <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="font-medium">{priceChange.toFixed(2)}%</span>
                <span className="text-muted-foreground text-sm">({selectedTimeframe}D)</span>
              </div>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-2 mb-6">
            {timeframes.map((tf) => (
              <motion.button
                key={tf.days}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedTimeframe === tf.days
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                onClick={() => setSelectedTimeframe(tf.days)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {tf.label}
              </motion.button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    domain={['dataMin', 'dataMax']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(185, 100%, 50%)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
              <p className="text-lg font-bold gradient-text">
                ${(asset.market_cap / 1e9).toFixed(2)}B
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">24h Volume</p>
              <p className="text-lg font-bold gradient-text">
                ${(asset.total_volume / 1e9).toFixed(2)}B
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">24h Change</p>
              <p className={`text-lg font-bold ${asset.price_change_percentage_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                {asset.price_change_percentage_24h.toFixed(2)}%
              </p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <p className="text-lg font-bold gradient-text">
                ${asset.current_price.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DetailedChartPopup;

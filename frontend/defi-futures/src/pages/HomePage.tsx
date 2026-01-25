import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, TrendingUp, ArrowRight, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { useCryptoData } from '@/hooks/useCryptoData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import FeaturePopup from '@/components/FeaturePopup';
import LiquidatorSection from '@/components/LiquidatorSection';
import MiniChart from '@/components/MiniChart';
import DetailedChartPopup from '@/components/DetailedChartPopup';
import { CryptoAsset } from '@/types/defi';

const HomePage: React.FC = () => {
  const { wallet, connectWallet } = useWallet();
  const { assets, loading } = useCryptoData();
  const { toast } = useToast();
  const [activeFeature, setActiveFeature] = useState<'secure' | 'instant' | 'earn' | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<CryptoAsset | null>(null);

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast({
        title: "Wallet Connected",
        description: "Welcome to DeFi Lend!",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const features = [
    { id: 'secure' as const, icon: Shield, title: 'Secure & Safe', description: 'Audited smart contracts with multi-sig protection' },
    { id: 'instant' as const, icon: Zap, title: 'Instant Access', description: 'No lock-up periods, withdraw anytime' },
    { id: 'earn' as const, icon: TrendingUp, title: 'Earn Interest', description: 'Competitive APY on your deposits' },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:60px_60px] opacity-10" />
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/20 blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-secondary/20 blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              className="text-5xl md:text-7xl font-display font-bold mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="gradient-text">DeFi Lending</span>
              <br />
              <span className="text-foreground">Reimagined</span>
            </motion.h1>

            <motion.p
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Lend, borrow, and earn with the most secure and efficient DeFi protocol. 
              Built for the future of decentralized finance.
            </motion.p>

            {!wallet.isConnected ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Button
                  onClick={handleConnect}
                  className="action-button text-lg px-10 py-6 text-primary-foreground"
                  size="lg"
                >
                  <span className="flex items-center gap-3">
                    <Wallet className="w-5 h-5" />
                    Connect Wallet to Start
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                className="max-w-md mx-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <LiquidatorSection walletAddress={wallet.address!} />
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold gradient-text mb-4">
              Why Choose DeFi Lend?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of decentralized finance
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setActiveFeature(feature.id)}
              >
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6">
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Market Overview */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold gradient-text mb-4">
              Live Market Data
            </h2>
            <p className="text-muted-foreground">Real-time cryptocurrency prices</p>
          </motion.div>

          <div className="grid gap-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass-card p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted" />
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-24 mb-2" />
                      <div className="h-3 bg-muted rounded w-16" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              assets.slice(0, 5).map((asset, index) => (
                <motion.div
                  key={asset.id}
                  className="market-row flex items-center justify-between cursor-pointer"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedAsset(asset)}
                >
                  <div className="flex items-center gap-4">
                    <img src={asset.image} alt={asset.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <h4 className="font-semibold text-foreground">{asset.name}</h4>
                      <span className="text-sm text-muted-foreground uppercase">{asset.symbol}</span>
                    </div>
                  </div>

                  <div className="w-24 h-10">
                    <MiniChart 
                      data={asset.sparkline_in_7d?.price.slice(-24) || []} 
                      color={asset.price_change_percentage_24h >= 0 ? '#22c55e' : '#ef4444'}
                    />
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-foreground">${asset.current_price.toLocaleString()}</p>
                    <p className={`text-sm ${asset.price_change_percentage_24h >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {asset.price_change_percentage_24h >= 0 ? '+' : ''}{asset.price_change_percentage_24h.toFixed(2)}%
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Popups */}
      <FeaturePopup feature={activeFeature} onClose={() => setActiveFeature(null)} />
      <DetailedChartPopup asset={selectedAsset} onClose={() => setSelectedAsset(null)} />
    </div>
  );
};

export default HomePage;

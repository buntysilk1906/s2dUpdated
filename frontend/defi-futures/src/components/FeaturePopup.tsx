import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Zap, TrendingUp, Lock, Clock, Coins } from 'lucide-react';

interface FeaturePopupProps {
  feature: 'secure' | 'instant' | 'earn' | null;
  onClose: () => void;
}

const featureData = {
  secure: {
    title: 'Secure & Safe',
    icon: Shield,
    color: 'from-green-400 to-emerald-600',
    description: 'Your assets are protected by industry-leading security measures',
    perks: [
      { icon: Lock, title: 'Smart Contract Audited', description: 'Our contracts are audited by leading security firms' },
      { icon: Shield, title: 'Multi-Sig Wallets', description: 'Treasury protected by multi-signature security' },
      { icon: Coins, title: 'Insurance Fund', description: 'Built-in insurance pool for added protection' },
    ],
  },
  instant: {
    title: 'Instant Access',
    icon: Zap,
    color: 'from-yellow-400 to-orange-500',
    description: 'Lightning-fast transactions with no waiting periods',
    perks: [
      { icon: Zap, title: 'Instant Deposits', description: 'Your funds are available immediately' },
      { icon: Clock, title: 'No Lock-up Period', description: 'Withdraw your assets anytime you want' },
      { icon: TrendingUp, title: 'Real-time Updates', description: 'Live market data and position updates' },
    ],
  },
  earn: {
    title: 'Earn Interest',
    icon: TrendingUp,
    color: 'from-primary to-secondary',
    description: 'Put your crypto to work and earn passive income',
    perks: [
      { icon: Coins, title: 'Competitive APY', description: 'Earn up to 12% APY on your deposits' },
      { icon: TrendingUp, title: 'Compound Interest', description: 'Your earnings automatically compound' },
      { icon: Zap, title: 'No Minimum', description: 'Start earning with any amount' },
    ],
  },
};

const FeaturePopup: React.FC<FeaturePopupProps> = ({ feature, onClose }) => {
  if (!feature) return null;

  const data = featureData[feature];
  const IconComponent = data.icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="glass-card max-w-lg w-full p-8 relative glow-border"
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

          <div className="text-center mb-8">
            <motion.div
              className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${data.color} flex items-center justify-center mb-4`}
              animate={{ 
                boxShadow: ['0 0 20px rgba(0,240,255,0.3)', '0 0 40px rgba(0,240,255,0.5)', '0 0 20px rgba(0,240,255,0.3)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <IconComponent className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-display font-bold gradient-text mb-2">
              {data.title}
            </h2>
            <p className="text-muted-foreground">{data.description}</p>
          </div>

          <div className="space-y-4">
            {data.perks.map((perk, index) => (
              <motion.div
                key={perk.title}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="p-2 rounded-lg bg-primary/20">
                  <perk.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground">{perk.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeaturePopup;

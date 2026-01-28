import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLoan } from '@/hooks/useLoan';

interface LiquidatorSectionProps {
  walletAddress: string;
}

const LiquidatorSection: React.FC<LiquidatorSectionProps> = ({ walletAddress }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetAddress, setTargetAddress] = useState('');
  const { toast } = useToast();

  const { liquidate, loading } = useLoan();

  const handleLiquidate = async () => {
    if (!targetAddress) {
      toast({
        title: "Missing Information",
        description: "Please enter a target address",
        variant: "destructive",
      });
      return;
    }

    try {
      await liquidate(targetAddress);

      toast({
        title: "Liquidation Successful",
        description: `User ${targetAddress.slice(0, 10)} liquidated`,
      });

      setIsOpen(false);
      setTargetAddress('');
    } catch (err) {
      toast({
        title: "Liquidation Failed",
        description: "User may be healthy or transaction reverted",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <motion.button
        className="glass-card p-4 w-full text-left hover:border-warning/50 transition-all cursor-pointer"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-warning/20">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-warning">LIQUIDATOR</h3>
            <p className="text-sm text-muted-foreground">
              Liquidate undercollateralized positions
            </p>
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="glass-card max-w-lg w-full p-8 relative"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-warning/20 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-warning" />
                </div>
                <h2 className="text-2xl font-display font-bold text-warning mb-2">
                  Liquidator Portal
                </h2>
                <p className="text-muted-foreground text-sm">
                  Liquidate undercollateralized positions and earn rewards
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Target Address
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="0x..."
                      value={targetAddress}
                      onChange={(e) => setTargetAddress(e.target.value)}
                      className="pl-10 bg-muted/50 border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="glass-card p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Your Wallet</p>
                  <p className="font-mono text-primary text-sm break-all">
                    {walletAddress}
                  </p>
                </div>

                <Button
                  onClick={handleLiquidate}
                  disabled={loading}
                  className="action-button w-full text-primary-foreground"
                  size="lg"
                >
                  <span>
                    {loading ? "Processing..." : "Execute Liquidation"}
                  </span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LiquidatorSection;

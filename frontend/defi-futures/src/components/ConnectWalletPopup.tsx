import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, X } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ConnectWalletPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectWalletPopup: React.FC<ConnectWalletPopupProps> = ({ isOpen, onClose }) => {
  const { connectWallet } = useWallet();
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-card max-w-md w-full p-8 text-center relative glow-border"
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

            <motion.div
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-6"
              animate={{ 
                boxShadow: ['0 0 20px rgba(0,240,255,0.3)', '0 0 40px rgba(0,240,255,0.5)', '0 0 20px rgba(0,240,255,0.3)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wallet className="w-12 h-12 text-primary-foreground" />
            </motion.div>

            <h2 className="text-2xl font-display font-bold gradient-text mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-muted-foreground mb-8">
              Please connect your wallet to access the dashboard and start lending or borrowing.
            </p>

            <Button
              onClick={handleConnect}
              className="action-button w-full text-primary-foreground"
              size="lg"
            >
              <span className="flex items-center justify-center gap-2">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                  alt="MetaMask" 
                  className="w-6 h-6"
                />
                Connect with MetaMask
              </span>
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectWalletPopup;

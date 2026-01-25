import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDown, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import PieChart from './PieChart';

interface DepositPopupProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'eth' | 'fusd';
}

const DepositPopup: React.FC<DepositPopupProps> = ({ isOpen, onClose, type }) => {
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'borrow' | 'collateral' | 'lend' | 'collect'>('borrow');
  const { toast } = useToast();

  const isEth = type === 'eth';
  const actions = isEth 
    ? [{ id: 'borrow', label: 'Borrow' }, { id: 'collateral', label: 'Collect Collateral' }]
    : [{ id: 'lend', label: 'Lend' }, { id: 'collect', label: 'Collect FUSD' }];

  const totalMinted = 45000;
  const userMinted = isEth ? 12500 : 8500;
  const percentage = Math.round((userMinted / totalMinted) * 100);

  const handleSubmit = () => {
    if (!amount) {
      toast({
        title: "Amount Required",
        description: "Please enter an amount",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Transaction Submitted",
      description: `${action === 'borrow' ? 'Borrowing' : action === 'lend' ? 'Lending' : 'Collecting'} ${amount} ${isEth ? 'ETH' : 'FUSD'}`,
    });
    onClose();
    setAmount('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-card max-w-2xl w-full p-8 relative glow-border"
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
              <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${isEth ? 'from-blue-400 to-purple-600' : 'from-green-400 to-emerald-600'} flex items-center justify-center mb-4`}>
                {isEth ? (
                  <span className="text-3xl">Ξ</span>
                ) : (
                  <Coins className="w-10 h-10 text-white" />
                )}
              </div>
              <h2 className="text-3xl font-display font-bold gradient-text mb-2">
                {isEth ? 'Deposit ETH' : 'Lend FUSD'}
              </h2>
              <p className="text-muted-foreground">
                {isEth ? 'Deposit ETH as collateral or borrow against it' : 'Lend FUSD to earn interest or collect rewards'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Action Section */}
              <div>
                <div className="flex gap-2 mb-6">
                  {actions.map((a) => (
                    <motion.button
                      key={a.id}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                        action === a.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      onClick={() => setAction(a.id as typeof action)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {a.label}
                    </motion.button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Amount
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-xl py-6 bg-muted/50 border-primary/20 focus:border-primary"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        {isEth ? 'ETH' : 'FUSD'}
                      </span>
                    </div>
                  </div>

                  <div className="glass-card p-4 bg-muted/30">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Gas Fee (estimated)</span>
                      <span className="text-foreground">~0.002 ETH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">APY</span>
                      <span className="text-success font-medium">
                        {action === 'borrow' ? '5.2%' : action === 'lend' ? '8.5%' : '0%'}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    className="action-button w-full text-primary-foreground"
                    size="lg"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ArrowDown className="w-5 h-5" />
                      {action === 'borrow' ? 'Borrow' : action === 'lend' ? 'Lend' : 'Collect'}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Pie Chart Section */}
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Token Distribution
                </h3>
                <div className="relative">
                  <PieChart 
                    percentage={percentage} 
                    label="Your Share" 
                    size={180}
                  />
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">Total Tokens Minted</p>
                  <p className="text-2xl font-bold gradient-text">
                    {totalMinted.toLocaleString()} {isEth ? 'wETH' : 'FUSD'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DepositPopup;

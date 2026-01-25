import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, HelpCircle, Settings, Wallet, LogOut } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const { toast } = useToast();

  const navItems = [
    { id: 'home', label: 'Home', icon: null },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'markets', label: 'Markets', icon: TrendingUp },
    { id: 'helpdesk', label: 'Helpdesk', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to MetaMask",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-primary/20 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('home')}
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">Đ</span>
            </div>
            <span className="text-xl font-display font-bold gradient-text">DeFi Lend</span>
          </motion.div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                className={`nav-link flex items-center gap-2 ${
                  currentPage === item.id ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => onNavigate(item.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </motion.button>
            ))}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center gap-3">
            {wallet.isConnected ? (
              <div className="flex items-center gap-3">
                <div className="glass-card px-4 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-mono text-primary">
                    {formatAddress(wallet.address!)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({wallet.balance} ETH)
                  </span>
                </div>
                <motion.button
                  className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                  onClick={disconnectWallet}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              <Button
                onClick={handleConnect}
                className="action-button text-primary-foreground"
              >
                <span className="flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

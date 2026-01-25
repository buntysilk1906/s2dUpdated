import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Shield, Palette, Globe, Wallet, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useWallet } from '@/context/WalletContext';

const SettingsPage: React.FC = () => {
  const { wallet } = useWallet();
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoConnect, setAutoConnect] = useState(false);

  const settingsSections = [
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        { label: 'Push Notifications', description: 'Receive alerts for transactions', value: notifications, onChange: setNotifications },
        { label: 'Sound Effects', description: 'Play sounds for important events', value: soundEffects, onChange: setSoundEffects },
      ],
    },
    {
      title: 'Appearance',
      icon: Palette,
      settings: [
        { label: 'Dark Mode', description: 'Use dark theme', value: darkMode, onChange: setDarkMode },
      ],
    },
    {
      title: 'Wallet',
      icon: Wallet,
      settings: [
        { label: 'Auto Connect', description: 'Automatically connect wallet on load', value: autoConnect, onChange: setAutoConnect },
      ],
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Settings className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold gradient-text">
                Settings
              </h1>
              <p className="text-muted-foreground">
                Customize your DeFi experience
              </p>
            </div>
          </div>
        </motion.div>

        {/* Wallet Info */}
        {wallet.isConnected && (
          <motion.div
            className="glass-card p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Connected Wallet
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Address</p>
                <p className="font-mono text-primary break-all">{wallet.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Balance</p>
                <p className="font-bold text-foreground">{wallet.balance} ETH</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            className="glass-card p-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + sectionIndex * 0.1 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <section.icon className="w-5 h-5 text-primary" />
              {section.title}
            </h3>
            <div className="space-y-6">
              {section.settings.map((setting, index) => (
                <div key={setting.label} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{setting.label}</p>
                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                  </div>
                  <Switch
                    checked={setting.value}
                    onCheckedChange={setting.onChange}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Security Section */}
        <motion.div
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Transaction Signing</p>
                <p className="text-sm text-muted-foreground">Always confirm transactions in wallet</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-success" />
            </div>
            <div className="p-4 rounded-xl bg-muted/30 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Smart Contract Audit</p>
                <p className="text-sm text-muted-foreground">Contracts verified by CertiK</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-success" />
            </div>
          </div>
        </motion.div>

        {/* Network Info */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Network
          </h3>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-xl">Ξ</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Ethereum Mainnet</p>
                <p className="text-sm text-muted-foreground">Chain ID: 1</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-success">Connected</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, HelpCircle, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/types/defi';

const predefinedAnswers: Record<string, string> = {
  'how to borrow': 'To borrow, first connect your wallet and deposit collateral (ETH). Then go to Dashboard, click "DEPOSIT ETH", select "Borrow" and enter the amount of FUSD you want to borrow. Make sure to maintain a healthy collateral ratio!',
  'how to lend': 'To lend FUSD, go to Dashboard and click "LEND FUSD". Enter the amount you wish to lend and confirm the transaction. You\'ll earn competitive APY on your deposits!',
  'what is collateral': 'Collateral is the asset you deposit (like ETH) that secures your loan. If the value of your collateral falls below a certain threshold compared to your borrowed amount, your position may be liquidated.',
  'what is health factor': 'Health Factor is a safety metric showing how close your position is to liquidation. A value above 1.5 is considered safe. Below 1, your position can be liquidated.',
  'what is liquidation': 'Liquidation occurs when your Health Factor drops below 1. This means your collateral is sold to repay your debt. To avoid this, maintain a healthy collateral ratio.',
  'apy': 'APY (Annual Percentage Yield) is the rate of return you earn on deposits or pay on borrows, including compound interest. Our lending APY is currently around 8.5%.',
  'fees': 'We charge minimal fees: 0.1% on borrows and no fees on deposits or withdrawals. Gas fees for blockchain transactions apply separately.',
  'metamask': 'To connect MetaMask, click "Connect Wallet" in the navbar. Make sure you have MetaMask installed and are on the correct network.',
  'fusd': 'FUSD is our platform\'s stablecoin, pegged to the US Dollar. You can borrow FUSD against your ETH collateral or lend it to earn interest.',
};

const HelpdeskPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your DeFi assistant. I can help you with questions about lending, borrowing, collateral, and more. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findAnswer = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    for (const [keyword, answer] of Object.entries(predefinedAnswers)) {
      if (lowerQuery.includes(keyword)) {
        return answer;
      }
    }
    
    return "I'm not able to find an answer to that question right now. Our team will contact you shortly to help with your inquiry. In the meantime, feel free to ask about borrowing, lending, collateral, or other DeFi topics!";
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const answer = findAnswer(input);
    
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: answer,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const quickQuestions = [
    'How to borrow?',
    'What is Health Factor?',
    'What is collateral?',
    'How to lend?',
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
            <HelpCircle className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-display font-bold gradient-text mb-2">
            AI Helpdesk
          </h1>
          <p className="text-muted-foreground">
            Ask me anything about DeFi lending and borrowing
          </p>
        </motion.div>

        {/* Quick Questions */}
        <motion.div
          className="flex flex-wrap gap-2 justify-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {quickQuestions.map((q) => (
            <motion.button
              key={q}
              className="glass-button px-4 py-2 rounded-full text-sm text-foreground"
              onClick={() => {
                setInput(q);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {q}
            </motion.button>
          ))}
        </motion.div>

        {/* Chat Container */}
        <motion.div
          className="glass-card h-[500px] flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  className="flex gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-muted p-4 rounded-2xl rounded-bl-none">
                    <div className="flex gap-1">
                      <motion.span
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                      />
                      <motion.span
                        className="w-2 h-2 bg-muted-foreground rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-3"
            >
              <div className="relative flex-1">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ask a question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="pl-10 bg-muted/50 border-primary/20 focus:border-primary"
                />
              </div>
              <Button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="action-button text-primary-foreground"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                </span>
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpdeskPage;

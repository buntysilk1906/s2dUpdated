import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeScreenProps {
  onComplete: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 1800),
      setTimeout(() => setPhase(3), 2800),
      setTimeout(() => setPhase(4), 3800),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleClick = () => {
    if (phase >= 2) onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-background flex items-center justify-center cursor-pointer overflow-hidden z-50"
      onClick={handleClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-pattern bg-[size:60px_60px] opacity-20" />
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-[100px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/20 blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 text-center">
        <AnimatePresence mode="wait">
          {phase === 0 && (
            <motion.h1
              key="welcome"
              className="text-7xl md:text-9xl font-display font-bold text-primary glow-text"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ 
                x: '-30vw', 
                scale: 0.6,
                transition: { duration: 0.8, ease: 'easeInOut' }
              }}
              transition={{ duration: 0.6 }}
            >
              WELCOME
            </motion.h1>
          )}

          {phase >= 1 && phase < 4 && (
            <motion.div
              key="full-text"
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.span
                  className="text-5xl md:text-7xl font-display font-bold text-primary glow-text"
                  initial={{ x: 0 }}
                  animate={{ x: phase >= 1 ? -20 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  WELCOME
                </motion.span>
                
                <AnimatePresence>
                  {phase >= 1 && (
                    <motion.span
                      className="text-5xl md:text-7xl font-display font-bold gradient-text"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      to DeFi
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              <AnimatePresence>
                {phase >= 2 && (
                  <motion.p
                    className="text-2xl md:text-4xl text-muted-foreground font-light"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    The Future of Finance
                  </motion.p>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {phase >= 3 && (
                  <motion.p
                    className="text-lg text-muted-foreground/60 mt-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Click anywhere to continue
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/50 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </motion.div>
  );
};

export default WelcomeScreen;

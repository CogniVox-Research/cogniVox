import { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Copy, Check, QrCode } from 'lucide-react';

type WaitingState = {
  state: 'waiting_join';
  session_id: string;
};

const WaitingPage = ({ state }: { state: WaitingState }) => {
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopySessionId = async () => {
    await navigator.clipboard.writeText(state.session_id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const pulseVariants: Variants = {
    initial: { scale: 1, opacity: 0.6 },
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.6, 1, 0.6],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const dotVariants: Variants = {
    animate: {
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full opacity-20 blur-3xl"
          animate={{
            y: [0, 30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-muted/50 rounded-full opacity-20 blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 w-full max-w-md text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated Loader */}
        <motion.div className="mb-12 flex justify-center" variants={itemVariants}>
          <div className="relative w-32 h-32">
            {/* Outer rotating ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary"
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />

            {/* Middle pulsing ring */}
            <motion.div
              className="absolute inset-2 rounded-full border-2 border-primary/30"
              variants={pulseVariants}
              initial="initial"
              animate="animate"
            />

            {/* Inner content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(0, 0, 0, 0.1)',
                    '0 0 0 10px rgba(0, 0, 0, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              >
                <span className="text-2xl">🎤</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-4xl font-bold text-foreground mb-3 tracking-tight"
          variants={itemVariants}
          style={{ fontFamily: "'Geist Mono', monospace" }}
        >
          Ready to{' '}
          <span className="text-primary">
            Analyze
          </span>
        </motion.h1>

        {/* Subheading with animated dots */}
        <motion.div className="flex items-center justify-center gap-2 mb-8" variants={itemVariants}>
          <p className="text-lg text-muted-foreground font-medium">Waiting for device</p>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                variants={dotVariants}
                animate="animate"
                transition={{ delay: i * 0.3 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Description */}
        <motion.p
          className="text-muted-foreground text-base mb-10 leading-relaxed"
          variants={itemVariants}
        >
          Connect your device using the session QR code or manually join with your session ID
        </motion.p>

        {/* Action Buttons */}
        <motion.div className="flex flex-col gap-3 mb-10" variants={itemVariants}>
          {/* QR Code Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => setIsQRModalOpen(true)}
              className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold py-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Join with QR Code
            </Button>
          </motion.div>

          {/* Session ID Section */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Session ID</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-sm font-bold text-foreground break-all">
                {state.session_id}
              </code>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopySessionId}
                className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                title="Copy session ID"
              >
                <AnimatePresence mode="wait">
                  {isCopied ? (
                    <motion.div
                      key="check"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Check className="w-5 h-5 text-green-600" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="copy"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Copy className="w-5 h-5 text-foreground/80" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Connection Status Indicator */}
        <motion.div
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          variants={itemVariants}
        >
          <motion.span
            className="w-2 h-2 rounded-full bg-amber-500"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          Listening for device connection
        </motion.div>
      </motion.div>

      {/* QR Code Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl text-foreground">
                Join Session
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Scan this QR code with your device to join the session
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-6 py-6">
              {/* QR Code Container */}
              <motion.div
                className="p-4 bg-card border-2 border-border rounded-lg shadow-lg"
                whileHover={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                transition={{ duration: 0.3 }}
              >
                <QRCodeSVG
                  value={state.session_id}
                  size={280}
                  level="H"
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="#ffffff"
                />
              </motion.div>

              {/* Session ID Display in Modal */}
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                  Session ID
                </p>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                  <code className="flex-1 font-mono text-sm font-bold text-foreground break-all">
                    {state.session_id}
                  </code>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopySessionId}
                    className="p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors shrink-0"
                    title="Copy session ID"
                  >
                    <AnimatePresence mode="wait">
                      {isCopied ? (
                        <motion.div
                          key="check"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check className="w-5 h-5 text-green-600" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Copy className="w-5 h-5 text-foreground/80" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>

              {/* Close Button */}
              <motion.div className="w-full" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={() => setIsQRModalOpen(false)}
                  className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold py-2 rounded-lg"
                >
                  Done
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaitingPage;
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, Mic, BarChart, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30 font-sans">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-chart-1/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Navbar */}
        <header className="px-6 lg:px-12 py-6 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            {/* Using invert so the white logo appears dark in light mode, but stays white in dark mode */}
            <img src="/logo-white.png" alt="CogniVox Logo" className="h-10 w-auto invert dark:invert-0 drop-shadow-sm" />
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">CogniVox</span>
          </motion.div>
          <motion.nav 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link 
              to="/auth/login" 
              className="text-sm font-medium hover:text-primary transition-colors px-4 py-2"
            >
              Sign In
            </Link>
          </motion.nav>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center pt-12 pb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-4xl mx-auto space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 ring-1 ring-primary/20 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Real-Time Physiological Monitoring
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter text-balance text-foreground">
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-chart-1 drop-shadow-sm">Presentation Anxiety</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
              CogniVox seamlessly integrates wearable biometric data to analyze, monitor, and help you overcome presentation stress in real-time.
            </p>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block pt-6"
            >
              <Link 
                to="/auth/login" 
                className="group flex items-center gap-2 px-8 py-4 font-semibold text-primary-foreground transition-all duration-300 bg-primary border border-transparent rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-xl shadow-primary/25"
              >
                Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>
        </main>

        {/* Features / How It Works */}
        <section className="py-24 bg-card/40 border-y border-border/50 relative backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">How CogniVox Works</h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                A seamless flow from tracking biometrics to receiving actionable insights.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Activity,
                  title: "1. Connect Wearable",
                  description: "Sync your Galaxy Watch or compatible WearOS device to stream real-time physiological data.",
                  delay: 0.1
                },
                {
                  icon: Mic,
                  title: "2. Start Session",
                  description: "Upload your presentation document and begin your speech. CogniVox tracks your performance.",
                  delay: 0.2
                },
                {
                  icon: BarChart,
                  title: "3. Analyze Stress",
                  description: "Receive AI-driven feedback correlating your heart rate and biometric stress levels to your presentation.",
                  delay: 0.3
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: feature.delay }}
                  className="p-8 rounded-[2rem] bg-background border border-border shadow-lg shadow-black/5 hover:border-primary/40 hover:shadow-primary/5 transition-all duration-500 group"
                >
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-3 transition-all duration-300">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-balance">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-sm text-muted-foreground relative z-10 bg-background/50 backdrop-blur-sm">
          <p>© {new Date().getFullYear()} CogniVox Research Team. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
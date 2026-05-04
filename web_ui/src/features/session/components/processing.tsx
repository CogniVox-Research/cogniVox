import { motion } from "framer-motion";
import { Cpu, Sparkles } from "lucide-react";

const ProcessingPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden">
      <div className="relative w-full max-w-3xl rounded-3xl border border-border bg-card/90 p-10 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-50 via-transparent to-primary/5" />
        <div className="relative z-10 grid gap-10">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-sky-100 text-sky-600 shadow-sm shadow-sky-200/60">
              <Cpu className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-semibold text-slate-900">
              Processing your results
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Analyzing your session data so you can review insights, transcript
              accuracy, and performance metrics.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Scoring delivery
                </p>
                <p className="text-sm text-slate-500">
                  Evaluating confidence, clarity, and pacing.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Reviewing analytics
                </p>
                <p className="text-sm text-slate-500">
                  Checking biometric and behavior signals for a complete
                  picture.
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-2xl rounded-3xl bg-slate-50/90 p-6 shadow-inner shadow-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Processing progress
                </p>
                <p className="text-sm text-slate-500">
                  This usually takes less than a minute.
                </p>
              </div>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
                Running
              </span>
            </div>
            <div className="mt-5 rounded-full bg-slate-200 h-3 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500"
                initial={{ width: "8%" }}
                animate={{ width: ["8%", "90%", "75%", "95%"] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingPage;

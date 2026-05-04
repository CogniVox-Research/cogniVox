import { motion } from "framer-motion";
import { Loader2, Settings2, Sparkles } from "lucide-react";

const PrepairPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden">
      <div className="relative w-full max-w-3xl rounded-3xl border border-border bg-card/90 p-10 shadow-2xl shadow-slate-900/5 backdrop-blur-xl">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-slate-50/0" />
        <div className="relative z-10 grid gap-10">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm shadow-primary/20">
              <Settings2 className="h-10 w-10" />
            </div>
            <h1 className="text-4xl font-semibold text-slate-900">Preparing your session</h1>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Getting everything ready for your interview experience.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Connecting audio and camera",
              "Loading interview flow",
              "Syncing analytics and sensors",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-white/90 p-5 text-sm text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>

          <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
            <motion.div
              className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/20 bg-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-12 w-12 text-primary" />
            </motion.div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-900">One moment…</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your session is finalizing. It should be ready in just a few seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrepairPage;

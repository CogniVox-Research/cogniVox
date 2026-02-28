import { useState } from "react";
import { OptionsForm } from "../components/OptionsForm";
import type { OptionsConfig } from "../types";

const DEFAULT_CONFIG: OptionsConfig = {
  environment: "stage",
  difficulty: "medium",
  audienceSize: 1,
  distractionsEnabled: false,
  qaEnabled: true,
};

export function OptionsPage() {
  const [config, setConfig] = useState<OptionsConfig>(DEFAULT_CONFIG);

  const handleStart = () => {
    // TODO: persist config and navigate to the VR session
    console.log("Starting session with config:", config);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar — branding only, no button */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-lg font-bold text-foreground">CogniVox</h1>
          <p className="text-xs text-muted-foreground">
            VR public speaking platform
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Session Options
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure your environment and preferences before entering the VR
            session.
          </p>
        </div>

        {/* Single fieldset wrapping all sections + CTA */}
        <fieldset className="space-y-10 rounded-xl border border-border p-1">
          <legend className="sr-only">Session configuration</legend>

          <div className="px-5 pt-5">
            <OptionsForm config={config} onChange={setConfig} />
          </div>

          {/* Start Session at the bottom of the fieldset */}
          <div className="flex justify-end border-t border-border px-5 py-5">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                />
              </svg>
              Start Session
            </button>
          </div>
        </fieldset>
      </main>
    </div>
  );
}

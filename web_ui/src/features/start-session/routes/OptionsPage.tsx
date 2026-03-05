import { useNavigate } from "@tanstack/react-router";
import { StepIndicator } from "../components/StepIndicator";
import { useSessionSetup } from "../context/SessionSetupContext";
import SceneSelect from "../components/scene-select";
import type { Environment } from "../types";

export function OptionsPage() {
  const navigate = useNavigate();
  const { config, setConfig } = useSessionSetup();

  const handleNext = () => {
    if (config.environment === "interview") {
      navigate({ to: "/app/session/document" });
    } else {
      navigate({ to: "/app/session/options" });
    }
  };

  const setEnv = (env: Environment) => setConfig({ ...config, environment: env });

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <StepIndicator current={1} />

        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Environment Selection
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the virtual environment for your session.
          </p>
        </div>

        <fieldset className="space-y-10 rounded-xl border border-border p-1">
          <legend className="sr-only">Session Options</legend>

          <div className="px-5 pt-5">
            <SceneSelect scene={config.environment} setScene={setEnv} />
          </div>

          <div className="flex justify-end border-t border-border px-5 py-5">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Next
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </fieldset>
      </main>
    </>
  );
}

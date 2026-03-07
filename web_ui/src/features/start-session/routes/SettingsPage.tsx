import { useNavigate } from "@tanstack/react-router";
import { useSessionSetup } from "../context/SessionSetupContext";
import { StepIndicator } from "../components/StepIndicator";
import type { Environment, Difficulty } from "../types";
import DifficultySelector from "../components/difficulty-selector";
import SizeSelector from "../components/size-selector";
import ToggleOption from "../components/toggle-option";

function maxSizeFor(env: Environment) {
  switch (env) {
    case "board_room":
      return 8;
    case "stage":
      return 24;
    case "interview":
      return 1;
  }
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { config, setConfig } = useSessionSetup();

  const setDifficulty = (v: Difficulty) =>
    setConfig({ ...config, difficulty: v });
  const setDistractions = (v: boolean) =>
    setConfig({ ...config, distractions: v });
  const setQA = (v: boolean) => setConfig({ ...config, qaEnabled: v });
  const setSize = (v: number) => setConfig({ ...config, audienceSize: v });

  const handleNext = () => {
    navigate({ to: "/app/session/new/document" });
  };

  const handleBack = () => {
    navigate({ to: "/app/session/new/start" });
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <StepIndicator current={2} />

      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Session Options
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure audience size, difficulty, and other session parameters.
        </p>
      </div>

      <fieldset className="space-y-10 rounded-xl border border-border p-1">
        <legend className="sr-only">Session options</legend>

        <div className="space-y-10 w-full px-5 pt-5">
          {/* Audience Size */}
          <SizeSelector
            onChange={setSize}
            value={config.audienceSize}
            min={1}
            max={maxSizeFor(config.environment)}
          />

          {/* Difficulty slider */}
          <DifficultySelector
            onChange={setDifficulty}
            value={config.difficulty}
          />

          <div className="h-px bg-border" />

          {/* Distractions toggle */}
          <ToggleOption
            title="Audience Distractions"
            value={config.distractions}
            onChange={setDistractions}
          >
            Simulate real-world interruptions: audience members whispering,
            phones ringing, someone coughing, or people walking in late —
            keeping you sharp and adaptable.
          </ToggleOption>

          <div className="h-px bg-border" />

          {/* Q&A toggle */}
          <ToggleOption
            title="Q&amp;A Session"
            value={config.qaEnabled}
            onChange={setQA}
          >
            Enable a moderated Q&amp;A round after your speech. Audience avatars
            will raise questions for you to respond to, simulating
            post-presentation interaction.
          </ToggleOption>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-between border-t border-border px-5 py-5 mt-10">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
            Back
          </button>
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      </fieldset>
    </main>
  );
}

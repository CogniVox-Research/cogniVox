import type { Environment, Difficulty, OptionsConfig } from "../types";
import DifficultySelector from "./difficulty-selector";
import SceneSelect from "./scene-select";
import SizeSelector from "./size-selector";

import ToggleOption from "./toggle-option";

type EnvironmentSelectorProps = {
  config: OptionsConfig;
  onChange: (config: OptionsConfig) => void;
};

export function OptionsForm({ config, onChange }: EnvironmentSelectorProps) {
  const setEnv = (env: Environment) =>
    onChange({ ...config, environment: env });
  const setDifficulty = (v: Difficulty) =>
    onChange({ ...config, difficulty: v });
  const setDistractions = (v: boolean) =>
    onChange({ ...config, distractionsEnabled: v });
  const setQA = (v: boolean) => onChange({ ...config, qaEnabled: v });
  const setSize = (v: number) => onChange({ ...config, audienceSize: v });

  return (
    <div className="space-y-10">
      {/* Environment selector */}
      <SceneSelect scene={config.environment} setScene={setEnv} />

      {/* Difficulty slider */}
      <SizeSelector
        onChange={setSize}
        value={config.audienceSize}
        min={1}
        max={10}
      />

      {/* Difficulty slider */}
      <DifficultySelector onChange={setDifficulty} value={config.difficulty} />

      <div className="h-px bg-border" />

      {/* Distractions toggle */}
      <ToggleOption
        title="Audience Distractions"
        value={config.distractionsEnabled}
        onChange={setDistractions}
      >
        Simulate real-world interruptions: audience members whispering, phones
        ringing, someone coughing, or people walking in late — keeping you sharp
        and adaptable.
      </ToggleOption>

      <div className="h-px bg-border" />

      {/* Q&A toggle */}
      <ToggleOption
        title="Q&amp;A Session"
        value={config.qaEnabled}
        onChange={setQA}
      >
        Enable a moderated Q&amp;A round after your speech. Audience avatars
        will raise questions for you to respond to, simulating post-presentation
        interaction.
      </ToggleOption>
    </div>
  );
}

import type { Difficulty } from "../types";

const DIFFICULTY_LEVELS: {
  value: Difficulty;
  label: string;
  color: string;
  description: string;
}[] = [
  {
    value: "easy",
    label: "Easy",
    color: "text-emerald-500",
    description: "Friendly audience, minimal pressure",
  },
  {
    value: "medium",
    label: "Medium",
    color: "text-amber-400",
    description: "Mixed reactions, moderate pressure",
  },
  {
    value: "hard",
    label: "Hard",
    color: "text-rose-500",
    description: "Critical audience, high-stakes environment",
  },
];

const DIFF_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

const DifficultySelector = ({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (_: Difficulty) => void;
}) => {
  const diffIndex = DIFF_INDEX[value];
  const setDifficulty = (d: Difficulty) => onChange(d);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor="difficulty-slider"
            className="text-sm font-medium text-foreground"
          >
            Difficulty Level
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {DIFFICULTY_LEVELS[diffIndex].description}
          </p>
        </div>
        <span
          className={`text-sm font-bold ${DIFFICULTY_LEVELS[diffIndex].color}`}
        >
          {DIFFICULTY_LEVELS[diffIndex].label}
        </span>
      </div>

      <div className="space-y-3">
        {/* Track */}
        <div className="relative flex items-center">
          {/* Background track */}
          <div className="absolute left-0 right-0 h-2 rounded-full bg-border" />
          {/* Filled track */}
          <div
            className="absolute left-0 h-2 rounded-full bg-primary transition-all duration-300"
            style={{ width: `${diffIndex * 50}%` }}
          />
          {/* Step dots + hit targets */}
          <div className="relative flex w-full justify-between">
            {DIFFICULTY_LEVELS.map((d, i) => {
              const active = i <= diffIndex;
              return (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className="group flex h-8 w-8 -translate-x-1/2 first:translate-x-0 last:translate-x-0 items-center justify-center focus-visible:outline-none"
                  aria-label={d.label}
                >
                  <span
                    className={`block h-4 w-4 rounded-full border-2 transition-all duration-200 group-hover:scale-110 ${
                      value === d.value
                        ? "border-primary bg-primary scale-125 shadow-md shadow-primary/30"
                        : active
                          ? "border-primary bg-primary"
                          : "border-border bg-background"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between">
          {DIFFICULTY_LEVELS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`text-xs font-medium transition-colors ${
                value === d.value
                  ? d.color
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default DifficultySelector;

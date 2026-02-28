import type { Environment } from "../types";
import BoardroomSVG from "./icons/boardroom";
import InterviewSVG from "./icons/interview";
import StageSVG from "./icons/stage";

type EnvCard = {
  id: Environment;
  label: string;
  tagline: string;
  audience: string;
  // CSS gradient + decorative elements rendered in JSX
  gradient: string;
  image: React.FC;
};

const ENV_CARDS: EnvCard[] = [
  {
    id: "stage",
    label: "Stage",
    tagline: "Grand theatre performance",
    audience: "Large audience · Strong lighting · High pressure",
    gradient: "from-violet-900 via-purple-800 to-indigo-900",
    image: StageSVG,
  },
  {
    id: "boardroom",
    label: "Boardroom",
    tagline: "Executive boardroom",
    audience: "Small executive group · Formal setting",
    gradient: "from-slate-800 via-slate-700 to-zinc-800",
    image: BoardroomSVG,
  },
  {
    id: "interview",
    label: "Interview",
    tagline: "One-on-one interview",
    audience: "Close range · Focused scrutiny",
    gradient: "from-sky-900 via-blue-800 to-cyan-900",
    image: InterviewSVG,
  },
];

const SceneSelect = (props: {
  scene: Environment;
  setScene: (_: Environment) => void;
}) => {
  return (
    <>
      <h2
        id="env-heading"
        className="mb-1 text-lg font-semibold text-foreground"
      >
        Choose Environment
      </h2>

      <p className="mb-5 text-sm text-muted-foreground">
        Select the virtual space where your speech will take place.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ENV_CARDS.map((card) => {
          const selected = props.scene === card.id;
          return (
            <button
              key={card.id}
              onClick={() => props.setScene(card.id)}
              className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                selected
                  ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:scale-[1.01]"
              }`}
            >
              {/* Illustration */}
              <div
                className={`relative h-36 w-full bg-gradient-to-br ${card.gradient} overflow-hidden`}
              >
                <div className="absolute inset-0">
                  <card.image />
                </div>
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-6">
                  <span className="text-base font-bold text-white">
                    {card.label}
                  </span>
                </div>
                {/* Selected checkmark */}
                {selected && (
                  <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow">
                    <svg
                      className="h-3.5 w-3.5 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="bg-card px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.tagline}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                  {card.audience}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default SceneSelect;

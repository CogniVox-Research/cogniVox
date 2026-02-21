import type { Environment, Difficulty, OptionsConfig } from '../types';

// ─── Environment card data ──────────────────────────────────────────────────

type EnvCard = {
    id: Environment;
    label: string;
    tagline: string;
    audience: string;
    // CSS gradient + decorative elements rendered in JSX
    gradient: string;
};

const ENV_CARDS: EnvCard[] = [
    {
        id: 'stage',
        label: 'Stage',
        tagline: 'Grand theatre performance',
        audience: 'Large audience · Strong lighting · High pressure',
        gradient: 'from-violet-900 via-purple-800 to-indigo-900',
    },
    {
        id: 'boardroom',
        label: 'Boardroom',
        tagline: 'Executive boardroom',
        audience: 'Small executive group · Formal setting',
        gradient: 'from-slate-800 via-slate-700 to-zinc-800',
    },
    {
        id: 'interview',
        label: 'Interview',
        tagline: 'One-on-one interview',
        audience: 'Panel of 2–4 · Close range · Focused scrutiny',
        gradient: 'from-sky-900 via-blue-800 to-cyan-900',
    },
];

// ─── SVG scene illustrations ─────────────────────────────────────────────────

function StageSVG() {
    return (
        <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
            {/* Curtains */}
            <rect x="0" y="0" width="38" height="120" fill="#4c1d95" opacity="0.9" />
            <rect x="162" y="0" width="38" height="120" fill="#4c1d95" opacity="0.9" />
            {/* Stage floor */}
            <rect x="0" y="88" width="200" height="32" fill="#1e1b4b" opacity="0.7" />
            {/* Floor boards */}
            {[0, 40, 80, 120, 160].map((x) => (
                <line key={x} x1={x} y1="88" x2={x} y2="120" stroke="#312e81" strokeWidth="1" />
            ))}
            {/* Spotlight beams */}
            <polygon points="45,0 75,0 65,88 35,88" fill="white" opacity="0.07" />
            <polygon points="90,0 120,0 115,88 85,88" fill="white" opacity="0.09" />
            <polygon points="135,0 165,0 165,88 135,88" fill="white" opacity="0.07" />
            {/* Spotlight circles top */}
            <ellipse cx="60" cy="6" rx="14" ry="6" fill="#fbbf24" opacity="0.9" />
            <ellipse cx="100" cy="4" rx="16" ry="7" fill="#fcd34d" opacity="0.95" />
            <ellipse cx="140" cy="6" rx="14" ry="6" fill="#fbbf24" opacity="0.9" />
            {/* Speaker silhouette */}
            <ellipse cx="100" cy="70" rx="8" ry="8" fill="#1e1b4b" />
            <rect x="95" y="78" width="10" height="18" rx="2" fill="#1e1b4b" />
            {/* Audience silhouettes */}
            {[20, 45, 70, 130, 155, 178].map((x) => (
                <g key={x}>
                    <ellipse cx={x} cy="108" rx="7" ry="7" fill="#312e81" opacity="0.7" />
                    <rect x={x - 5} y="113" width="10" height="8" rx="1" fill="#312e81" opacity="0.5" />
                </g>
            ))}
        </svg>
    );
}

function BoardroomSVG() {
    return (
        <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
            {/* Window background */}
            <rect x="0" y="0" width="200" height="75" fill="#1e293b" />
            {/* Window panes */}
            {[10, 55, 100, 145].map((x) => (
                <rect key={x} x={x} y="5" width="40" height="65" rx="2" fill="#0f172a" opacity="0.5" />
            ))}
            {/* City skyline */}
            <rect x="15" y="25" width="12" height="45" fill="#334155" />
            <rect x="30" y="15" width="10" height="55" fill="#1e293b" />
            <rect x="60" y="20" width="15" height="50" fill="#334155" />
            <rect x="78" y="10" width="8" height="60" fill="#1e293b" />
            <rect x="110" y="30" width="18" height="40" fill="#334155" />
            <rect x="150" y="18" width="12" height="52" fill="#1e293b" />
            <rect x="165" y="28" width="20" height="42" fill="#334155" />
            {/* Floor */}
            <rect x="0" y="75" width="200" height="45" fill="#0f172a" />
            {/* Boardroom table */}
            <ellipse cx="100" cy="95" rx="75" ry="22" fill="#292524" />
            <ellipse cx="100" cy="93" rx="75" ry="22" fill="#44403c" />
            {/* Chairs around table */}
            {[20, 50, 80, 120, 150, 178].map((x) => (
                <g key={x}>
                    <ellipse cx={x} cy="82" rx="8" ry="8" fill="#1c1917" />
                </g>
            ))}
            {/* Laptop on table */}
            <rect x="88" y="87" width="24" height="14" rx="2" fill="#1c1917" />
            <rect x="89" y="88" width="22" height="11" rx="1" fill="#0ea5e9" opacity="0.3" />
        </svg>
    );
}

function InterviewSVG() {
    return (
        <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
            {/* Background wall */}
            <rect x="0" y="0" width="200" height="120" fill="#0c1931" />
            {/* Corporate logo/frame on wall */}
            <rect x="70" y="8" width="60" height="40" rx="3" fill="#0f2040" />
            <rect x="73" y="11" width="54" height="34" rx="2" fill="#0c1931" />
            <text x="100" y="32" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">PANEL</text>
            {/* Table */}
            <rect x="0" y="78" width="200" height="42" fill="#0f172a" />
            <rect x="0" y="76" width="200" height="6" rx="2" fill="#1e3a5f" />
            {/* 3 interviewer silhouettes */}
            {[48, 100, 152].map((x) => (
                <g key={x}>
                    <ellipse cx={x} cy="64" rx="12" ry="12" fill="#1e3a5f" />
                    <rect x={x - 14} y="75" width="28" height="10" rx="2" fill="#1e3a5f" />
                    {/* Papers */}
                    <rect x={x - 10} y="82" width="20" height="14" rx="1" fill="#162235" />
                </g>
            ))}
            {/* Candidate side */}
            <ellipse cx="100" cy="110" rx="10" ry="10" fill="#0e3a5c" />
            {/* Water glasses */}
            {[45, 100, 155].map((x) => (
                <rect key={x} x={x - 3} y="80" width="6" height="10" rx="1" fill="#38bdf8" opacity="0.3" />
            ))}
            {/* Soft light effect */}
            <ellipse cx="100" cy="50" rx="80" ry="50" fill="#38bdf8" opacity="0.03" />
        </svg>
    );
}

const ENV_SVG: Record<Environment, React.FC> = {
    stage: StageSVG,
    boardroom: BoardroomSVG,
    interview: InterviewSVG,
};

// ─── Difficulty slider ────────────────────────────────────────────────────────

const DIFFICULTY_LEVELS: { value: Difficulty; label: string; color: string; description: string }[] = [
    { value: 'easy', label: 'Easy', color: 'text-emerald-500', description: 'Friendly audience, minimal pressure' },
    { value: 'medium', label: 'Medium', color: 'text-amber-400', description: 'Mixed reactions, moderate pressure' },
    { value: 'hard', label: 'Hard', color: 'text-rose-500', description: 'Critical audience, high-stakes environment' },
];

const DIFF_INDEX: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };

// ─── Toggle ───────────────────────────────────────────────────────────────────

type ToggleProps = { checked: boolean; onChange: (v: boolean) => void; id: string };

function Toggle({ checked, onChange, id }: ToggleProps) {
    return (
        <button
            id={id}
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${checked ? 'bg-primary' : 'bg-muted'
                }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
            />
        </button>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

type EnvironmentSelectorProps = {
    config: OptionsConfig;
    onChange: (config: OptionsConfig) => void;
};

export function OptionsForm({ config, onChange }: EnvironmentSelectorProps) {
    const diffIndex = DIFF_INDEX[config.difficulty];

    const setEnv = (env: Environment) => onChange({ ...config, environment: env });
    const setDifficulty = (d: Difficulty) => onChange({ ...config, difficulty: d });
    const setDistractions = (v: boolean) => onChange({ ...config, distractionsEnabled: v });
    const setQA = (v: boolean) => onChange({ ...config, qaEnabled: v });

    return (
        <div className="space-y-10">

            {/* ── Environment selector ─────────────────────────────────────── */}
            <section aria-labelledby="env-heading">
                <h2 id="env-heading" className="mb-1 text-lg font-semibold text-foreground">
                    Choose Environment
                </h2>
                <p className="mb-5 text-sm text-muted-foreground">
                    Select the virtual space where your speech will take place.
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {ENV_CARDS.map((card) => {
                        const SceneIllustration = ENV_SVG[card.id];
                        const selected = config.environment === card.id;
                        return (
                            <button
                                key={card.id}
                                onClick={() => setEnv(card.id)}
                                className={`group relative overflow-hidden rounded-xl border-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${selected
                                    ? 'border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                                    : 'border-border hover:border-primary/50 hover:scale-[1.01]'
                                    }`}
                            >
                                {/* Illustration */}
                                <div className={`relative h-36 w-full bg-gradient-to-br ${card.gradient} overflow-hidden`}>
                                    <div className="absolute inset-0">
                                        <SceneIllustration />
                                    </div>
                                    {/* Name overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-6">
                                        <span className="text-base font-bold text-white">{card.label}</span>
                                    </div>
                                    {/* Selected checkmark */}
                                    {selected && (
                                        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow">
                                            <svg className="h-3.5 w-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Text */}
                                <div className="bg-card px-4 py-3">
                                    <p className="text-xs font-medium text-muted-foreground">{card.tagline}</p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground/70">{card.audience}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── Configuration ────────────────────────────────────────────── */}
            <section aria-labelledby="config-heading" className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-8">
                <div>
                    <h2 id="config-heading" className="text-lg font-semibold text-foreground">Configuration</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">Fine-tune your session parameters.</p>
                </div>

                {/* Difficulty slider */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="difficulty-slider" className="text-sm font-medium text-foreground">
                                Difficulty Level
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {DIFFICULTY_LEVELS[diffIndex].description}
                            </p>
                        </div>
                        <span className={`text-sm font-bold ${DIFFICULTY_LEVELS[diffIndex].color}`}>
                            {DIFFICULTY_LEVELS[diffIndex].label}
                        </span>
                    </div>

                    {/* Custom discrete slider */}
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
                                                className={`block h-4 w-4 rounded-full border-2 transition-all duration-200 group-hover:scale-110 ${config.difficulty === d.value
                                                        ? 'border-primary bg-primary scale-125 shadow-md shadow-primary/30'
                                                        : active
                                                            ? 'border-primary bg-primary'
                                                            : 'border-border bg-background'
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
                                    className={`text-xs font-medium transition-colors ${config.difficulty === d.value
                                            ? d.color
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Distractions toggle */}
                <div className="flex items-start justify-between gap-6">
                    <div className="space-y-1 flex-1">
                        <label htmlFor="toggle-distractions" className="text-sm font-medium text-foreground cursor-pointer">
                            Audience Distractions
                        </label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Simulate real-world interruptions: audience members whispering, phones ringing,
                            someone coughing, or people walking in late — keeping you sharp and adaptable.
                        </p>
                    </div>
                    <div className="pt-0.5">
                        <Toggle id="toggle-distractions" checked={config.distractionsEnabled} onChange={setDistractions} />
                    </div>
                </div>

                <div className="h-px bg-border" />

                {/* Q&A toggle */}
                <div className="flex items-start justify-between gap-6">
                    <div className="space-y-1 flex-1">
                        <label htmlFor="toggle-qa" className="text-sm font-medium text-foreground cursor-pointer">
                            Q&amp;A Session
                        </label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Enable a moderated Q&amp;A round after your speech. Audience avatars will raise
                            questions for you to respond to, simulating post-presentation interaction.
                        </p>
                    </div>
                    <div className="pt-0.5">
                        <Toggle id="toggle-qa" checked={config.qaEnabled} onChange={setQA} />
                    </div>
                </div>
            </section>

        </div>
    );
}

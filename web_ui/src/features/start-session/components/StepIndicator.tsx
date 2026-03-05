type StepIndicatorProps = {
    current: 1 | 2 | 3;
};

const STEPS = [
    { n: 1, label: "Environment" },
    { n: 2, label: "Options" },
    { n: 3, label: "Document" },
];

export function StepIndicator({ current }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center gap-0 mb-8">
            {STEPS.map((step, i) => {
                const isDone = step.n < current;
                const isActive = step.n === current;
                return (
                    <div key={step.n} className="flex items-center">
                        {/* Circle */}
                        <div className="flex flex-col items-center gap-1.5">
                            <div
                                className={[
                                    "flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                                    isDone
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : isActive
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-background text-muted-foreground",
                                ].join(" ")}
                            >
                                {isDone ? (
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                ) : (
                                    step.n
                                )}
                            </div>
                            <span
                                className={[
                                    "text-xs font-medium",
                                    isActive ? "text-primary" : "text-muted-foreground",
                                ].join(" ")}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector */}
                        {i < STEPS.length - 1 && (
                            <div
                                className={[
                                    "mx-2 mb-4 h-px w-16 transition-all duration-500",
                                    step.n < current ? "bg-primary" : "bg-border",
                                ].join(" ")}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

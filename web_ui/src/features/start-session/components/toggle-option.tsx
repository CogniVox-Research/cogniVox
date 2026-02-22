import type { ReactNode } from "react";

const ToggleOption = (props: {
  title: string;
  value: boolean;
  onChange: (_: boolean) => void;
  children: ReactNode;
}) => {
  const ident = props.title.toLowerCase().replaceAll(" ", "-");

  return (
    <div className="flex items-start justify-between gap-6">
      <div className="space-y-1 flex-1">
        <label
          htmlFor={ident}
          className="text-sm font-medium text-foreground cursor-pointer"
        >
          {props.title}
        </label>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {props.children}
        </p>
      </div>
      <div className="pt-0.5">
        <button
          id={ident}
          role="switch"
          aria-checked={props.value}
          onClick={() => props.onChange(!props.value)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            props.value ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
              props.value ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default ToggleOption;

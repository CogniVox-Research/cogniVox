import { Slider } from "@/components/ui/slider";
import { useEffect } from "react";

const SizeSelector = ({
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (_: number) => void;
}) => {
  useEffect(() => {
    const c = Math.max(Math.min(max, value), min);
    if (c != value) {
      onChange(c);
    }
  }, [value, max, min, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor="difficulty-slider"
            className="text-sm font-medium text-foreground"
          >
            Audience Size
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select audience size
          </p>
        </div>
        <span className={`text-sm font-bold`}>{value}</span>
      </div>

      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        disabled={disabled}
        onValueChange={(e) => onChange(e[0])}
      ></Slider>
    </div>
  );
};
export default SizeSelector;

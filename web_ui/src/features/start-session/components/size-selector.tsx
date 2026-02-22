import { Slider } from "@/components/ui/slider";

const SizeSelector = (props: {
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (_: number) => void;
}) => {
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
        <span className={`text-sm font-bold`}>{props.value}</span>
      </div>

      <Slider
        value={[props.value]}
        min={props.min}
        max={props.max}
        step={1}
        disabled={props.disabled}
        onValueChange={(e) => props.onChange(e[0])}
      ></Slider>
    </div>
  );
};
export default SizeSelector;

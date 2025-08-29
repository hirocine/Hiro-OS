import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onValueChange: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  className?: string;
}

export function RangeSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onValueChange,
  formatValue,
  className
}: RangeSliderProps) {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSliderChange = (newValue: number[]) => {
    const rangeValue = [newValue[0], newValue[1]] as [number, number];
    setLocalValue(rangeValue);
    onValueChange(rangeValue);
  };

  const handleInputChange = (index: 0 | 1, inputValue: number) => {
    const numValue = inputValue || 0;
    const newValue = [...localValue] as [number, number];
    newValue[index] = Math.max(min, Math.min(max, numValue));
    setLocalValue(newValue);
    onValueChange(newValue);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label>{label}</Label>
      <div className="px-2">
        <Slider
          value={localValue}
          onValueChange={handleSliderChange}
          max={max}
          min={min}
          step={step}
          className="w-full"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Mínimo</Label>
          <Input
            type="number"
            value={localValue[0]}
            onChange={(e) => handleInputChange(0, parseInt(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="h-8"
            placeholder={formatValue ? formatValue(min) : min.toString()}
          />
          {formatValue && (
            <div className="text-xs text-muted-foreground mt-1">
              {formatValue(localValue[0])}
            </div>
          )}
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">Máximo</Label>
          <Input
            type="number"
            value={localValue[1]}
            onChange={(e) => handleInputChange(1, parseInt(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="h-8"
            placeholder={formatValue ? formatValue(max) : max.toString()}
          />
          {formatValue && (
            <div className="text-xs text-muted-foreground mt-1">
              {formatValue(localValue[1])}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import type { PiecewiseScale } from "../../engine/scale";
import { clamp } from "../../engine/validation";
import { DiagnosticSlider, EditableValue } from "./DiagnosticSlider";

interface QuestionSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  scale?: PiecewiseScale;
  formatValue: (value: number) => string;
  formatEdgeMin: string;
  formatEdgeMax: string;
  parseManual: (raw: string) => number;
  disabled?: boolean;
  inputMode?: "numeric" | "decimal";
}

/**
 * Uma pergunta = um controle. Combina o valor grande editável, o slider
 * (linear ou por escala não-linear) e os rótulos de extremidade — a única
 * peça que os componentes de step (1 a 6) precisam montar.
 */
export function QuestionSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  scale,
  formatValue,
  formatEdgeMin,
  formatEdgeMax,
  parseManual,
  disabled,
  inputMode = "numeric",
}: QuestionSliderProps) {
  const position = scale ? scale.toPosition(value) : value;
  const posMin = scale ? 0 : min;
  const posMax = scale ? scale.resolution : max;
  const posStep = scale ? 1 : step;

  function handlePositionChange(pos: number) {
    const rawValue = scale ? scale.toValue(pos) : pos;
    const rounded = Math.round(rawValue / step) * step;
    onChange(clamp(rounded, min, max));
  }

  function handleManualCommit(raw: string) {
    const parsed = parseManual(raw);
    onChange(clamp(parsed, min, max));
  }

  return (
    <div className="w-full">
      <EditableValue
        displayValue={formatValue(value)}
        rawValue={value}
        onCommit={handleManualCommit}
        inputMode={inputMode}
        className="font-display text-5xl font-semibold tabular-nums text-foreground sm:text-6xl"
      />
      <div className="mt-8">
        <DiagnosticSlider
          position={position}
          min={posMin}
          max={posMax}
          step={posStep}
          onPositionChange={handlePositionChange}
          disabled={disabled}
        />
        <div className="mt-2 flex justify-between text-xs font-medium text-muted-foreground">
          <span>{formatEdgeMin}</span>
          <span>{formatEdgeMax}</span>
        </div>
      </div>
    </div>
  );
}

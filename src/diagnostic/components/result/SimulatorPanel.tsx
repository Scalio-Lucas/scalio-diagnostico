import { cn } from "@/lib/utils";
import { SCENARIOS, SCENARIO_ORDER } from "../../config";
import { formatBRLAbbrev, formatDecimalValue, formatPercent } from "../../engine/format";
import { DiagnosticSlider } from "../ui/DiagnosticSlider";

interface SimulatorPanelProps {
  rate: number;
  min: number;
  max: number;
  onChange: (rate: number) => void;
  currentRate: number;
  visitsPotential: number;
  salesPotential: number;
  vgvPotential: number;
}

const RESOLUTION = 1000;

/** BLOCO 3 — compacto: uma linha de contexto, o slider e três números que respondem "e se?". */
export function SimulatorPanel({
  rate,
  min,
  max,
  onChange,
  currentRate,
  visitsPotential,
  salesPotential,
  vgvPotential,
}: SimulatorPanelProps) {
  const range = max - min || 1;
  const position = Math.round(((rate - min) / range) * RESOLUTION);

  function handlePosition(pos: number) {
    onChange(min + (pos / RESOLUTION) * range);
  }

  const activeScenario = SCENARIO_ORDER.find(
    (key) => Math.abs(SCENARIOS[key].leadToVisit - rate) < 0.003,
  );

  return (
    <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Veja o impacto de melhorar sua taxa de visita
      </p>

      <div className="mt-2 flex items-center justify-center gap-2 text-sm">
        <span className="text-muted-foreground">{formatPercent(min, 1)} atual</span>
        <span aria-hidden className="text-muted-foreground">
          →
        </span>
        <span className="rounded-full bg-[color:var(--electric)]/15 px-3 py-0.5 font-display text-base font-bold text-[color:var(--electric-bright)]">
          {formatPercent(rate, 1)}
        </span>
        <span className="text-muted-foreground">simulado</span>
      </div>

      <div className="mt-4">
        <DiagnosticSlider
          position={position}
          min={0}
          max={RESOLUTION}
          step={1}
          onPositionChange={handlePosition}
        />
        <div className="mt-1 flex justify-between text-[0.65rem] text-muted-foreground">
          <span>{formatPercent(min, 1)}</span>
          <span>{formatPercent(max, 1)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-black/15 p-3">
        <MiniStat label="Visitas" value={formatDecimalValue(visitsPotential)} />
        <MiniStat label="Vendas" value={formatDecimalValue(salesPotential)} />
        <MiniStat label="VGV" value={formatBRLAbbrev(vgvPotential)} />
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-center text-[0.6rem] uppercase tracking-wide text-muted-foreground">
          Cenários
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {SCENARIO_ORDER.map((key) => (
            <PillButton
              key={key}
              active={activeScenario === key}
              label={formatPercent(SCENARIOS[key].leadToVisit)}
              onClick={() => onChange(Math.max(currentRate, SCENARIOS[key].leadToVisit))}
            />
          ))}
          <PillButton active={!activeScenario} label="Personalizar" onClick={() => {}} />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-base font-bold tabular-nums text-foreground sm:text-lg">
        {value}
      </p>
      <p className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function PillButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-[color:var(--electric)] bg-[color:var(--electric)]/15 text-[color:var(--electric-bright)]"
          : "border-[color:var(--color-border)] text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

import { formatPercent, formatSignedBRLAbbrev } from "../../engine/format";
import { MiniBarCompare } from "./MiniBarCompare";

interface ComparisonConnectorProps {
  currentRate: number;
  projectedRate: number;
  opportunityVGV: number;
  hasOpportunity: boolean;
  currentVGV: number;
  potentialVGV: number;
}

/** Elemento entre os dois cards: a leitura "5,7% → 10% = +R$2,2M" de relance. */
export function ComparisonConnector({
  currentRate,
  projectedRate,
  opportunityVGV,
  hasOpportunity,
  currentVGV,
  potentialVGV,
}: ComparisonConnectorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-muted-foreground">{formatPercent(currentRate, 1)}</span>
        <span aria-hidden className="text-[color:var(--electric-bright)]">
          →
        </span>
        <span className="text-[color:var(--electric-bright)]">
          {formatPercent(projectedRate, 1)}
        </span>
      </div>

      {hasOpportunity ? (
        <div className="text-center">
          <p className="font-display text-xl font-bold tabular-nums text-[color:var(--electric-bright)] sm:text-2xl">
            {formatSignedBRLAbbrev(opportunityVGV)}
          </p>
          <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            VGV potencial
          </p>
        </div>
      ) : null}

      <div className="w-full max-w-[180px]">
        <MiniBarCompare current={currentVGV} potential={potentialVGV} />
      </div>
    </div>
  );
}

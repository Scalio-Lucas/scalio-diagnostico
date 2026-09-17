import { m } from "framer-motion";
import { formatBRLAbbrev, formatPercent } from "../../engine/format";
import type { CurrentMetrics, Diagnostic, ProjectedMetrics } from "../../engine/types";
import { useCountUp } from "./useCountUp";

/** BLOCO 1 — primeira dobra enxuta: só o resultado, sem métricas secundárias. */
export function DiagnosisHero({
  diagnostic,
  current,
  projected,
}: {
  diagnostic: Diagnostic;
  current: CurrentMetrics;
  projected: ProjectedMetrics;
}) {
  const hasOpportunity = projected.hasProjectableSales && projected.opportunityVGV > 0;
  const animated = useCountUp(hasOpportunity ? projected.opportunityVGV : 0, 1100);

  return (
    <m.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-xl px-5 pt-8 text-center sm:pt-12"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--electric-bright)]">
        Seu diagnóstico
      </p>

      {hasOpportunity ? (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            Com os números informados, existe uma oportunidade estimada de:
          </p>
          <p className="mt-2 font-display text-5xl font-bold tabular-nums text-foreground sm:text-6xl">
            +{formatBRLAbbrev(animated)}
          </p>
          <p className="text-sm font-medium text-muted-foreground">em VGV potencial por mês</p>
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
            Sem aumentar sua quantidade atual de leads.
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground/80">
            Sua taxa de Lead → Visita hoje é {formatPercent(current.leadToVisit, 1)}. Neste cenário,
            simulamos {formatPercent(projected.leadToVisitProjected, 1)}.
          </p>
        </>
      ) : (
        <p className="mt-3 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {diagnostic.subheadline}
        </p>
      )}
    </m.section>
  );
}

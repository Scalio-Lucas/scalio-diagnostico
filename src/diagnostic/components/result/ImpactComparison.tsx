import { formatBRLDecimal, formatDecimalValue, formatInt, pluralize } from "../../engine/format";
import type { Diagnostic, Scenario } from "../../engine/types";
import { ComparisonConnector } from "./ComparisonConnector";
import { ScenarioCard } from "./ScenarioCard";

interface ImpactComparisonProps {
  current: Scenario;
  reference: Scenario;
  diagnostic: Diagnostic;
}

/**
 * BLOCO 2 — "O impacto está aqui": HOJE × CENÁRIO DE REFERÊNCIA, sempre os
 * dois mesmos objetos `Scenario` calculados uma única vez em `useComputed`.
 * Nenhum card recalcula nada — só formata os campos que recebe.
 */
export function ImpactComparison({ current, reference, diagnostic }: ImpactComparisonProps) {
  return (
    <section>
      <h2 className="text-center font-display text-lg font-bold text-foreground sm:text-xl">
        O impacto está aqui
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-center text-sm text-muted-foreground">
        {diagnostic.comparisonSubtitle}
      </p>

      <div className="mt-6 grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4">
        <ScenarioCard
          label="Hoje"
          leads={current.leads}
          visitsValue={formatInt(current.visits)}
          visitsCaption={pluralize(current.visits, "visita", "visitas")}
          leadToVisitRate={current.leadToVisit}
          salesValue={formatInt(current.sales)}
          salesCaption={pluralize(current.sales, "venda", "vendas")}
          visitToSaleRate={current.visitToSale}
          vgv={current.vgv}
          vgvCaption="VGV"
          accent="current"
        />

        <ComparisonConnector
          beforeLabel={formatBRLDecimal(current.leads > 0 ? current.cpl : 0)}
          afterLabel={formatBRLDecimal(reference.cpl)}
          opportunityVGV={diagnostic.opportunityVGV}
          hasOpportunity={diagnostic.hasOpportunity}
          currentVGV={current.vgv}
          potentialVGV={reference.vgv}
        />

        <ScenarioCard
          label="Cenário de referência"
          leads={reference.leads}
          visitsValue={formatDecimalValue(reference.visits)}
          visitsCaption={estimatedCaption(reference.visits, current.visits, "visita", "visitas")}
          leadToVisitRate={reference.leadToVisit}
          salesValue={formatDecimalValue(reference.sales)}
          salesCaption={estimatedCaption(reference.sales, current.sales, "venda", "vendas")}
          visitToSaleRate={reference.visitToSale}
          vgv={reference.vgv}
          vgvCaption="VGV potencial"
          accent="potential"
        />
      </div>
    </section>
  );
}

/** "Estimado" só faz sentido quando o número realmente é uma projeção. */
function estimatedCaption(
  scenarioValue: number,
  todayValue: number,
  singular: string,
  plural: string,
) {
  const varies = Math.abs(scenarioValue - todayValue) > 0.005;
  return varies
    ? pluralize(scenarioValue, `${singular} estimada`, `${plural} estimadas`)
    : pluralize(scenarioValue, singular, plural);
}

import {
  formatBRL,
  formatDecimalValue,
  formatInt,
  formatPercent,
  pluralize,
} from "../../engine/format";
import type { Diagnostic, StageComparison } from "../../engine/types";
import { ComparisonConnector } from "./ComparisonConnector";
import { ScenarioCard } from "./ScenarioCard";

interface ImpactComparisonProps {
  comparison: StageComparison;
  diagnostic: Diagnostic;
}

/**
 * BLOCO 2 — "O impacto está aqui": a história Hoje × Cenário simulado em uma
 * tacada. O título fica fixo (identidade aprovada); o resto se adapta à etapa
 * que o Opportunity Engine apontou como gargalo principal — a mesma estrutura
 * visual serve para investimento→leads, lead→visita ou visita→venda, porque
 * cada card já recebe os números prontos, sem saber de onde vieram.
 */
export function ImpactComparison({ comparison, diagnostic }: ImpactComparisonProps) {
  const {
    today,
    scenario,
    leadToVisitToday,
    leadToVisitScenario,
    visitToSaleToday,
    visitToSaleScenario,
  } = comparison;

  const beforeLabel =
    comparison.primaryMetricKind === "currency"
      ? formatBRL(comparison.primaryMetricToday)
      : formatPercent(comparison.primaryMetricToday, 1);
  const afterLabel =
    comparison.primaryMetricKind === "currency"
      ? formatBRL(comparison.primaryMetricScenario)
      : formatPercent(comparison.primaryMetricScenario, 1);

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
          leads={today.leads}
          visitsValue={formatInt(today.visits)}
          visitsCaption={pluralize(today.visits, "visita", "visitas")}
          leadToVisitRate={leadToVisitToday}
          salesValue={formatInt(today.sales)}
          salesCaption={pluralize(today.sales, "venda", "vendas")}
          visitToSaleRate={visitToSaleToday}
          vgv={today.vgv}
          vgvCaption="VGV"
          accent="current"
        />

        <ComparisonConnector
          beforeLabel={beforeLabel}
          afterLabel={afterLabel}
          opportunityVGV={diagnostic.opportunityVGV}
          hasOpportunity={diagnostic.hasOpportunity}
          currentVGV={today.vgv}
          potentialVGV={scenario.vgv}
        />

        <ScenarioCard
          label="Cenário simulado"
          leads={scenario.leads}
          visitsValue={formatDecimalValue(scenario.visits)}
          visitsCaption={estimatedCaption(scenario.visits, today.visits, "visita", "visitas")}
          leadToVisitRate={leadToVisitScenario}
          salesValue={formatDecimalValue(scenario.sales)}
          salesCaption={estimatedCaption(scenario.sales, today.sales, "venda", "vendas")}
          visitToSaleRate={visitToSaleScenario}
          vgv={scenario.vgv}
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

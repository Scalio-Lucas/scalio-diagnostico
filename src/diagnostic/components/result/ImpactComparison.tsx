import { formatDecimalValue, formatInt, pluralize } from "../../engine/format";
import type { CurrentMetrics, FunnelInputs, ProjectedMetrics } from "../../engine/types";
import { ComparisonConnector } from "./ComparisonConnector";
import { ScenarioCard } from "./ScenarioCard";

interface ImpactComparisonProps {
  inputs: FunnelInputs;
  current: CurrentMetrics;
  projected: ProjectedMetrics;
}

/** BLOCO 2 — "O impacto está aqui": a história Hoje × Cenário simulado em uma tacada. */
export function ImpactComparison({ inputs, current, projected }: ImpactComparisonProps) {
  const hasOpportunity = projected.hasProjectableSales && projected.opportunityVGV > 0;

  return (
    <section>
      <h2 className="text-center font-display text-lg font-bold text-foreground sm:text-xl">
        O impacto está aqui
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-center text-sm text-muted-foreground">
        Mesmos {formatInt(inputs.leads)} {pluralize(inputs.leads, "lead", "leads")}. Mais
        oportunidades chegando à visita.
      </p>

      <div className="mt-6 grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr] md:gap-4">
        <ScenarioCard
          label="Hoje"
          leads={inputs.leads}
          visitsValue={formatInt(inputs.visits)}
          visitsCaption={pluralize(inputs.visits, "visita", "visitas")}
          leadToVisitRate={current.leadToVisit}
          salesValue={formatInt(inputs.sales)}
          salesCaption={pluralize(inputs.sales, "venda", "vendas")}
          visitToSaleRate={current.visitToSale}
          vgv={current.vgv}
          vgvCaption="VGV"
          accent="current"
        />

        <ComparisonConnector
          currentRate={current.leadToVisit}
          projectedRate={projected.leadToVisitProjected}
          opportunityVGV={projected.opportunityVGV}
          hasOpportunity={hasOpportunity}
          currentVGV={current.vgv}
          potentialVGV={projected.vgvPotential}
        />

        <ScenarioCard
          label="Cenário simulado"
          leads={inputs.leads}
          visitsValue={formatDecimalValue(projected.visitsPotential)}
          visitsCaption={pluralize(
            projected.visitsPotential,
            "visita estimada",
            "visitas estimadas",
          )}
          leadToVisitRate={projected.leadToVisitProjected}
          salesValue={formatDecimalValue(projected.salesPotential)}
          salesCaption={pluralize(projected.salesPotential, "venda estimada", "vendas estimadas")}
          visitToSaleRate={projected.visitToSale}
          vgv={projected.vgvPotential}
          vgvCaption="VGV potencial"
          accent="potential"
        />
      </div>
    </section>
  );
}

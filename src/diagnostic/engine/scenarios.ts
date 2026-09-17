import type { CurrentMetrics, FunnelInputs, ProjectedMetrics, ScenarioKey } from "./types";
import { safeNumber } from "./format";

/**
 * Scenario Engine — projeta o funil mantendo investimento, leads, ticket e a
 * conversão Visita→Venda constantes, variando apenas Lead→Visita (seção 1, 17-23).
 *
 * Regra da seção 18: nunca projetar uma taxa pior que a atual.
 * `taxa_projetada = MAX(taxa_atual, taxa_cenario)`.
 */
export function computeProjection(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  leadToVisitInput: number,
  scenario: ScenarioKey,
): ProjectedMetrics {
  const projectedRate = Math.max(current.leadToVisit, safeNumber(leadToVisitInput));
  const wasCappedByCurrent = current.leadToVisit > safeNumber(leadToVisitInput);

  const visitsPotential = inputs.leads * projectedRate;

  // Sem histórico de visitas não existe Visita→Venda observável: não inventamos
  // uma conversão (seção 20, 33 Caso E) — a projeção de vendas fica indisponível.
  const hasProjectableSales = current.hasVisits;
  const visitToSale = current.visitToSale;
  const salesPotential = hasProjectableSales ? visitsPotential * visitToSale : 0;

  const vgvPotential = hasProjectableSales ? salesPotential * inputs.ticket : 0;
  const revenuePotential = hasProjectableSales ? vgvPotential * (inputs.commission / 100) : 0;

  return {
    scenario,
    leadToVisitInput: safeNumber(leadToVisitInput),
    leadToVisitProjected: projectedRate,
    wasCappedByCurrent,
    visitsPotential: safeNumber(visitsPotential),
    visitToSale,
    salesPotential: safeNumber(salesPotential),
    hasProjectableSales,
    vgvPotential: safeNumber(vgvPotential),
    revenuePotential: safeNumber(revenuePotential),
    opportunityVGV: hasProjectableSales ? safeNumber(vgvPotential - current.vgv) : 0,
    opportunityRevenue: hasProjectableSales ? safeNumber(revenuePotential - current.revenue) : 0,
  };
}

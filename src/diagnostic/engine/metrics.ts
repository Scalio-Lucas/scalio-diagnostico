import type { CurrentMetrics, FunnelInputs } from "./types";
import { safeNumber } from "./format";

function divide(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return safeNumber(numerator / denominator);
}

/** Metrics Engine — única fonte de verdade para as taxas/custos do cenário atual. */
export function computeCurrentMetrics(inputs: FunnelInputs): CurrentMetrics {
  const { investment, leads, visits, sales, ticket, commission } = inputs;

  const leadToVisit = divide(visits, leads);
  const visitToSale = divide(sales, visits);
  const leadToSale = divide(sales, leads);

  const vgv = sales * ticket;
  const revenue = vgv * (commission / 100);

  return {
    cpl: divide(investment, leads),
    leadToVisit,
    leadToVisitPct: leadToVisit * 100,
    visitToSale,
    visitToSalePct: visitToSale * 100,
    leadToSale,
    leadToSalePct: leadToSale * 100,
    costPerVisit: divide(investment, visits),
    costPerSale: divide(investment, sales),
    vgv: safeNumber(vgv),
    revenue: safeNumber(revenue),
    hasLeads: leads > 0,
    hasVisits: visits > 0,
    hasSales: sales > 0,
  };
}

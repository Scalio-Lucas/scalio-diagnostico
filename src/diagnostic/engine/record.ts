import type { CurrentMetrics, DiagnosticRecord, FunnelInputs, ProjectedMetrics } from "./types";

/**
 * Monta o payload persistível do diagnóstico (seção 42). Hoje só é salvo
 * localmente; a mesma função pode alimentar um webhook/CRM no futuro sem
 * mudar o motor de cálculo.
 */
export function buildDiagnosticRecord(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  projected: ProjectedMetrics,
): DiagnosticRecord {
  return {
    investment: inputs.investment,
    leads: inputs.leads,
    visits: inputs.visits,
    sales: inputs.sales,
    ticket: inputs.ticket,
    commission: inputs.commission,
    cpl: current.cpl,
    costPerVisit: current.costPerVisit,
    costPerSale: current.costPerSale,
    leadToVisitPct: current.leadToVisitPct,
    visitToSalePct: current.visitToSalePct,
    leadToSalePct: current.leadToSalePct,
    vgvAtual: current.vgv,
    receitaAtual: current.revenue,
    cenarioUtilizado: projected.scenario,
    taxaProjetada: projected.leadToVisitProjected,
    visitasPotenciais: projected.visitsPotential,
    vendasPotenciais: projected.salesPotential,
    vgvPotencial: projected.vgvPotential,
    diferencaVGV: projected.opportunityVGV,
    receitaPotencial: projected.revenuePotential,
    diferencaReceita: projected.opportunityRevenue,
    dataHora: new Date().toISOString(),
  };
}

const STORAGE_KEY = "scalio-diagnostic-records";

/** Stub de persistência local — trocar por chamada de webhook/CRM quando existir. */
export function submitDiagnostic(record: DiagnosticRecord): void {
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    const list = existing ? (JSON.parse(existing) as DiagnosticRecord[]) : [];
    list.push(record);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Armazenamento indisponível (modo privado, etc.) — não bloqueia o diagnóstico.
  }
}

import type { DiagnosticRecord, FunnelInputs, Scenario } from "./types";

/**
 * Monta o payload persistível do diagnóstico. Hoje só é salvo localmente; a
 * mesma função pode alimentar um webhook/CRM no futuro sem mudar o motor de
 * cálculo.
 */
export function buildDiagnosticRecord(
  inputs: FunnelInputs,
  current: Scenario,
  referenceBase: Scenario,
): DiagnosticRecord {
  return {
    investment: inputs.investment,
    leads: inputs.leads,
    visits: inputs.visits,
    sales: inputs.sales,
    ticket: inputs.ticket,
    commission: inputs.commission,
    currentCpl: current.cpl,
    currentLeadToVisitPct: current.leadToVisit * 100,
    currentVisitToSalePct: current.visitToSale * 100,
    currentLeadToSalePct: current.leadToSale * 100,
    currentVgv: current.vgv,
    currentRevenue: current.vgv * (inputs.commission / 100),
    referenceCpl: referenceBase.cpl,
    referenceLeads: referenceBase.leads,
    referenceVisits: referenceBase.visits,
    referenceSales: referenceBase.sales,
    referenceVgv: referenceBase.vgv,
    opportunityVGV: Math.max(referenceBase.vgv - current.vgv, 0),
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

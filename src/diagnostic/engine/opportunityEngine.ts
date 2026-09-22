import { CPL_NEAR_TOLERANCE, DIAGNOSTIC_CONFIG, VGV_NEAR_TOLERANCE } from "../config";
import { safeNumber } from "./format";
import type {
  AcquisitionStatus,
  CurrentMetrics,
  FunnelInputs,
  OpportunityAnalysis,
  PrimaryFocus,
  ReferenceScenario,
  StageComparison,
} from "./types";

/**
 * Scenario Engine — a REGRA ABSOLUTA deste motor: o cenário de referência
 * SEMPRE recomeça do investimento, nunca do volume atual de leads.
 *
 *   INVESTIMENTO ÷ CPL DE REFERÊNCIA        = LEADS PROJETADOS
 *   LEADS PROJETADOS × TAXA LEAD→VISITA REF = VISITAS PROJETADAS
 *   LEADS PROJETADOS × TAXA LEAD→VENDA REF  = VENDAS PROJETADAS (min/base/max)
 *   VENDAS PROJETADAS × TICKET              = VGV PROJETADO
 *
 * Lead→Venda usa a referência (4%–6%, base 5%) diretamente sobre os leads
 * projetados — NUNCA a taxa Visita→Venda histórica do cliente. Isso é
 * proposital: um CPL muito barato pode gerar poucos leads no cenário de
 * referência (menos volume bruto, mais qualidade); um CPL muito caro pode
 * gerar mais. O cenário atual (o que o cliente informou) nunca é alterado —
 * ele só descreve a operação de hoje.
 */
export function analyzeOpportunities(
  inputs: FunnelInputs,
  current: CurrentMetrics,
): OpportunityAnalysis {
  const reference = buildReferenceScenario(inputs);

  if (inputs.investment <= 0) {
    return {
      reference,
      acquisitionStatus: "not_calculable",
      leadToVisitOk: current.leadToVisit >= DIAGNOSTIC_CONFIG.leadToVisitRate,
      leadToSaleOk: current.leadToSale >= DIAGNOSTIC_CONFIG.leadToSaleRateMin,
      primaryFocus: "none",
      deltaVGV: 0,
      diagnosticType: "no_investment",
    };
  }

  const cplAtual = current.hasLeads ? current.cpl : null;
  const acquisitionStatus = classifyAcquisition(cplAtual);
  const leadToVisitOk = current.leadToVisit >= DIAGNOSTIC_CONFIG.leadToVisitRate;
  const leadToSaleOk = current.leadToSale >= DIAGNOSTIC_CONFIG.leadToSaleRateMin;
  const conversionOk = leadToVisitOk && leadToSaleOk;
  const acquisitionOk = acquisitionStatus !== "above_reference";

  let primaryFocus: PrimaryFocus;
  if (acquisitionOk && conversionOk) primaryFocus = "none";
  else if (!acquisitionOk && conversionOk) primaryFocus = "acquisition";
  else if (acquisitionOk && !conversionOk) primaryFocus = "conversion";
  else primaryFocus = "both";

  const deltaVGV = safeNumber(reference.vgvBase - current.vgv);
  const magnitude = Math.max(Math.abs(current.vgv), Math.abs(reference.vgvBase), 1);
  const isNear = Math.abs(deltaVGV) <= magnitude * VGV_NEAR_TOLERANCE;

  const diagnosticType: OpportunityAnalysis["diagnosticType"] = isNear
    ? "near_reference"
    : deltaVGV > 0
      ? "opportunity"
      : "above_reference";

  return {
    reference,
    acquisitionStatus,
    leadToVisitOk,
    leadToSaleOk,
    primaryFocus,
    deltaVGV,
    diagnosticType,
  };
}

/** Investimento ÷ CPL de referência → leads → visitas → vendas (faixa) → VGV (faixa). */
function buildReferenceScenario(inputs: FunnelInputs): ReferenceScenario {
  const {
    qualifiedLeadCPL,
    leadToVisitRate,
    leadToSaleRateMin,
    leadToSaleRateBase,
    leadToSaleRateMax,
  } = DIAGNOSTIC_CONFIG;

  const leads = inputs.investment > 0 ? inputs.investment / qualifiedLeadCPL : 0;
  const visits = leads * leadToVisitRate;
  const salesMin = leads * leadToSaleRateMin;
  const salesBase = leads * leadToSaleRateBase;
  const salesMax = leads * leadToSaleRateMax;

  return {
    cpl: qualifiedLeadCPL,
    leads: safeNumber(leads),
    leadToVisit: leadToVisitRate,
    visits: safeNumber(visits),
    // Só para mostrar a relação (seção "métricas coerentes entre si"): não é
    // uma taxa independente, é consequência de leadToSaleRateBase/leadToVisitRate.
    impliedVisitToSale: leadToVisitRate > 0 ? leadToSaleRateBase / leadToVisitRate : 0,
    leadToSaleMin: leadToSaleRateMin,
    leadToSaleBase: leadToSaleRateBase,
    leadToSaleMax: leadToSaleRateMax,
    salesMin: safeNumber(salesMin),
    salesBase: safeNumber(salesBase),
    salesMax: safeNumber(salesMax),
    vgvMin: safeNumber(salesMin * inputs.ticket),
    vgvBase: safeNumber(salesBase * inputs.ticket),
    vgvMax: safeNumber(salesMax * inputs.ticket),
  };
}

function classifyAcquisition(cplAtual: number | null): AcquisitionStatus {
  if (cplAtual === null) return "not_calculable";
  const { qualifiedLeadCPL } = DIAGNOSTIC_CONFIG;
  const upper = qualifiedLeadCPL * (1 + CPL_NEAR_TOLERANCE);
  const lower = qualifiedLeadCPL * (1 - CPL_NEAR_TOLERANCE);
  if (cplAtual > upper) return "above_reference";
  if (cplAtual < lower) return "below_reference";
  return "near_reference";
}

/**
 * Monta a comparação Hoje × Cenário de referência do BLOCO 2. Só não existe
 * quando não há investimento informado (não há como calcular leads
 * projetados) — fora isso, a comparação está sempre disponível, mesmo sem
 * visitas ou vendas históricas.
 */
export function buildStageComparison(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  opportunities: OpportunityAnalysis,
): StageComparison | null {
  if (opportunities.diagnosticType === "no_investment") return null;

  const { reference } = opportunities;

  const today: StageComparison["today"] = {
    leads: inputs.leads,
    visits: inputs.visits,
    sales: inputs.sales,
    vgv: current.vgv,
  };
  const scenario: StageComparison["scenario"] = {
    leads: reference.leads,
    visits: reference.visits,
    sales: reference.salesBase,
    vgv: reference.vgvBase,
  };

  return {
    today,
    scenario,
    leadToVisitToday: current.leadToVisit,
    leadToVisitScenario: reference.leadToVisit,
    visitToSaleToday: current.visitToSale,
    visitToSaleScenario: reference.impliedVisitToSale,
    opportunityVGV: opportunities.deltaVGV,
    primaryMetricKind: "currency",
    primaryMetricToday: current.hasLeads ? current.cpl : 0,
    primaryMetricScenario: reference.cpl,
  };
}

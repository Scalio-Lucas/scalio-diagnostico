import { CPL_NEAR_TOLERANCE, DIAGNOSTIC_CONFIG, VGV_NEAR_TOLERANCE } from "../config";
import { safeNumber } from "./format";
import type {
  AcquisitionStatus,
  DiagnosticType,
  FunnelInputs,
  Opportunity,
  PrimaryFocus,
  ReferenceParams,
  Scenario,
} from "./types";

function divide(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return safeNumber(numerator / denominator);
}

/**
 * ÚNICA fonte de verdade para o cenário atual — lê os dados informados
 * diretamente, sem recalcular nada a partir de um cenário de referência.
 */
export function calculateCurrentScenario(inputs: FunnelInputs): Scenario {
  const { investment, leads, visits, sales, ticket } = inputs;
  return {
    investment: safeNumber(investment),
    cpl: divide(investment, leads),
    leads: safeNumber(leads),
    leadToVisit: divide(visits, leads),
    visits: safeNumber(visits),
    leadToSale: divide(sales, leads),
    sales: safeNumber(sales),
    visitToSale: divide(sales, visits),
    vgv: safeNumber(sales * ticket),
  };
}

/**
 * ÚNICA fonte de verdade para o cenário de referência — SEMPRE recomeça do
 * investimento, nunca do volume atual de leads:
 *
 *   LEADS  = INVESTIMENTO ÷ CPL DE REFERÊNCIA        (nunca = leads atuais)
 *   VISITS = LEADS × TAXA LEAD→VISITA DE REFERÊNCIA
 *   SALES  = LEADS × TAXA LEAD→VENDA DE REFERÊNCIA   (direto, nunca via Visita→Venda histórica)
 *   VGV    = SALES × TICKET
 *
 * Chamada 3x (min/base/max) com o mesmo `cpl`/`leadToVisit` e apenas o
 * `leadToSale` variando — nunca uma fórmula de faixa separada.
 */
export function calculateReferenceScenario(
  inputs: Pick<FunnelInputs, "investment" | "ticket">,
  params: ReferenceParams,
): Scenario {
  const { investment, ticket } = inputs;
  const { cpl, leadToVisit, leadToSale } = params;

  const leads = investment > 0 ? investment / cpl : 0;
  const visits = leads * leadToVisit;
  const sales = leads * leadToSale;
  const vgv = sales * ticket;

  return {
    investment: safeNumber(investment),
    cpl,
    leads: safeNumber(leads),
    leadToVisit,
    visits: safeNumber(visits),
    leadToSale,
    sales: safeNumber(sales),
    visitToSale: leadToVisit > 0 ? leadToSale / leadToVisit : 0,
    vgv: safeNumber(vgv),
  };
}

/** Guarda de execução: denuncia qualquer regressão que reintroduza "leads = leads atuais". */
export function assertReferenceLeadsConsistency(
  investment: number,
  cpl: number,
  leads: number,
  tolerance = 0.01,
): boolean {
  const expected = cpl > 0 ? investment / cpl : 0;
  const ok = Math.abs(leads - expected) <= tolerance;
  if (!ok) {
    console.error(
      `[scenarioEngine] referenceLeads inconsistente: esperado ${expected}, recebido ${leads}. ` +
        `Isso indica que algum código recalculou leads fora de calculateReferenceScenario.`,
    );
  }
  return ok;
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
 * Compara cenário atual × cenário de referência (base) e classifica onde está
 * a diferença. Não recalcula nenhum número — só interpreta os dois cenários
 * já prontos.
 */
export function analyzeOpportunity(
  inputs: FunnelInputs,
  current: Scenario,
  referenceBase: Scenario,
): Opportunity {
  if (inputs.investment <= 0) {
    return {
      acquisitionStatus: "not_calculable",
      leadToVisitOk: current.leadToVisit >= DIAGNOSTIC_CONFIG.leadToVisitRate,
      leadToSaleOk: current.leadToSale >= DIAGNOSTIC_CONFIG.leadToSaleRateMin,
      primaryFocus: "none",
      deltaVGV: 0,
      diagnosticType: "no_investment",
    };
  }

  const cplAtual = current.leads > 0 ? current.cpl : null;
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

  const deltaVGV = safeNumber(referenceBase.vgv - current.vgv);
  const magnitude = Math.max(Math.abs(current.vgv), Math.abs(referenceBase.vgv), 1);
  const isNear = Math.abs(deltaVGV) <= magnitude * VGV_NEAR_TOLERANCE;

  const diagnosticType: DiagnosticType = isNear
    ? "near_reference"
    : deltaVGV > 0
      ? "opportunity"
      : "above_reference";

  return {
    acquisitionStatus,
    leadToVisitOk,
    leadToSaleOk,
    primaryFocus,
    deltaVGV,
    diagnosticType,
  };
}

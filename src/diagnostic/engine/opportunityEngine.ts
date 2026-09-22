import {
  DIAGNOSTIC_REFERENCES,
  LOW_CPL_RATIO,
  MEANINGFUL_OPPORTUNITY_VGV,
  SAMPLE_SIZE_THRESHOLDS,
} from "../config";
import { safeNumber } from "./format";
import type {
  CurrentMetrics,
  FunnelInputs,
  OpportunityAnalysis,
  SampleConfidence,
  ScenarioResult,
  StageComparison,
} from "./types";

/**
 * Scenario Engine — a cadeia é sempre Investimento → CPL → Leads → Lead→Visita
 * → Visitas → Visita→Venda → Vendas → VGV. CPL determina leads (leads =
 * investimento / CPL); nenhum cenário mantém leads fixos enquanto muda o CPL,
 * porque isso quebraria a própria definição de CPL com investimento constante.
 *
 * Três cenários coerentes, nunca combinados entre si:
 *   A — operação atual, sem nenhuma alteração.
 *   B — mesma aquisição (CPL/leads atuais), conversão Lead→Visita no cenário
 *       de referência quando isso for uma melhoria.
 *   C — aquisição normalizada (CPL de referência, só quando o CPL atual for
 *       pior que a referência) + a mesma melhoria de conversão de B.
 * Visita→Venda nunca tem referência configurada — é sempre a taxa real em
 * todo cenário. Nenhum cenário piora uma métrica que já é melhor que a
 * referência (regra crítica do briefing).
 */
export function analyzeOpportunities(
  inputs: FunnelInputs,
  current: CurrentMetrics,
): OpportunityAnalysis {
  const refs = DIAGNOSTIC_REFERENCES;

  if (!current.hasLeads) {
    return terminal(inputs, current, "no_leads");
  }
  if (!current.hasVisits) {
    return terminal(inputs, current, "no_visits");
  }
  if (!current.hasSales) {
    return terminal(inputs, current, "no_sales_history");
  }

  const scenarioA = buildScenario(
    inputs,
    inputs.investment > 0 ? current.cpl : null,
    current.leadToVisit,
    current.visitToSale,
    inputs.ticket,
  );
  const scenarioB = computeScenarioB(inputs, current, refs);
  const scenarioC = computeScenarioC(inputs, current, refs);
  const qualityNormalization = computeQualityNormalization(inputs, current, refs);

  const meaningfullyBetter = (candidate: ScenarioResult, baseline: ScenarioResult) =>
    candidate.vgv - baseline.vgv > MEANINGFUL_OPPORTUNITY_VGV;

  let recommended: "A" | "B" | "C" = "A";
  if (meaningfullyBetter(scenarioB, scenarioA)) {
    recommended = "B";
  }
  // C só "ganha" de B quando a aquisição normalizada soma algo além da
  // melhoria de conversão que B já entrega (senão, sem investimento
  // informado ou com CPL já bom, C é idêntico a B e não deveria levar
  // crédito por uma mudança de aquisição que não existe).
  if (meaningfullyBetter(scenarioC, scenarioA) && meaningfullyBetter(scenarioC, scenarioB)) {
    recommended = "C";
  }

  const diagnosticType: OpportunityAnalysis["diagnosticType"] =
    recommended === "A"
      ? "already_efficient"
      : recommended === "C"
        ? "acquisition_opportunity"
        : "conversion_opportunity";

  const leadToVisitConfidence = sampleConfidence(inputs.leads);

  return {
    scenarioA,
    scenarioB,
    scenarioC,
    qualityNormalization,
    recommended,
    leadToVisitConfidence,
    diagnosticType,
  };
}

function terminal(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  diagnosticType: OpportunityAnalysis["diagnosticType"],
): OpportunityAnalysis {
  const scenarioA = buildScenario(
    inputs,
    inputs.investment > 0 && inputs.leads > 0 ? current.cpl : null,
    current.leadToVisit,
    current.visitToSale,
    inputs.ticket,
  );
  return {
    scenarioA,
    scenarioB: scenarioA,
    scenarioC: scenarioA,
    qualityNormalization: null,
    recommended: "A",
    leadToVisitConfidence: "not_applicable",
    diagnosticType,
  };
}

function buildScenario(
  inputs: FunnelInputs,
  cpl: number | null,
  leadToVisit: number,
  visitToSale: number,
  ticket: number,
): ScenarioResult {
  const leads = cpl !== null && cpl > 0 ? inputs.investment / cpl : inputs.leads;
  const visits = leads * leadToVisit;
  const sales = visits * visitToSale;
  const vgv = sales * ticket;
  return {
    cpl,
    leadToVisit: safeNumber(leadToVisit),
    visitToSale: safeNumber(visitToSale),
    leads: safeNumber(leads),
    visits: safeNumber(visits),
    sales: safeNumber(sales),
    vgv: safeNumber(vgv),
  };
}

/** Cenário B — mesma aquisição (CPL/leads atuais), conversão no cenário de referência. */
function computeScenarioB(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  refs: typeof DIAGNOSTIC_REFERENCES,
): ScenarioResult {
  const leadToVisit = Math.max(current.leadToVisit, refs.referenceLeadToVisit);
  const cpl = inputs.investment > 0 ? current.cpl : null;
  return buildScenario(inputs, cpl, leadToVisit, current.visitToSale, inputs.ticket);
}

/**
 * Cenário C — aquisição normalizada + conversão. Só troca o CPL atual pelo de
 * referência quando o atual for PIOR (mais caro); nunca "sobe" um CPL que já
 * é melhor que a referência (regra crítica). Sem investimento informado, não
 * há CPL para normalizar — cai para exatamente o Cenário B.
 */
function computeScenarioC(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  refs: typeof DIAGNOSTIC_REFERENCES,
): ScenarioResult {
  if (inputs.investment <= 0) {
    return computeScenarioB(inputs, current, refs);
  }
  const cpl = Math.min(current.cpl, refs.referenceCPL);
  const leadToVisit = Math.max(current.leadToVisit, refs.referenceLeadToVisit);
  return buildScenario(inputs, cpl, leadToVisit, current.visitToSale, inputs.ticket);
}

/**
 * Cenário explicativo (nunca o recomendado): quando o CPL atual é anormalmente
 * barato E a conversão Lead→Visita está abaixo da referência, mostra o que
 * aconteceria adotando o CPL de referência mesmo sendo numericamente "pior" —
 * para ilustrar que trocar volume barato por leads no padrão de referência
 * não necessariamente compensa.
 */
function computeQualityNormalization(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  refs: typeof DIAGNOSTIC_REFERENCES,
): ScenarioResult | null {
  if (inputs.investment <= 0) return null;
  const isAnomalouslyCheap = current.cpl > 0 && current.cpl < refs.referenceCPL * LOW_CPL_RATIO;
  const isBelowReferenceConversion = current.leadToVisit < refs.referenceLeadToVisit;
  if (!isAnomalouslyCheap || !isBelowReferenceConversion) return null;

  return buildScenario(
    inputs,
    refs.referenceCPL,
    refs.referenceLeadToVisit,
    current.visitToSale,
    inputs.ticket,
  );
}

function sampleConfidence(sampleSize: number): SampleConfidence {
  if (sampleSize < SAMPLE_SIZE_THRESHOLDS.low) return "low_sample";
  if (sampleSize < SAMPLE_SIZE_THRESHOLDS.usable) return "usable_sample";
  return "stronger_sample";
}

/**
 * Monta a comparação Hoje × Cenário do BLOCO 2 a partir do cenário recomendado
 * (B ou C). Quando o cenário atual (A) já é o melhor, retorna `null` — o
 * componente decide o layout de card único.
 */
export function buildStageComparison(
  current: CurrentMetrics,
  opportunities: OpportunityAnalysis,
): StageComparison | null {
  if (opportunities.recommended === "A") return null;

  const { scenarioA, scenarioB, scenarioC } = opportunities;
  const winner = opportunities.recommended === "C" ? scenarioC : scenarioB;

  // Se o CPL do cenário vencedor difere do atual, a variável em destaque é a
  // aquisição (Investimento→Leads); senão é a conversão (Lead→Visita) — os
  // mesmos dois "modos" que os cards/conector já sabem renderizar.
  const cplChanged =
    winner.cpl !== null && scenarioA.cpl !== null && winner.cpl < scenarioA.cpl - 0.005;
  const stage = cplChanged ? "leadGeneration" : "leadToVisit";

  const today = {
    leads: scenarioA.leads,
    visits: scenarioA.visits,
    sales: scenarioA.sales,
    vgv: scenarioA.vgv,
  };
  const scenario = {
    leads: winner.leads,
    visits: winner.visits,
    sales: winner.sales,
    vgv: winner.vgv,
  };

  const primaryMetricKind = stage === "leadGeneration" ? "currency" : "percent";
  const primaryMetricToday =
    stage === "leadGeneration" ? (scenarioA.cpl ?? 0) : current.leadToVisit;
  const primaryMetricScenario = stage === "leadGeneration" ? (winner.cpl ?? 0) : winner.leadToVisit;

  return {
    stage,
    today,
    scenario,
    leadToVisitToday: current.leadToVisit,
    leadToVisitScenario: winner.leadToVisit,
    visitToSaleToday: current.visitToSale,
    visitToSaleScenario: winner.visitToSale,
    opportunityVGV: safeNumber(winner.vgv - scenarioA.vgv),
    primaryMetricKind,
    primaryMetricToday,
    primaryMetricScenario,
  };
}

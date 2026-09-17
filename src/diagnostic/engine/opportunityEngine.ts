import {
  DIAGNOSTIC_REFERENCES,
  LOW_LEADS_THRESHOLD,
  MEANINGFUL_OPPORTUNITY_VGV,
  SAMPLE_SIZE_THRESHOLDS,
} from "../config";
import { safeNumber } from "./format";
import type {
  BottleneckId,
  CurrentMetrics,
  FunnelInputs,
  FunnelSnapshot,
  OpportunityAnalysis,
  SampleConfidence,
  StageComparison,
  StageKey,
  StageOpportunity,
} from "./types";

/**
 * Opportunity Engine — em vez de assumir que Lead→Visita é sempre o gargalo,
 * isola CADA etapa do funil (uma de cada vez, mantendo as demais nos valores
 * atuais) e mede o ganho incremental de VGV que só aquela melhoria geraria.
 * O gargalo principal é a etapa com maior oportunidade incremental — não a
 * taxa numericamente mais baixa (taxas de etapas diferentes não são
 * comparáveis entre si) e não uma etapa fixa de antemão.
 *
 * A comissão nunca entra aqui como candidata a gargalo — só é usada a jusante
 * (receita bruta) por quem consome o resultado.
 */
export function analyzeOpportunities(
  inputs: FunnelInputs,
  current: CurrentMetrics,
): OpportunityAnalysis {
  const refs = DIAGNOSTIC_REFERENCES;

  // Casos terminais (seções 18-20): sem leads, sem visitas ou sem vendas, a
  // cadeia de multiplicação zera tudo a jusante — não há o que comparar entre
  // etapas, então nem tentamos rankear por VGV incremental.
  if (!current.hasLeads) {
    return terminalAnalysis("no_leads", "leadGeneration");
  }
  if (!current.hasVisits) {
    return terminalAnalysis("no_visits", "leadToVisit");
  }
  if (!current.hasSales) {
    return terminalAnalysis("no_sales_history", "visitToSale");
  }

  const leadGeneration = analyzeLeadGeneration(inputs, current, refs.leadGeneration.referenceCPL);
  const leadToVisit = analyzeLeadToVisit(inputs, current, refs.leadToVisit.referenceRate);
  const visitToSale = analyzeVisitToSale(inputs, current, refs.visitToSale.referenceRate);

  const candidates: { stage: StageKey; opportunity: StageOpportunity }[] = [
    { stage: "leadGeneration" as const, opportunity: leadGeneration },
    { stage: "leadToVisit" as const, opportunity: leadToVisit },
    { stage: "visitToSale" as const, opportunity: visitToSale },
  ].filter((c) => c.opportunity.eligible);

  const ranked = candidates
    .filter((c) => c.opportunity.incrementalVGV > MEANINGFUL_OPPORTUNITY_VGV)
    .sort((a, b) => b.opportunity.incrementalVGV - a.opportunity.incrementalVGV);

  const volume: OpportunityAnalysis["volume"] = {
    status: inputs.leads < LOW_LEADS_THRESHOLD ? "limited" : "adequate",
  };

  let primaryBottleneck: BottleneckId | null;
  let secondaryBottleneck: BottleneckId | null = null;
  let diagnosticType: OpportunityAnalysis["diagnosticType"];

  if (ranked.length === 0) {
    // Nenhuma etapa isolada supera a referência de forma relevante.
    if (volume.status === "limited") {
      primaryBottleneck = "volume";
      diagnosticType = "volume_limited";
    } else {
      primaryBottleneck = "balanced";
      diagnosticType = "no_obvious_bottleneck";
    }
  } else {
    primaryBottleneck = ranked[0].stage;
    if (ranked.length > 1) {
      secondaryBottleneck = ranked[1].stage;
      diagnosticType = "multiple_bottlenecks";
    } else {
      diagnosticType = "single_bottleneck";
    }
  }

  return {
    leadGeneration,
    leadToVisit,
    visitToSale,
    volume,
    primaryBottleneck,
    secondaryBottleneck,
    diagnosticType,
  };
}

function terminalAnalysis(
  diagnosticType: OpportunityAnalysis["diagnosticType"],
  primaryBottleneck: BottleneckId,
): OpportunityAnalysis {
  const notApplicable = ineligibleStage();
  return {
    leadGeneration: notApplicable,
    leadToVisit: notApplicable,
    visitToSale: notApplicable,
    volume: { status: "adequate" },
    primaryBottleneck,
    secondaryBottleneck: null,
    diagnosticType,
  };
}

function ineligibleStage(): StageOpportunity {
  const emptySnapshot: FunnelSnapshot = { leads: 0, visits: 0, sales: 0, vgv: 0 };
  return {
    eligible: false,
    confidence: "not_applicable",
    currentValue: 0,
    referenceValue: 0,
    isAboveReference: false,
    today: emptySnapshot,
    scenario: emptySnapshot,
    incrementalVGV: 0,
  };
}

function sampleConfidence(sampleSize: number): SampleConfidence {
  if (sampleSize < SAMPLE_SIZE_THRESHOLDS.low) return "low_sample";
  if (sampleSize < SAMPLE_SIZE_THRESHOLDS.usable) return "usable_sample";
  return "stronger_sample";
}

function snapshotFrom(
  inputs: FunnelInputs,
  leads: number,
  visits: number,
  sales: number,
): FunnelSnapshot {
  const vgv = safeNumber(sales * inputs.ticket);
  return { leads: safeNumber(leads), visits: safeNumber(visits), sales: safeNumber(sales), vgv };
}

/** Isola Investimento → Leads: mesmo investimento, CPL de referência, demais taxas atuais. */
function analyzeLeadGeneration(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  referenceCPL: number,
): StageOpportunity {
  if (inputs.investment <= 0) return ineligibleStage();

  const currentCPL = current.cpl;
  const isAboveReference = currentCPL <= referenceCPL;
  const projectedLeads = Math.max(inputs.leads, inputs.investment / referenceCPL);

  const today = snapshotFrom(inputs, inputs.leads, inputs.visits, inputs.sales);
  const projectedVisits = projectedLeads * current.leadToVisit;
  const projectedSales = projectedVisits * current.visitToSale;
  const scenario = snapshotFrom(inputs, projectedLeads, projectedVisits, projectedSales);

  return {
    eligible: true,
    confidence: "stronger_sample", // CPL não depende de amostra de conversão
    currentValue: currentCPL,
    referenceValue: referenceCPL,
    isAboveReference,
    today,
    scenario,
    incrementalVGV: safeNumber(scenario.vgv - today.vgv),
  };
}

/** Isola Lead → Visita: mesmos leads, taxa de referência, Visita→Venda atual. */
function analyzeLeadToVisit(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  referenceRate: number,
): StageOpportunity {
  const isAboveReference = current.leadToVisit >= referenceRate;
  const projectedRate = Math.max(current.leadToVisit, referenceRate);

  const today = snapshotFrom(inputs, inputs.leads, inputs.visits, inputs.sales);
  const projectedVisits = inputs.leads * projectedRate;
  const projectedSales = projectedVisits * current.visitToSale;
  const scenario = snapshotFrom(inputs, inputs.leads, projectedVisits, projectedSales);

  return {
    eligible: true,
    confidence: sampleConfidence(inputs.leads),
    currentValue: current.leadToVisit,
    referenceValue: referenceRate,
    isAboveReference,
    today,
    scenario,
    incrementalVGV: safeNumber(scenario.vgv - today.vgv),
  };
}

/** Isola Visita → Venda: mesmos leads e visitas, taxa de referência. */
function analyzeVisitToSale(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  referenceRate: number,
): StageOpportunity {
  const isAboveReference = current.visitToSale >= referenceRate;
  const projectedRate = Math.max(current.visitToSale, referenceRate);

  const today = snapshotFrom(inputs, inputs.leads, inputs.visits, inputs.sales);
  const projectedSales = inputs.visits * projectedRate;
  const scenario = snapshotFrom(inputs, inputs.leads, inputs.visits, projectedSales);

  return {
    eligible: true,
    confidence: sampleConfidence(inputs.visits),
    currentValue: current.visitToSale,
    referenceValue: referenceRate,
    isAboveReference,
    today,
    scenario,
    incrementalVGV: safeNumber(scenario.vgv - today.vgv),
  };
}

const STAGE_FIELD: Record<StageKey, keyof OpportunityAnalysis> = {
  leadGeneration: "leadGeneration",
  leadToVisit: "leadToVisit",
  visitToSale: "visitToSale",
};

/**
 * Monta a comparação Hoje × Cenário do BLOCO 2 isolada na etapa escolhida
 * como gargalo principal. Quando o gargalo não é uma etapa isolável (volume /
 * balanced), retorna `null` — o componente decide o layout alternativo.
 */
export function buildStageComparison(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  opportunities: OpportunityAnalysis,
): StageComparison | null {
  const stage = opportunities.primaryBottleneck;
  if (stage !== "leadGeneration" && stage !== "leadToVisit" && stage !== "visitToSale") {
    return null;
  }

  const opportunity = opportunities[STAGE_FIELD[stage]] as StageOpportunity;

  // As taxas mostradas nos dois cards: só a etapa isolada varia, as outras
  // ficam idênticas nos dois lados (é isso que "isolar a variável" significa
  // visualmente) — seção 13.
  const leadToVisitToday = current.leadToVisit;
  const visitToSaleToday = current.visitToSale;
  const leadToVisitScenario =
    stage === "leadToVisit" ? opportunity.referenceValue : leadToVisitToday;
  const visitToSaleScenario =
    stage === "visitToSale" ? opportunity.referenceValue : visitToSaleToday;

  const primaryMetricKind = stage === "leadGeneration" ? "currency" : "percent";
  const primaryMetricToday =
    stage === "leadGeneration"
      ? opportunity.currentValue
      : stage === "leadToVisit"
        ? leadToVisitToday
        : visitToSaleToday;
  const primaryMetricScenario =
    stage === "leadGeneration"
      ? opportunity.isAboveReference
        ? opportunity.currentValue
        : opportunity.referenceValue
      : stage === "leadToVisit"
        ? Math.max(leadToVisitToday, leadToVisitScenario)
        : Math.max(visitToSaleToday, visitToSaleScenario);

  return {
    stage,
    today: opportunity.today,
    scenario: opportunity.scenario,
    leadToVisitToday,
    leadToVisitScenario: Math.max(leadToVisitToday, leadToVisitScenario),
    visitToSaleToday,
    visitToSaleScenario: Math.max(visitToSaleToday, visitToSaleScenario),
    opportunityVGV: opportunity.incrementalVGV,
    primaryMetricKind,
    primaryMetricToday,
    primaryMetricScenario,
  };
}

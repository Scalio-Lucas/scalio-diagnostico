import { DIAGNOSTIC_REFERENCES, SCENARIOS } from "../config";
import { formatBRL, formatPercent } from "./format";
import type {
  CurrentMetrics,
  Diagnostic,
  OpportunityAnalysis,
  ScenarioKey,
  StageComparison,
} from "./types";

/**
 * Escolhe o cenário-base do simulador de Lead→Visita (BLOCO 3 / "Ver
 * diagnóstico completo"). Esse simulador continua existindo como está —
 * "Potencial" (20%) é o piso, só sobe para "alta eficiência" quando a própria
 * taxa atual já superar 20%. Independente do Scenario Engine abaixo.
 */
export function pickInitialScenario(current: CurrentMetrics): ScenarioKey {
  const baseOrder: Exclude<ScenarioKey, "custom">[] = ["potential", "highEfficiency"];
  for (const key of baseOrder) {
    if (SCENARIOS[key].leadToVisit > current.leadToVisit) return key;
  }
  return "highEfficiency";
}

const LEAD_TO_VISIT_HYPOTHESES = [
  "velocidade de atendimento ao lead",
  "qualificação do contato antes de agendar",
  "follow-up até a confirmação da visita",
  "abordagem comercial no primeiro contato",
  "processo de agendamento",
];

/**
 * Diagnostic Engine — traduz o veredito do Scenario Engine (A/B/C) em texto.
 * Nunca decide sozinho qual cenário é melhor (isso é trabalho do
 * `analyzeOpportunities`); só descreve o resultado em linguagem matemática
 * ("cenário simulado", "parâmetro de referência", "oportunidade estimada"),
 * nunca causal ou promissória ("você vai gerar", "garantido").
 */
export function buildDiagnostic(
  current: CurrentMetrics,
  opportunities: OpportunityAnalysis,
  comparison: StageComparison | null,
): Diagnostic {
  switch (opportunities.diagnosticType) {
    case "no_leads":
      return terminalDiagnostic(
        "no_leads",
        "Não há leads suficientes informados para diagnosticar o funil.",
        "Não há leads registrados no período informado. Sem leads, ainda não é possível calcular o custo por lead nem projetar visitas ou vendas — a primeira etapa a revisar é o volume de oportunidades gerado pelo investimento.",
      );

    case "no_visits":
      return terminalDiagnostic(
        "no_visits",
        "Hoje, nenhum dos leads informados chegou a uma visita.",
        `Hoje, 0% dos leads chegam a uma visita. É possível simular quantas visitas o parâmetro de referência (${formatPercent(DIAGNOSTIC_REFERENCES.referenceLeadToVisit, 0)}) produziria com o mesmo volume de leads, mas ainda não há dados suficientes para projetar vendas ou VGV a partir dessas visitas.`,
      );

    case "no_sales_history":
      return terminalDiagnostic(
        "no_sales_history",
        "Ainda não há histórico suficiente para estimar VGV potencial com segurança.",
        `Como não houve vendas originadas dessas visitas no período informado, ainda não existe histórico suficiente para estimar com segurança o VGV potencial. Hoje, ${formatPercent(current.leadToVisit)} dos leads chegam à visita — o diagnóstico de aquisição e de Lead → Visita continua disponível em "Ver diagnóstico completo".`,
      );

    case "already_efficient":
      return buildAlreadyEfficientDiagnostic(current, opportunities);

    case "conversion_opportunity":
    case "acquisition_opportunity":
    default:
      return buildOpportunityDiagnostic(current, opportunities, comparison);
  }
}

function terminalDiagnostic(
  diagnosticType: Diagnostic["diagnosticType"],
  subheadline: string,
  diagnosticText: string,
): Diagnostic {
  return {
    diagnosticType,
    primaryBottleneck: null,
    hasOpportunity: false,
    opportunityVGV: 0,
    subheadline,
    constantLine: "",
    contextLine: "",
    comparisonTitle: "",
    comparisonSubtitle: "",
    diagnosticText,
    secondaryObservation: null,
    recommendations: [],
  };
}

function buildAlreadyEfficientDiagnostic(
  current: CurrentMetrics,
  opportunities: OpportunityAnalysis,
): Diagnostic {
  const { referenceCPL, referenceLeadToVisit } = DIAGNOSTIC_REFERENCES;
  const cplOk = opportunities.scenarioA.cpl === null || opportunities.scenarioA.cpl <= referenceCPL;
  const leadToVisitOk = current.leadToVisit >= referenceLeadToVisit;

  let diagnosticText: string;
  if (cplOk && leadToVisitOk) {
    diagnosticText = `Com base nos dados informados, seu custo por lead${
      opportunities.scenarioA.cpl !== null ? ` (${formatBRL(opportunities.scenarioA.cpl)})` : ""
    } e sua taxa Lead → Visita (${formatPercent(current.leadToVisit)}) já estão dentro do cenário de referência utilizado nesta simulação (${formatBRL(referenceCPL)} de CPL e ${formatPercent(referenceLeadToVisit, 0)} de Lead → Visita). Não identificamos, com os dados informados, uma oportunidade matemática clara nesses parâmetros.`;
  } else {
    diagnosticText =
      "Com base nos dados informados, os cenários simulados (mesma aquisição com conversão de referência, e aquisição normalizada com conversão de referência) não produzem uma estimativa de VGV superior ao seu cenário atual.";
  }

  return {
    diagnosticType: "already_efficient",
    primaryBottleneck: "balanced",
    hasOpportunity: false,
    opportunityVGV: 0,
    subheadline:
      "Nos cenários simulados, seu funil já captura bem o volume atual de oportunidades.",
    constantLine: "",
    contextLine: "",
    comparisonTitle: "",
    comparisonSubtitle: "",
    diagnosticText,
    secondaryObservation: null,
    recommendations: [],
  };
}

function buildOpportunityDiagnostic(
  current: CurrentMetrics,
  opportunities: OpportunityAnalysis,
  comparison: StageComparison | null,
): Diagnostic {
  const isAcquisition = opportunities.diagnosticType === "acquisition_opportunity";
  const winner = isAcquisition ? opportunities.scenarioC : opportunities.scenarioB;
  const opportunityVGV =
    comparison?.opportunityVGV ?? Math.max(winner.vgv - opportunities.scenarioA.vgv, 0);
  const hasOpportunity = opportunityVGV > 0;

  let contextLine: string;
  let constantLine: string;
  let comparisonSubtitle: string;
  let diagnosticText: string;

  if (isAcquisition) {
    const cplAtual = opportunities.scenarioA.cpl;
    contextLine = `Seu custo atual por lead é ${cplAtual !== null ? formatBRL(cplAtual) : "não calculável"}. No cenário simulado, utilizamos ${formatBRL(winner.cpl ?? DIAGNOSTIC_REFERENCES.referenceCPL)} (parâmetro de referência) para o mesmo investimento.`;
    constantLine = "Mantendo seu investimento atual.";
    comparisonSubtitle = "Mesmo investimento. Aquisição e conversão no cenário de referência.";
    diagnosticText = `Com o mesmo investimento informado, seu custo atual por lead é de ${cplAtual !== null ? formatBRL(cplAtual) : "não calculável"}. No cenário simulado, utilizando um CPL de referência de ${formatBRL(DIAGNOSTIC_REFERENCES.referenceCPL)} e uma taxa Lead → Visita de ${formatPercent(DIAGNOSTIC_REFERENCES.referenceLeadToVisit, 0)}, o mesmo investimento produziria um volume diferente de leads — mantendo sua conversão real de visita em venda, a estimativa de VGV é maior que a atual.`;
  } else {
    contextLine = `Sua taxa de Lead → Visita hoje é ${formatPercent(current.leadToVisit, 1)}. No cenário simulado, utilizamos ${formatPercent(DIAGNOSTIC_REFERENCES.referenceLeadToVisit, 0)} (parâmetro de referência).`;
    constantLine = "Mantendo seu investimento e volume de leads atuais.";
    comparisonSubtitle = "Mesma aquisição. Mais leads avançando para visita.";
    diagnosticText = `Mantendo o mesmo investimento e o mesmo volume de leads, simulamos o impacto de elevar a taxa Lead → Visita de ${formatPercent(current.leadToVisit, 1)} para ${formatPercent(DIAGNOSTIC_REFERENCES.referenceLeadToVisit, 0)} (parâmetro utilizado nesta simulação), preservando sua conversão real de visita em venda.`;
  }

  const secondaryObservation = buildSecondaryObservation(current, opportunities);

  return {
    diagnosticType: opportunities.diagnosticType,
    primaryBottleneck: isAcquisition ? "leadGeneration" : "leadToVisit",
    hasOpportunity,
    opportunityVGV: Math.max(opportunityVGV, 0),
    subheadline: hasOpportunity
      ? "Com base nos números informados, o cenário simulado aponta uma oportunidade estimada em VGV potencial/mês."
      : "Nos cenários simulados, seu funil já captura bem o volume atual de oportunidades.",
    constantLine,
    contextLine,
    comparisonTitle: "O impacto está aqui",
    comparisonSubtitle,
    diagnosticText,
    secondaryObservation,
    recommendations: isAcquisition ? [] : LEAD_TO_VISIT_HYPOTHESES,
  };
}

function buildSecondaryObservation(
  current: CurrentMetrics,
  opportunities: OpportunityAnalysis,
): string | null {
  if (opportunities.leadToVisitConfidence === "low_sample") {
    return "Com o volume informado, ainda há pouca amostra para avaliar a taxa Lead → Visita com segurança.";
  }

  const quality = opportunities.qualityNormalization;
  if (quality) {
    const comparedToAtual = quality.vgv > opportunities.scenarioA.vgv ? "maior" : "menor";
    return `Seu custo atual por lead (${formatBRL(opportunities.scenarioA.cpl ?? 0)}) está bem abaixo do parâmetro de referência (${formatBRL(DIAGNOSTIC_REFERENCES.referenceCPL)}). Isso pode indicar um volume de leads com critério de captação diferente do usado na referência — simulando o padrão de referência para esse mesmo investimento, o resultado estimado seria ${comparedToAtual} que o cenário atual, o que não prova nem descarta diferença de qualidade, apenas contextualiza o volume.`;
  }

  return null;
}

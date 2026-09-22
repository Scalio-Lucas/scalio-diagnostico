import { DIAGNOSTIC_CONFIG, SCENARIOS } from "../config";
import { formatBRL, formatDecimalValue, formatPercent } from "./format";
import type { CurrentMetrics, Diagnostic, OpportunityAnalysis, ScenarioKey } from "./types";

/**
 * Escolhe o cenário-base do simulador de Lead→Visita (BLOCO 3 / "Ver
 * diagnóstico completo"). Ferramenta de exploração independente do Scenario
 * Engine abaixo — continua funcionando exatamente como antes.
 */
export function pickInitialScenario(current: CurrentMetrics): ScenarioKey {
  const baseOrder: Exclude<ScenarioKey, "custom">[] = ["potential", "highEfficiency"];
  for (const key of baseOrder) {
    if (SCENARIOS[key].leadToVisit > current.leadToVisit) return key;
  }
  return "highEfficiency";
}

/**
 * Diagnostic Engine — traduz o veredito do Scenario Engine em texto, em
 * linguagem matemática ("cenário de referência", "estimativa", "parâmetro
 * utilizado"), nunca causal ou promissória ("você vai vender", "garantido").
 * Nunca decide sozinho se há oportunidade — isso é `analyzeOpportunities`.
 */
export function buildDiagnostic(
  current: CurrentMetrics,
  opportunities: OpportunityAnalysis,
): Diagnostic {
  if (opportunities.diagnosticType === "no_investment") {
    const text =
      "Não há investimento em marketing informado, então não é possível calcular quantos leads o cenário de referência (R$20 por lead qualificado) produziria. O diagnóstico de aquisição e conversão continua disponível para os dados já informados.";
    return {
      diagnosticType: "no_investment",
      primaryFocus: "none",
      hasOpportunity: false,
      opportunityVGV: 0,
      subheadline: "Não há investimento informado para calcular o cenário de referência.",
      constantLine: "",
      contextLine: "",
      comparisonSubtitle: "",
      diagnosticText: text,
      secondaryObservation: null,
      recommendations: [],
    };
  }

  const { reference } = opportunities;
  const { qualifiedLeadCPL, leadToVisitRate, leadToSaleRateMin, leadToSaleRateMax } =
    DIAGNOSTIC_CONFIG;
  const cplAtual = current.hasLeads ? current.cpl : null;

  const acquisitionLine =
    cplAtual === null
      ? `não há leads suficientes para calcular seu custo por lead atual`
      : opportunities.acquisitionStatus === "above_reference"
        ? `seu custo atual por lead (${formatBRL(cplAtual)}) está acima do parâmetro de ${formatBRL(qualifiedLeadCPL)} utilizado nesta simulação`
        : opportunities.acquisitionStatus === "below_reference"
          ? `seu custo atual por lead (${formatBRL(cplAtual)}) está abaixo do parâmetro de ${formatBRL(qualifiedLeadCPL)} utilizado nesta simulação`
          : `seu custo atual por lead (${formatBRL(cplAtual)}) está próximo do parâmetro de ${formatBRL(qualifiedLeadCPL)} utilizado nesta simulação`;

  const conversionLine = `hoje ${formatPercent(current.leadToVisit, 1)} dos leads chegam à visita e ${formatPercent(current.leadToSale, 1)} chegam à venda, contra os parâmetros de ${formatPercent(leadToVisitRate, 0)} e ${formatPercent(leadToSaleRateMin, 0)}–${formatPercent(leadToSaleRateMax, 0)} utilizados nesta simulação`;

  const noSalesNote = !current.hasSales
    ? "Como não há vendas registradas no período informado, esta é uma simulação baseada nos parâmetros de referência, não uma projeção a partir do histórico de vendas da operação."
    : null;

  if (opportunities.diagnosticType === "near_reference") {
    return {
      diagnosticType: "near_reference",
      primaryFocus: opportunities.primaryFocus,
      hasOpportunity: false,
      opportunityVGV: 0,
      subheadline: "Seu VGV atual está próximo do cenário de referência utilizado nesta simulação.",
      constantLine: "Mantendo seu investimento atual.",
      contextLine: `No cenário de referência, ${acquisitionLine}, e ${conversionLine}.`,
      comparisonSubtitle: "Mesmo investimento. Volume recalculado no cenário de referência.",
      diagnosticText: `Seu VGV atual está próximo do cenário de referência utilizado nesta simulação: ${acquisitionLine.charAt(0).toUpperCase()}${acquisitionLine.slice(1)}, e ${conversionLine}.`,
      secondaryObservation: noSalesNote,
      recommendations: [],
    };
  }

  if (opportunities.diagnosticType === "above_reference") {
    const betterPoints: string[] = [];
    if (opportunities.acquisitionStatus !== "above_reference")
      betterPoints.push("seu custo por lead");
    if (opportunities.leadToVisitOk) betterPoints.push("sua taxa Lead → Visita");
    if (opportunities.leadToSaleOk) betterPoints.push("sua taxa Lead → Venda");

    return {
      diagnosticType: "above_reference",
      primaryFocus: opportunities.primaryFocus,
      hasOpportunity: false,
      opportunityVGV: 0,
      subheadline: "Seu VGV atual está acima do cenário de referência utilizado neste diagnóstico.",
      constantLine: "Mantendo seu investimento atual.",
      contextLine: `No cenário de referência, ${acquisitionLine}, e ${conversionLine}.`,
      comparisonSubtitle: "Mesmo investimento. Cenário de referência para comparação.",
      diagnosticText:
        betterPoints.length > 0
          ? `Com os dados informados, ${joinList(betterPoints)} já ${betterPoints.length > 1 ? "estão" : "está"} acima do parâmetro utilizado nesta simulação — por isso seu VGV atual (${formatBRL(current.vgv)}) supera o VGV estimado no cenário de referência (${formatBRL(reference.vgvBase)}).`
          : `Com os dados informados, seu VGV atual (${formatBRL(current.vgv)}) já está acima do VGV estimado no cenário de referência (${formatBRL(reference.vgvBase)}).`,
      secondaryObservation: noSalesNote,
      recommendations: [],
    };
  }

  // opportunity
  const opportunityVGV = Math.max(opportunities.deltaVGV, 0);
  const focus = opportunities.primaryFocus;

  let diagnosticText: string;
  if (focus === "acquisition") {
    diagnosticText = `Seu principal ponto de atenção parece estar na aquisição: ${acquisitionLine}. Com o mesmo investimento, o cenário de referência recalcula o volume a partir de ${formatBRL(qualifiedLeadCPL)} por lead qualificado: ${formatDecimalValue(reference.leads)} leads projetados, ${formatDecimalValue(reference.visits)} visitas e uma faixa de ${formatDecimalValue(reference.salesMin)} a ${formatDecimalValue(reference.salesMax)} vendas esperadas (base: ${formatDecimalValue(reference.salesBase)}). Suas taxas de conversão (${conversionLine.replace("hoje ", "")}) já acompanham essa simulação.`;
  } else if (focus === "conversion") {
    diagnosticText = `Seu custo por lead já está dentro do parâmetro utilizado nesta simulação. A diferença aparece na conversão: ${conversionLine}. Mantendo o volume de leads projetados (${formatDecimalValue(reference.leads)}) neste CPL de referência, elevar essas taxas para os parâmetros utilizados resultaria em ${formatDecimalValue(reference.visits)} visitas e uma faixa de ${formatDecimalValue(reference.salesMin)} a ${formatDecimalValue(reference.salesMax)} vendas esperadas (base: ${formatDecimalValue(reference.salesBase)}).`;
  } else if (focus === "both") {
    diagnosticText = `Identificamos oportunidade em duas frentes: ${acquisitionLine}, e ${conversionLine}. No cenário de referência, o mesmo investimento produziria ${formatDecimalValue(reference.leads)} leads, ${formatDecimalValue(reference.visits)} visitas e uma faixa de ${formatDecimalValue(reference.salesMin)} a ${formatDecimalValue(reference.salesMax)} vendas esperadas (base: ${formatDecimalValue(reference.salesBase)}).`;
  } else {
    diagnosticText = `Com base nos números informados, o cenário de referência (${formatBRL(qualifiedLeadCPL)} de CPL, ${formatPercent(leadToVisitRate, 0)} de Lead → Visita e ${formatPercent(leadToSaleRateMin, 0)}–${formatPercent(leadToSaleRateMax, 0)} de Lead → Venda) aponta uma oportunidade estimada em VGV, mesmo com seus indicadores próximos dos parâmetros utilizados.`;
  }

  const constantLine =
    focus === "conversion"
      ? "Mantendo o volume de leads do cenário de referência."
      : "Mantendo seu investimento atual.";

  const comparisonSubtitle =
    focus === "acquisition"
      ? "Mesmo investimento. Volume recalculado no CPL de referência."
      : focus === "conversion"
        ? "Mesmo CPL de referência. Conversão no parâmetro utilizado."
        : "Mesmo investimento. Cenário de referência para comparação.";

  return {
    diagnosticType: "opportunity",
    primaryFocus: focus,
    hasOpportunity: opportunityVGV > 0,
    opportunityVGV,
    subheadline:
      "Com base nos números informados, o cenário de referência aponta uma oportunidade estimada em VGV potencial/mês.",
    constantLine,
    contextLine: `No cenário de referência, ${acquisitionLine}, e ${conversionLine}.`,
    comparisonSubtitle,
    diagnosticText,
    secondaryObservation: noSalesNote,
    recommendations: focus === "acquisition" ? [] : LEAD_TO_VISIT_HYPOTHESES,
  };
}

const LEAD_TO_VISIT_HYPOTHESES = [
  "velocidade de atendimento ao lead",
  "qualificação do contato antes de agendar",
  "follow-up até a confirmação da visita",
  "abordagem comercial no primeiro contato",
  "processo de agendamento",
];

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

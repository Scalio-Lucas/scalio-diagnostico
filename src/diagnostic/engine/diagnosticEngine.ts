import { DIAGNOSTIC_CONFIG } from "../config";
import { formatBRL, formatBRLDecimal, formatDecimalValue, formatPercent } from "./format";
import type { Diagnostic, Opportunity, Scenario } from "./types";

/**
 * Duas linhas fixas usadas sempre que existe um cenário de referência para
 * comparar (todo diagnosticType exceto "no_investment"). Nunca dizem "mesma
 * aquisição" ou "mesmo volume de leads" — o cenário de referência SEMPRE
 * recalcula a aquisição a partir do investimento, nunca preserva os leads
 * atuais.
 */
const CONSTANT_LINE = "Mesmo investimento. Aquisição e conversão recalculadas.";
const COMPARISON_SUBTITLE = "Veja como o mesmo investimento se comporta no cenário de referência.";

/**
 * Diagnostic Engine — traduz cenário atual + cenário de referência (min/base/
 * max) + veredito (`Opportunity`) em texto, em linguagem não causal ("cenário
 * de referência", "estimativa"), nunca promissória ("você vai vender",
 * "garantido"). Não recalcula nenhum número — só interpreta os já prontos.
 */
export function buildDiagnostic(
  current: Scenario,
  referenceBase: Scenario,
  referenceMin: Scenario,
  referenceMax: Scenario,
  opportunity: Opportunity,
): Diagnostic {
  if (opportunity.diagnosticType === "no_investment") {
    return {
      diagnosticType: "no_investment",
      primaryFocus: "none",
      hasOpportunity: false,
      opportunityVGV: 0,
      subheadline: "Não há investimento informado para calcular o cenário de referência.",
      constantLine: "",
      contextLine: "",
      comparisonSubtitle: "",
      diagnosticText:
        "Não há investimento em marketing informado, então não é possível calcular quantos leads o cenário de referência (R$20 por lead qualificado) produziria. O diagnóstico de aquisição e conversão continua disponível para os dados já informados.",
      secondaryObservation: null,
      recommendations: [],
    };
  }

  const { qualifiedLeadCPL, leadToVisitRate, leadToSaleRateMin, leadToSaleRateMax } =
    DIAGNOSTIC_CONFIG;
  const cplAtual = current.leads > 0 ? current.cpl : null;

  const acquisitionLine =
    cplAtual === null
      ? `não há leads suficientes para calcular seu custo por lead atual`
      : opportunity.acquisitionStatus === "above_reference"
        ? `seu custo atual por lead (${formatBRLDecimal(cplAtual)}) está acima do parâmetro de ${formatBRL(qualifiedLeadCPL)} utilizado nesta simulação`
        : opportunity.acquisitionStatus === "below_reference"
          ? `seu custo atual por lead (${formatBRLDecimal(cplAtual)}) está abaixo do parâmetro de ${formatBRL(qualifiedLeadCPL)} utilizado nesta simulação`
          : `seu custo atual por lead (${formatBRLDecimal(cplAtual)}) está próximo do parâmetro de ${formatBRL(qualifiedLeadCPL)} utilizado nesta simulação`;

  const conversionLine = `hoje ${formatPercent(current.leadToVisit, 1)} dos leads chegam à visita e ${formatPercent(current.leadToSale, 2)} chegam à venda, contra os parâmetros de ${formatPercent(leadToVisitRate, 0)} e ${formatPercent(leadToSaleRateMin, 0)}–${formatPercent(leadToSaleRateMax, 0)} utilizados nesta simulação`;

  const noSalesNote =
    current.sales <= 0
      ? "Como não há vendas registradas no período informado, esta é uma simulação baseada nos parâmetros de referência, não uma projeção a partir do histórico de vendas da operação."
      : null;

  if (opportunity.diagnosticType === "near_reference") {
    return {
      diagnosticType: "near_reference",
      primaryFocus: opportunity.primaryFocus,
      hasOpportunity: false,
      opportunityVGV: 0,
      subheadline: "Seu VGV atual está próximo do cenário de referência utilizado nesta simulação.",
      constantLine: CONSTANT_LINE,
      contextLine: `No cenário de referência, ${acquisitionLine}, e ${conversionLine}.`,
      comparisonSubtitle: COMPARISON_SUBTITLE,
      diagnosticText: `Seu VGV atual está próximo do cenário de referência utilizado nesta simulação: ${capitalize(acquisitionLine)}, e ${conversionLine}.`,
      secondaryObservation: noSalesNote,
      recommendations: [],
    };
  }

  if (opportunity.diagnosticType === "above_reference") {
    const betterPoints: string[] = [];
    if (opportunity.acquisitionStatus !== "above_reference")
      betterPoints.push("seu custo por lead");
    if (opportunity.leadToVisitOk) betterPoints.push("sua taxa Lead → Visita");
    if (opportunity.leadToSaleOk) betterPoints.push("sua taxa Lead → Venda");

    return {
      diagnosticType: "above_reference",
      primaryFocus: opportunity.primaryFocus,
      hasOpportunity: false,
      opportunityVGV: 0,
      subheadline: "Seu VGV atual está acima do cenário de referência utilizado neste diagnóstico.",
      constantLine: CONSTANT_LINE,
      contextLine: `No cenário de referência, ${acquisitionLine}, e ${conversionLine}.`,
      comparisonSubtitle: COMPARISON_SUBTITLE,
      diagnosticText:
        betterPoints.length > 0
          ? `Com os dados informados, ${joinList(betterPoints)} já ${betterPoints.length > 1 ? "estão" : "está"} acima do parâmetro utilizado nesta simulação — por isso seu VGV atual (${formatBRL(current.vgv)}) supera o VGV estimado no cenário de referência (${formatBRL(referenceBase.vgv)}).`
          : `Com os dados informados, seu VGV atual (${formatBRL(current.vgv)}) já está acima do VGV estimado no cenário de referência (${formatBRL(referenceBase.vgv)}).`,
      secondaryObservation: noSalesNote,
      recommendations: [],
    };
  }

  // opportunity
  const opportunityVGV = Math.max(opportunity.deltaVGV, 0);

  return {
    diagnosticType: "opportunity",
    primaryFocus: opportunity.primaryFocus,
    hasOpportunity: opportunityVGV > 0,
    opportunityVGV,
    subheadline:
      "Com base nos números informados, o cenário de referência aponta uma oportunidade estimada em VGV potencial/mês.",
    constantLine: CONSTANT_LINE,
    contextLine: `No cenário de referência, ${acquisitionLine}, e ${conversionLine}.`,
    comparisonSubtitle: COMPARISON_SUBTITLE,
    diagnosticText: buildOpportunityText(current, referenceBase, referenceMin, referenceMax),
    secondaryObservation: noSalesNote,
    recommendations: opportunity.primaryFocus === "acquisition" ? [] : LEAD_TO_VISIT_HYPOTHESES,
  };
}

/**
 * Único template textual para o caso "opportunity" — sempre contrasta o
 * cenário atual (com os leads que ele realmente tem) contra o cenário de
 * referência recalculado a partir do investimento. Nunca afirma causalidade
 * ("seus leads são ruins", "você vai vender X"), só descreve os dois cenários.
 */
function buildOpportunityText(
  current: Scenario,
  referenceBase: Scenario,
  referenceMin: Scenario,
  referenceMax: Scenario,
): string {
  const cplPart =
    current.leads > 0
      ? `a aproximadamente ${formatBRLDecimal(current.cpl)} por lead`
      : "sem custo por lead calculável";

  return (
    `Hoje sua operação gera ${formatDecimalValue(current.leads)} leads ${cplPart}, mas apenas ` +
    `${formatPercent(current.leadToVisit, 1)} avançam para visita e cerca de ${formatPercent(current.leadToSale, 2)} chegam à venda. ` +
    `No cenário de referência, não mantemos os mesmos ${formatDecimalValue(current.leads)} leads. ` +
    `Com o mesmo investimento de ${formatBRL(current.investment)} e um CPL de ${formatBRL(referenceBase.cpl)} por lead qualificado, ` +
    `projetamos aproximadamente ${formatDecimalValue(referenceBase.leads)} leads. ` +
    `Com ${formatPercent(referenceBase.leadToVisit, 0)} avançando para visita, isso representa cerca de ${formatDecimalValue(referenceBase.visits)} visitas. ` +
    `Com uma conversão Lead → Venda entre ${formatPercent(referenceMin.leadToSale, 0)} e ${formatPercent(referenceMax.leadToSale, 0)}, ` +
    `o cenário representa aproximadamente ${formatDecimalValue(referenceMin.sales)} a ${formatDecimalValue(referenceMax.sales)} vendas, ` +
    `com ${formatDecimalValue(referenceBase.sales)} vendas no cenário-base de ${formatPercent(referenceBase.leadToSale, 0)}.`
  );
}

const LEAD_TO_VISIT_HYPOTHESES = [
  "velocidade de atendimento ao lead",
  "qualificação do contato antes de agendar",
  "follow-up até a confirmação da visita",
  "abordagem comercial no primeiro contato",
  "processo de agendamento",
];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

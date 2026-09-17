import { LOW_LEADS_THRESHOLD, SCENARIOS } from "../config";
import { formatBRL, formatPercent } from "./format";
import type {
  CurrentMetrics,
  Diagnostic,
  FunnelInputs,
  OpportunityAnalysis,
  ScenarioKey,
  StageComparison,
} from "./types";

/**
 * Escolhe o cenário-base do simulador de Lead→Visita (BLOCO 3 / "Ver
 * diagnóstico completo"). Esse simulador continua existindo como está —
 * "Potencial" (20%) é o piso, só sobe para "alta eficiência" quando a própria
 * taxa atual já superar 20%. Não tem relação com qual etapa o Opportunity
 * Engine aponta como gargalo principal.
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

const VISIT_TO_SALE_HYPOTHESES = [
  "aderência entre cliente e imóvel",
  "condução comercial durante a visita",
  "follow-up pós-visita",
  "negociação e condições comerciais",
  "disponibilidade do imóvel ou financiamento",
];

const STAGE_LABEL: Record<"leadGeneration" | "leadToVisit" | "visitToSale", string> = {
  leadGeneration: "geração de oportunidades",
  leadToVisit: "conversão de lead em visita",
  visitToSale: "conversão de visita em venda",
};

/**
 * Diagnostic Engine — traduz a saída do Opportunity Engine em texto. Nunca
 * decide sozinho qual etapa é o gargalo (isso é trabalho do
 * `analyzeOpportunities`); só interpreta o veredito e escreve a respeito dele
 * em linguagem matemática, não causal (seção 34).
 */
export function buildDiagnostic(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  opportunities: OpportunityAnalysis,
  comparison: StageComparison | null,
): Diagnostic {
  const lowVolumeNote =
    inputs.leads > 0 && inputs.leads < LOW_LEADS_THRESHOLD
      ? "O volume atual de oportunidades também limita a quantidade de vendas que o funil consegue produzir."
      : null;

  switch (opportunities.diagnosticType) {
    case "no_leads":
      return {
        diagnosticType: "no_leads",
        primaryBottleneck: "leadGeneration",
        secondaryBottleneck: null,
        hasOpportunity: false,
        opportunityVGV: 0,
        subheadline:
          "Existe investimento informado, mas nenhum lead foi gerado no período. Por isso, a primeira etapa a ser investigada é a geração de oportunidades.",
        contextLine: "",
        constantLine: "",
        comparisonTitle: "",
        comparisonSubtitle: "",
        diagnosticText:
          "Existe investimento informado, mas nenhum lead foi gerado no período. Por isso, a primeira etapa a ser investigada é a geração de oportunidades.",
        secondaryObservation: null,
        recommendations: [],
      };

    case "no_visits":
      return {
        diagnosticType: "no_visits",
        primaryBottleneck: "leadToVisit",
        secondaryBottleneck: null,
        hasOpportunity: false,
        opportunityVGV: 0,
        subheadline: `Existem ${current.hasLeads ? "leads gerados" : "dados"}, mas nenhuma visita foi registrada a partir deles ainda.`,
        contextLine: "",
        constantLine: "",
        comparisonTitle: "",
        comparisonSubtitle: "",
        diagnosticText:
          "Existem leads gerados, mas nenhuma visita foi registrada a partir deles. Hoje sua taxa Lead → Visita é 0% — essa é a etapa com a maior oportunidade evidente do funil.",
        secondaryObservation: null,
        recommendations: LEAD_TO_VISIT_HYPOTHESES,
      };

    case "no_sales_history":
      return {
        diagnosticType: "no_sales_history",
        primaryBottleneck: "visitToSale",
        secondaryBottleneck: null,
        hasOpportunity: false,
        opportunityVGV: 0,
        subheadline:
          "Com os dados atuais, não há histórico suficiente de conversão de visitas em vendas para projetar VGV adicional com segurança.",
        contextLine: "",
        constantLine: "",
        comparisonTitle: "",
        comparisonSubtitle: "",
        diagnosticText: `Hoje ${formatPercent(current.leadToVisit)} dos leads chegam à visita, mas nenhuma venda foi registrada a partir desses leads ainda. Mesmo aumentando o volume de visitas, os dados atuais não permitem projetar VGV adicional enquanto não houver conversão de visitas em vendas.`,
        secondaryObservation: lowVolumeNote,
        recommendations: [],
      };

    case "volume_limited":
      return {
        diagnosticType: "volume_limited",
        primaryBottleneck: "volume",
        secondaryBottleneck: null,
        hasOpportunity: false,
        opportunityVGV: 0,
        subheadline:
          "Suas taxas atuais não indicam uma perda de eficiência relevante nos cenários analisados.",
        contextLine: "",
        constantLine: "",
        comparisonTitle: "",
        comparisonSubtitle: "",
        diagnosticText:
          "Suas taxas atuais não indicam uma grande perda de eficiência dentro dos cenários analisados. O principal limitador matemático é o volume de oportunidades entrando no funil.",
        secondaryObservation: null,
        recommendations: [],
      };

    case "no_obvious_bottleneck":
      return {
        diagnosticType: "no_obvious_bottleneck",
        primaryBottleneck: "balanced",
        secondaryBottleneck: null,
        hasOpportunity: false,
        opportunityVGV: 0,
        subheadline:
          "Nos cenários analisados, não identificamos uma perda de eficiência evidente nas principais etapas do seu funil.",
        contextLine: "",
        constantLine: "",
        comparisonTitle: "",
        comparisonSubtitle: "",
        diagnosticText:
          "Nos cenários analisados, não identificamos uma perda de eficiência evidente nas principais etapas do seu funil. O próximo crescimento pode depender de aumentar o volume de oportunidades ou investigar fatores não contemplados neste diagnóstico.",
        secondaryObservation: null,
        recommendations: [],
      };

    case "single_bottleneck":
    case "multiple_bottlenecks":
    default:
      return buildStageDiagnostic(inputs, current, opportunities, comparison, lowVolumeNote);
  }
}

function buildStageDiagnostic(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  opportunities: OpportunityAnalysis,
  comparison: StageComparison | null,
  lowVolumeNote: string | null,
): Diagnostic {
  const stage = opportunities.primaryBottleneck as "leadGeneration" | "leadToVisit" | "visitToSale";
  const opportunityVGV = comparison?.opportunityVGV ?? 0;
  const hasOpportunity = opportunityVGV > 0;

  let contextLine: string;
  let constantLine: string;
  let comparisonSubtitle: string;
  let diagnosticText: string;
  let recommendations: string[];

  if (stage === "leadGeneration") {
    const opp = opportunities.leadGeneration;
    contextLine = `Seu custo atual por lead é ${formatBRL(opp.currentValue)}. Neste cenário, simulamos ${formatBRL(opp.referenceValue)}.`;
    constantLine = "Sem aumentar seu investimento em marketing.";
    comparisonSubtitle = "Mesmo investimento. Mais oportunidades entrando no funil.";
    diagnosticText = `Sua principal oportunidade matemática aparece na geração de oportunidades. Com o investimento informado, seu custo atual por lead é de ${formatBRL(opp.currentValue)}. No cenário de referência utilizado nesta simulação, o mesmo investimento produziria um volume maior de oportunidades.`;
    recommendations = [];
  } else if (stage === "leadToVisit") {
    const opp = opportunities.leadToVisit;
    contextLine = `Sua taxa de Lead → Visita hoje é ${formatPercent(opp.currentValue, 1)}. Neste cenário, simulamos ${formatPercent(opp.referenceValue, 1)}.`;
    constantLine = "Sem aumentar sua quantidade atual de leads.";
    comparisonSubtitle = "Mesmos leads. Mais oportunidades chegando à visita.";
    diagnosticText = `A maior oportunidade matemática do seu funil está entre a geração do lead e a realização da visita. Hoje, ${leadsPer100(opp.currentValue)} de cada 100 leads chegam à visita. No cenário de referência utilizado, ${leadsPer100(opp.referenceValue)} de cada 100 chegariam.`;
    recommendations = LEAD_TO_VISIT_HYPOTHESES;
  } else {
    const opp = opportunities.visitToSale;
    contextLine = `Sua taxa de Visita → Venda hoje é ${formatPercent(opp.currentValue, 1)}. Neste cenário, simulamos ${formatPercent(opp.referenceValue, 1)}.`;
    constantLine = "Sem aumentar sua quantidade atual de visitas.";
    comparisonSubtitle = "Mesmas visitas. Mais oportunidades avançando para venda.";
    diagnosticText = `Seu funil consegue transformar leads em visitas. A maior oportunidade matemática aparece depois da visita: hoje, ${formatPercent(opp.currentValue, 1)} das visitas realizadas viram venda. No cenário de referência utilizado, essa taxa seria ${formatPercent(opp.referenceValue, 1)}.`;
    recommendations = VISIT_TO_SALE_HYPOTHESES;
  }

  // Amostra pequena (seção 17): amaciar a certeza do texto sem escondê-lo.
  const primaryOpportunity = opportunities[stage];
  const lowSampleNote =
    primaryOpportunity.confidence === "low_sample"
      ? "Com o volume informado, ainda há pouca amostra para avaliar esta etapa com segurança."
      : null;

  const secondaryStage =
    opportunities.diagnosticType === "multiple_bottlenecks"
      ? opportunities.secondaryBottleneck
      : null;
  const secondaryNote =
    secondaryStage &&
    (secondaryStage === "leadGeneration" ||
      secondaryStage === "leadToVisit" ||
      secondaryStage === "visitToSale")
      ? `Também merece atenção: ${STAGE_LABEL[secondaryStage]}.`
      : null;

  // Prioridade: amostra pequena > gargalo secundário > volume baixo — um só
  // recado por vez pra não virar relatório (seção 6).
  const secondaryObservation = lowSampleNote ?? secondaryNote ?? lowVolumeNote;

  return {
    diagnosticType: opportunities.diagnosticType,
    primaryBottleneck: stage,
    secondaryBottleneck: opportunities.secondaryBottleneck,
    hasOpportunity,
    opportunityVGV: Math.max(opportunityVGV, 0),
    subheadline: hasOpportunity
      ? "Com base nos números da sua imobiliária, identificamos uma oportunidade estimada em VGV potencial/mês."
      : "Nos cenários simulados, seu funil já captura bem o volume atual de oportunidades.",
    constantLine,
    contextLine,
    comparisonTitle: "O impacto está aqui",
    comparisonSubtitle,
    diagnosticText,
    secondaryObservation,
    recommendations,
  };
}

function leadsPer100(rate: number): number {
  return Math.round(rate * 100);
}

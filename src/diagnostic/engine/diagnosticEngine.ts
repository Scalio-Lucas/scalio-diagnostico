import { LOW_LEADS_THRESHOLD, SCENARIOS, VISIT_TO_SALE_HEALTHY } from "../config";
import { formatBRLAbbrev, formatPercent } from "./format";
import type {
  BottleneckId,
  CurrentMetrics,
  Diagnostic,
  FunnelInputs,
  ProjectedMetrics,
  ScenarioKey,
} from "./types";

/**
 * Escolhe o cenário-base do diagnóstico inicial. "Potencial" (20%) é o piso —
 * só sobe para "alta eficiência" quando a própria taxa atual já superar 20%.
 * Nunca cai para "conservador": esse fica disponível como botão manual no
 * simulador, mas não é usado como número de abertura do diagnóstico.
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
  "argumentação comercial durante a visita",
  "negociação e condições apresentadas",
  "follow-up após a visita",
  "apresentação do imóvel",
  "aderência do imóvel ao perfil do lead",
];

/** Diagnostic Engine — interpreta os números e devolve um diagnóstico pronto pra renderizar. */
export function buildDiagnostic(
  inputs: FunnelInputs,
  current: CurrentMetrics,
  projected: ProjectedMetrics,
): Diagnostic {
  const lowVolume = inputs.leads > 0 && inputs.leads < LOW_LEADS_THRESHOLD;
  const secondaryObservation = lowVolume
    ? "O volume atual de oportunidades também limita a quantidade de vendas que o funil consegue produzir."
    : null;

  // Caso E — sem histórico de vendas, não projetamos VGV a partir de uma taxa inexistente.
  if (!current.hasSales) {
    return {
      bottleneck: "no_sales_history" as BottleneckId,
      lowVolume,
      headline: "Ainda não há histórico suficiente para projetar VGV",
      subheadline:
        "Com os dados atuais, não há histórico suficiente de conversão de visitas em vendas para projetar VGV adicional com segurança.",
      diagnosticText: current.hasVisits
        ? `Hoje ${formatPercent(current.leadToVisit)} dos leads chegam à visita, mas nenhuma venda foi registrada a partir desses leads ainda. Assim que houver ao menos uma venda originada desse funil, o diagnóstico consegue projetar o impacto financeiro da melhoria de eficiência.`
        : "Ainda não há visitas nem vendas registradas a partir desses leads, então o diagnóstico por enquanto se limita às métricas de entrada do funil.",
      secondaryObservation,
      recommendations: [],
      chosenScenario: projected.scenario,
    };
  }

  const isVisitToSaleHealthy = current.visitToSale >= VISIT_TO_SALE_HEALTHY;
  const alreadyAboveScenario = projected.wasCappedByCurrent;

  let bottleneck: BottleneckId;
  let diagnosticText: string;
  let recommendations: string[];

  if (alreadyAboveScenario && isVisitToSaleHealthy) {
    // Caso C — as duas taxas já estão saudáveis nos cenários simulados.
    bottleneck = "balanced";
    diagnosticText =
      "Pelos dados fornecidos, sua operação apresenta boa eficiência matemática dentro dos cenários simulados. O próximo crescimento pode depender mais de aumentar o volume de oportunidades ou investigar outras etapas não contempladas neste diagnóstico.";
    recommendations = [];
  } else if (alreadyAboveScenario && !isVisitToSaleHealthy) {
    // Caso B — Lead→Visita já é bom, o gargalo real está depois da visita.
    bottleneck = "visit_to_sale";
    diagnosticText = `Sua taxa de geração de visitas já está acima deste cenário de simulação. A próxima oportunidade matemática pode estar em outra etapa do funil: hoje, apenas ${formatPercent(
      current.visitToSale,
    )} das visitas realizadas viram venda.`;
    recommendations = VISIT_TO_SALE_HYPOTHESES;
  } else {
    // Caso A — a maior oportunidade matemática está entre lead e visita (cenário principal do app).
    bottleneck = "lead_to_visit";
    diagnosticText = `A maior oportunidade matemática do seu funil está entre a geração do lead e a realização da visita. Hoje, ${leadsPer100(
      current.leadToVisit,
    )} de cada 100 leads chegam à visita. No cenário simulado, ${leadsPer100(
      projected.leadToVisitProjected,
    )} de cada 100 chegariam.`;
    recommendations = LEAD_TO_VISIT_HYPOTHESES;
  }

  const headline = projected.hasProjectableSales
    ? `+${formatBRLAbbrev(Math.max(projected.opportunityVGV, 0))}`
    : "Sem oportunidade adicional neste cenário";
  const subheadline =
    projected.opportunityVGV > 0
      ? "Com base nos números da sua imobiliária, identificamos uma oportunidade estimada em VGV potencial/mês."
      : "Nos cenários simulados, seu funil já captura bem o volume atual de leads.";

  return {
    bottleneck,
    lowVolume,
    headline,
    subheadline,
    diagnosticText,
    secondaryObservation,
    recommendations,
    chosenScenario: projected.scenario,
  };
}

function leadsPer100(rate: number): number {
  return Math.round(rate * 100);
}

import type { ScenarioDefinition, ScenarioKey } from "./engine/types";

// Parâmetros internos de simulação — NÃO são benchmarks garantidos de mercado.
// Centralizados aqui para poderem ser recalibrados sem tocar na lógica do motor.
export const SCENARIOS: Record<Exclude<ScenarioKey, "custom">, ScenarioDefinition> = {
  conservative: { key: "conservative", label: "Conservador", leadToVisit: 0.1 },
  potential: { key: "potential", label: "Potencial", leadToVisit: 0.2 },
  highEfficiency: { key: "highEfficiency", label: "Alta eficiência", leadToVisit: 0.25 },
};

export const SCENARIO_ORDER: Exclude<ScenarioKey, "custom">[] = [
  "conservative",
  "potential",
  "highEfficiency",
];

// Faixa livre do simulador pós-diagnóstico.
export const SIMULATOR_DEFAULT_CEILING = 0.3;
export const SIMULATOR_ABSOLUTE_CEILING = 0.6;

// Abaixo disso o volume de oportunidades (leads) já limita o funil,
// independente da eficiência de conversão.
export const LOW_LEADS_THRESHOLD = 50;

// Limiares usados só para redigir o diagnóstico (não afetam o cálculo).
export const LEAD_TO_VISIT_HEALTHY = 0.2;
export const VISIT_TO_SALE_HEALTHY = 0.2;

/**
 * Parâmetros de REFERÊNCIA do motor de cenários — não são benchmarks de
 * mercado nem resultado garantido, só os números usados internamente para
 * montar o Cenário C (aquisição normalizada + conversão). Centralizados aqui
 * para poderem ser recalibrados sem tocar em nenhuma fórmula.
 *
 * Importante: NÃO existe referência para Visita → Venda — essa taxa é
 * sempre a real, informada pelo usuário, em todo cenário.
 */
export const DIAGNOSTIC_REFERENCES = {
  referenceCPL: 20,
  referenceLeadToVisit: 0.06,
};

/**
 * Dispara o "cenário de normalização de qualidade": quando o CPL atual está
 * abaixo desta fração do CPL de referência (ex.: 0.5 = menos da metade) E a
 * taxa Lead→Visita está abaixo da referência, o volume barato de leads pode
 * indicar critério de captação diferente do usado na referência. Nesse caso
 * o motor também calcula (só para explicar, nunca como cenário principal) o
 * que aconteceria adotando o CPL de referência mesmo sendo "pior" numérico.
 */
export const LOW_CPL_RATIO = 0.5;

// Abaixo deste número de eventos (leads para a taxa Lead→Visita, visitas para
// Visita→Venda), a taxa calculada é tratada como amostra pequena e o texto do
// diagnóstico fica mais cauteloso — nunca escondido, só menos categórico.
export const SAMPLE_SIZE_THRESHOLDS = {
  low: 10,
  usable: 30,
};

// Abaixo deste valor, uma oportunidade incremental de VGV é tratada como
// "nenhuma" (evita apontar um gargalo por causa de ruído de arredondamento).
export const MEANINGFUL_OPPORTUNITY_VGV = 1;

export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/Cn2VWBtUgEw0ZrIyCh2JBZ";

// Data/horário da próxima aula ao vivo. Deixe em branco para ocultar essa
// linha no CTA (ex.: enquanto a próxima turma ainda não está agendada).
export const LIVE_CLASS_DATE = "";
export const LIVE_CLASS_TIME = "";

export const TOTAL_QUESTIONS = 6;

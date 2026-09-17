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

export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/SEU-LINK-AQUI";

// Data/horário da próxima aula ao vivo. Deixe em branco para ocultar essa
// linha no CTA (ex.: enquanto a próxima turma ainda não está agendada).
export const LIVE_CLASS_DATE = "";
export const LIVE_CLASS_TIME = "";

export const TOTAL_QUESTIONS = 6;

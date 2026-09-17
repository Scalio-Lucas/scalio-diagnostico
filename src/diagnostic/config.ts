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
 * Cenários/parâmetros de REFERÊNCIA usados pelo Opportunity Engine para
 * comparar cada etapa do funil entre si (seção 3 do briefing). São parâmetros
 * de simulação internos, não benchmarks de mercado — por isso a interface
 * usa termos como "cenário de referência" / "parâmetro utilizado nesta
 * simulação", nunca "média do mercado".
 *
 * `leadToVisit` reaproveita o cenário "potencial" já usado no simulador
 * (mesma fonte de verdade, sem duplicar o número).
 */
export const DIAGNOSTIC_REFERENCES = {
  leadGeneration: {
    // R$ por lead — trocar aqui se/quando houver uma referência real.
    referenceCPL: 50,
  },
  leadToVisit: {
    referenceRate: SCENARIOS.potential.leadToVisit,
  },
  visitToSale: {
    referenceRate: 0.2,
  },
};

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

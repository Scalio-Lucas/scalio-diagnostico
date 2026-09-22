/**
 * Configuração central do motor de diagnóstico — cenário de referência
 * operacional, NÃO uma média de mercado nem um resultado garantido. Toda
 * fórmula do motor lê os números daqui; nada deve ficar hardcoded em
 * componente ou função nenhuma.
 */
export const DIAGNOSTIC_CONFIG = {
  /** R$ por lead qualificado no cenário de referência. */
  qualifiedLeadCPL: 20,
  /** Taxa Lead → Visita do cenário de referência. */
  leadToVisitRate: 0.2,
  /** Faixa Lead → Venda do cenário de referência — nunca um único número. */
  leadToSaleRateMin: 0.04,
  leadToSaleRateBase: 0.05,
  leadToSaleRateMax: 0.06,
};

// Dentro desta margem (para mais ou para menos) em torno do CPL de
// referência, o CPL atual é tratado como "próximo da referência" em vez de
// "acima" ou "abaixo" dela.
export const CPL_NEAR_TOLERANCE = 0.15;

// Se a diferença entre VGV atual e VGV de referência (base) for menor que
// esta fração do maior dos dois valores, tratamos como "sem diferença
// relevante" em vez de forçar uma leitura de oportunidade ou de perda.
export const VGV_NEAR_TOLERANCE = 0.05;

export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/Cn2VWBtUgEw0ZrIyCh2JBZ";

// Data/horário da próxima aula ao vivo. Deixe em branco para ocultar essa
// linha no CTA (ex.: enquanto a próxima turma ainda não está agendada).
export const LIVE_CLASS_DATE = "";
export const LIVE_CLASS_TIME = "";

export const TOTAL_QUESTIONS = 6;

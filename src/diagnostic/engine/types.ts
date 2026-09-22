// Single source of truth for the diagnostic's shape. UI components only ever
// render fields from these types — no component computes a metric itself.

export interface FunnelInputs {
  /** I — investimento mensal em marketing (R$) */
  investment: number;
  /** L — leads gerados por mês */
  leads: number;
  /** V — visitas realizadas por mês (V <= L) */
  visits: number;
  /** S — vendas originadas desses leads (S <= V) */
  sales: number;
  /** T — ticket médio dos imóveis vendidos (R$) */
  ticket: number;
  /** C — percentual de comissão retido pela imobiliária (0-10) */
  commission: number;
}

/**
 * Formato ÚNICO usado tanto pelo cenário atual quanto pelo cenário de
 * referência. Toda a interface consome exclusivamente objetos deste tipo —
 * nenhum componente reconstrói nenhuma dessas fórmulas por conta própria.
 */
export interface Scenario {
  investment: number;
  cpl: number;
  leads: number;
  leadToVisit: number;
  visits: number;
  leadToSale: number;
  sales: number;
  visitToSale: number;
  vgv: number;
}

/** Parâmetros que definem um cenário de referência — sempre os mesmos entre min/base/max, exceto `leadToSale`. */
export interface ReferenceParams {
  cpl: number;
  leadToVisit: number;
  leadToSale: number;
}

/** Como o CPL atual se compara ao CPL de referência configurado. */
export type AcquisitionStatus =
  "above_reference" | "near_reference" | "below_reference" | "not_calculable";

/** Onde a diferença entre VGV atual e VGV de referência aponta. */
export type DiagnosticType = "no_investment" | "opportunity" | "near_reference" | "above_reference";

/** Qual eixo do funil o texto do diagnóstico deve destacar. */
export type PrimaryFocus = "acquisition" | "conversion" | "both" | "none";

/** Veredito da comparação Hoje × Cenário de referência (base) — não recalcula nada. */
export interface Opportunity {
  acquisitionStatus: AcquisitionStatus;
  leadToVisitOk: boolean;
  leadToSaleOk: boolean;
  primaryFocus: PrimaryFocus;
  /** VGV_referência(base) − VGV_atual. Pode ser negativo — nunca é forçado a positivo aqui. */
  deltaVGV: number;
  diagnosticType: DiagnosticType;
}

export interface Diagnostic {
  diagnosticType: DiagnosticType;
  primaryFocus: PrimaryFocus;
  hasOpportunity: boolean;
  opportunityVGV: number;
  /** Linha de fallback do BLOCO 1 quando não há oportunidade a destacar. */
  subheadline: string;
  /** O que fica constante/recalculado na simulação — linha curta do BLOCO 1. */
  constantLine: string;
  /** Linha de contexto dinâmica do BLOCO 1. */
  contextLine: string;
  comparisonSubtitle: string;
  diagnosticText: string;
  secondaryObservation: string | null;
  recommendations: string[];
}

export interface DiagnosticRecord {
  investment: number;
  leads: number;
  visits: number;
  sales: number;
  ticket: number;
  commission: number;
  currentCpl: number;
  currentLeadToVisitPct: number;
  currentVisitToSalePct: number;
  currentLeadToSalePct: number;
  currentVgv: number;
  currentRevenue: number;
  referenceCpl: number;
  referenceLeads: number;
  referenceVisits: number;
  referenceSales: number;
  referenceVgv: number;
  opportunityVGV: number;
  dataHora: string;
}

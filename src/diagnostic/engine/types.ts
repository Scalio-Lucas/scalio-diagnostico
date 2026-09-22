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

export interface CurrentMetrics {
  cpl: number;
  leadToVisit: number;
  leadToVisitPct: number;
  visitToSale: number;
  visitToSalePct: number;
  leadToSale: number;
  leadToSalePct: number;
  costPerVisit: number;
  costPerSale: number;
  vgv: number;
  revenue: number;
  hasLeads: boolean;
  hasVisits: boolean;
  hasSales: boolean;
}

export type ScenarioKey = "conservative" | "potential" | "highEfficiency" | "custom";

export interface ScenarioDefinition {
  key: ScenarioKey;
  label: string;
  leadToVisit: number;
}

export interface ProjectedMetrics {
  scenario: ScenarioKey;
  leadToVisitInput: number;
  leadToVisitProjected: number;
  wasCappedByCurrent: boolean;
  visitsPotential: number;
  visitToSale: number;
  salesPotential: number;
  hasProjectableSales: boolean;
  vgvPotential: number;
  revenuePotential: number;
  opportunityVGV: number;
  opportunityRevenue: number;
}

/** Como o CPL atual se compara ao CPL de referência configurado. */
export type AcquisitionStatus =
  "above_reference" | "near_reference" | "below_reference" | "not_calculable";

/** Onde a diferença entre VGV atual e VGV de referência aponta. */
export type DiagnosticType = "no_investment" | "opportunity" | "near_reference" | "above_reference";

/** Qual eixo do funil o texto do diagnóstico deve destacar. */
export type PrimaryFocus = "acquisition" | "conversion" | "both" | "none";

export interface FunnelSnapshot {
  leads: number;
  visits: number;
  sales: number;
  vgv: number;
}

/**
 * Cenário de referência — SEMPRE recalculado a partir do investimento e dos
 * parâmetros de `DIAGNOSTIC_CONFIG`, nunca a partir do volume atual de leads.
 * `visits`/`sales*` usam a taxa de referência diretamente (Lead→Venda não
 * depende da Visita→Venda histórica do cliente).
 */
export interface ReferenceScenario {
  cpl: number;
  leads: number;
  leadToVisit: number;
  visits: number;
  /** Visita→Venda implícita nas referências (leadToSaleRateBase / leadToVisitRate) — só para exibição coerente. */
  impliedVisitToSale: number;
  leadToSaleMin: number;
  leadToSaleBase: number;
  leadToSaleMax: number;
  salesMin: number;
  salesBase: number;
  salesMax: number;
  vgvMin: number;
  vgvBase: number;
  vgvMax: number;
}

/** Saída do Scenario Engine — cenário de referência + veredito honesto. */
export interface OpportunityAnalysis {
  reference: ReferenceScenario;
  acquisitionStatus: AcquisitionStatus;
  leadToVisitOk: boolean;
  leadToSaleOk: boolean;
  primaryFocus: PrimaryFocus;
  /** VGV_referência(base) − VGV_atual. Pode ser negativo — nunca é forçado a positivo aqui. */
  deltaVGV: number;
  diagnosticType: DiagnosticType;
}

/** Comparação Hoje × Cenário de referência pronta para o BLOCO 2. */
export interface StageComparison {
  today: FunnelSnapshot;
  scenario: FunnelSnapshot;
  leadToVisitToday: number;
  leadToVisitScenario: number;
  visitToSaleToday: number;
  visitToSaleScenario: number;
  opportunityVGV: number;
  /** CPL é sempre a métrica em destaque no conector — quem muda o volume agora. */
  primaryMetricKind: "currency" | "percent";
  primaryMetricToday: number;
  primaryMetricScenario: number;
}

export interface Diagnostic {
  diagnosticType: DiagnosticType;
  primaryFocus: PrimaryFocus;
  hasOpportunity: boolean;
  opportunityVGV: number;
  /** Linha de fallback do BLOCO 1 quando não há oportunidade a destacar. */
  subheadline: string;
  /** "Mantendo seu investimento atual." — o que fica constante na simulação. */
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
  cpl: number;
  costPerVisit: number;
  costPerSale: number;
  leadToVisitPct: number;
  visitToSalePct: number;
  leadToSalePct: number;
  vgvAtual: number;
  receitaAtual: number;
  cenarioUtilizado: ScenarioKey;
  taxaProjetada: number;
  visitasPotenciais: number;
  vendasPotenciais: number;
  vgvPotencial: number;
  diferencaVGV: number;
  receitaPotencial: number;
  diferencaReceita: number;
  dataHora: string;
}

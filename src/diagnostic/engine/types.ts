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

/** Uma etapa do funil que o Opportunity Engine sabe isolar e comparar. */
export type StageKey = "leadGeneration" | "leadToVisit" | "visitToSale";

/** Qual etapa (ou ausência de etapa) o diagnóstico aponta como gargalo. */
export type BottleneckId = StageKey | "volume" | "balanced";

/**
 * Classificação de alto nível do diagnóstico — determina qual copy/layout o
 * resultado usa. Ver seções 12, 18-21 do briefing do Opportunity Engine.
 */
export type DiagnosticType =
  | "no_leads"
  | "no_visits"
  | "no_sales_history"
  | "single_bottleneck"
  | "multiple_bottlenecks"
  | "volume_limited"
  | "no_obvious_bottleneck";

/**
 * Quão confiável é a taxa observada, dado o tamanho da amostra que a gerou
 * (seção 17). Nunca exibido literalmente ao usuário — só amacia o texto.
 */
export type SampleConfidence =
  "low_sample" | "usable_sample" | "stronger_sample" | "not_applicable";

export interface FunnelSnapshot {
  leads: number;
  visits: number;
  sales: number;
  vgv: number;
}

/**
 * Resultado de isolar UMA etapa do funil: todo o resto (investimento, as
 * outras taxas) permanece nos valores atuais — nunca soma melhorias (seção 13).
 */
export interface StageOpportunity {
  eligible: boolean;
  confidence: SampleConfidence;
  /** CPL (R$) para leadGeneration; taxa 0-1 para leadToVisit/visitToSale. */
  currentValue: number;
  referenceValue: number;
  /** true quando o valor atual já é igual ou melhor que a referência. */
  isAboveReference: boolean;
  today: FunnelSnapshot;
  scenario: FunnelSnapshot;
  incrementalVGV: number;
}

export interface VolumeAssessment {
  status: "limited" | "adequate";
}

/** Saída do Opportunity Engine — análise das 3 etapas + veredito. */
export interface OpportunityAnalysis {
  leadGeneration: StageOpportunity;
  leadToVisit: StageOpportunity;
  visitToSale: StageOpportunity;
  volume: VolumeAssessment;
  primaryBottleneck: BottleneckId | null;
  secondaryBottleneck: BottleneckId | null;
  diagnosticType: DiagnosticType;
}

/**
 * Comparação Hoje × Cenário pronta para o BLOCO 2, já isolada na etapa
 * escolhida como `primaryBottleneck` (seções 26-30).
 */
export interface StageComparison {
  stage: StageKey;
  today: FunnelSnapshot;
  scenario: FunnelSnapshot;
  leadToVisitToday: number;
  leadToVisitScenario: number;
  visitToSaleToday: number;
  visitToSaleScenario: number;
  opportunityVGV: number;
  /** Métrica que a etapa isolada varia — CPL (R$) ou uma taxa (0-1). */
  primaryMetricKind: "currency" | "percent";
  primaryMetricToday: number;
  primaryMetricScenario: number;
}

export interface Diagnostic {
  diagnosticType: DiagnosticType;
  primaryBottleneck: BottleneckId | null;
  secondaryBottleneck: BottleneckId | null;
  hasOpportunity: boolean;
  opportunityVGV: number;
  /** Linha de fallback do BLOCO 1 quando não há oportunidade a destacar. */
  subheadline: string;
  /** "Sem aumentar X" — o que fica constante na simulação (varia por etapa). */
  constantLine: string;
  /** Linha de contexto dinâmica do BLOCO 1 (ex.: "Seu CPL hoje é..."). */
  contextLine: string;
  /** Título/subtítulo do BLOCO 2, adaptados à etapa em destaque. */
  comparisonTitle: string;
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

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

export type BottleneckId =
  "lead_to_visit" | "visit_to_sale" | "balanced" | "low_volume" | "no_sales_history";

export interface Diagnostic {
  bottleneck: BottleneckId;
  lowVolume: boolean;
  headline: string;
  subheadline: string;
  diagnosticText: string;
  secondaryObservation: string | null;
  recommendations: string[];
  chosenScenario: ScenarioKey;
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

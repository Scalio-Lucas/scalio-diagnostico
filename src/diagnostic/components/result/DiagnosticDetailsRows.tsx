import type { ReactNode } from "react";
import { MEANINGFUL_OPPORTUNITY_VGV } from "../../config";
import {
  formatBRL,
  formatBRLAbbrev,
  formatPercent,
  formatSignedBRLAbbrev,
} from "../../engine/format";
import type {
  CurrentMetrics,
  FunnelInputs,
  OpportunityAnalysis,
  StageOpportunity,
} from "../../engine/types";

interface DiagnosticDetailsRowsProps {
  inputs: FunnelInputs;
  current: CurrentMetrics;
  opportunities: OpportunityAnalysis;
}

/**
 * Quebra completa por etapa (seção 32) — investimento→leads, leads→visitas,
 * visitas→vendas e vendas→VGV, cada uma com seu próprio status. A comissão
 * nunca aparece aqui como candidata a gargalo, só como variável financeira.
 */
export function DiagnosticDetailsRows({
  inputs,
  current,
  opportunities,
}: DiagnosticDetailsRowsProps) {
  return (
    <div className="space-y-4">
      <StageSection title="Investimento → Leads" opportunity={opportunities.leadGeneration}>
        <Row label="CPL atual" value={formatBRL(opportunities.leadGeneration.currentValue)} />
        <Row
          label="Cenário de referência"
          value={`${formatBRL(opportunities.leadGeneration.referenceValue)}/lead`}
        />
      </StageSection>

      <StageSection title="Leads → Visitas" opportunity={opportunities.leadToVisit}>
        <Row label="Taxa atual" value={formatPercent(opportunities.leadToVisit.currentValue, 1)} />
        <Row
          label="Cenário de referência"
          value={formatPercent(opportunities.leadToVisit.referenceValue, 1)}
        />
      </StageSection>

      <StageSection title="Visitas → Vendas" opportunity={opportunities.visitToSale}>
        <Row label="Taxa atual" value={formatPercent(opportunities.visitToSale.currentValue, 1)} />
        <Row
          label="Cenário de referência"
          value={formatPercent(opportunities.visitToSale.referenceValue, 1)}
        />
      </StageSection>

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Vendas → VGV
        </p>
        <Row label="Ticket médio" value={formatBRL(inputs.ticket)} />
        <Row label="VGV atual" value={formatBRLAbbrev(current.vgv)} />
        <Row label="Receita bruta estimada atual" value={formatBRLAbbrev(current.revenue)} />
      </div>

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <Row label="Custo por lead (CPL)" value={formatBRL(current.cpl)} />
        <Row label="Custo por visita" value={formatBRL(current.costPerVisit)} />
        <Row label="Custo de mídia por venda" value={formatBRL(current.costPerSale)} />
      </div>

      <p className="text-xs text-muted-foreground">
        Os cenários de referência são parâmetros desta simulação, não benchmarks garantidos de
        mercado. A comissão é usada apenas para calcular receita, nunca como possível gargalo.
      </p>
    </div>
  );
}

function StageSection({
  title,
  opportunity,
  children,
}: {
  title: string;
  opportunity: StageOpportunity;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-[color:var(--color-border)] pt-4 first:border-t-0 first:pt-0">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {children}
      <p className="mt-1.5 text-xs text-muted-foreground">{stageStatusText(opportunity)}</p>
    </div>
  );
}

function stageStatusText(opportunity: StageOpportunity): string {
  if (!opportunity.eligible) return "Dados insuficientes para avaliar esta etapa.";
  if (opportunity.incrementalVGV > MEANINGFUL_OPPORTUNITY_VGV) {
    return `Oportunidade estimada: ${formatSignedBRLAbbrev(opportunity.incrementalVGV)}/mês em VGV.`;
  }
  return "Já dentro do cenário de referência utilizado nesta simulação.";
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-display text-sm font-bold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

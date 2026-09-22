import { DIAGNOSTIC_REFERENCES } from "../../config";
import { formatBRL, formatBRLAbbrev, formatDecimalValue, formatPercent } from "../../engine/format";
import type {
  CurrentMetrics,
  FunnelInputs,
  OpportunityAnalysis,
  ScenarioResult,
} from "../../engine/types";

interface DiagnosticDetailsRowsProps {
  inputs: FunnelInputs;
  current: CurrentMetrics;
  opportunities: OpportunityAnalysis;
}

/**
 * Mostra a cadeia completa (Investimento→CPL→Leads→Lead→Visita→Visitas→
 * Visita→Venda→Vendas→VGV) do cenário atual e, quando houver, do cenário
 * simulado — para não esconder de onde vem nenhum número (seção "não mostrar
 * apenas o resultado final"). A comissão nunca aparece como possível gargalo,
 * só como variável financeira na receita bruta estimada.
 */
export function DiagnosticDetailsRows({
  inputs,
  current,
  opportunities,
}: DiagnosticDetailsRowsProps) {
  const { scenarioA, qualityNormalization, recommended } = opportunities;
  const winner = recommended === "C" ? opportunities.scenarioC : opportunities.scenarioB;
  const winnerLabel =
    recommended === "C"
      ? "Cenário simulado — aquisição e conversão de referência"
      : "Cenário simulado — mesma aquisição, conversão de referência";

  return (
    <div className="space-y-4">
      <ScenarioChain title="Cenário atual" scenario={scenarioA} />

      {recommended !== "A" ? (
        <ScenarioChain title={winnerLabel} scenario={winner} highlight />
      ) : (
        <p className="border-t border-[color:var(--color-border)] pt-4 text-xs text-muted-foreground">
          Nenhum cenário simulado com os parâmetros de referência atuais (
          {formatBRL(DIAGNOSTIC_REFERENCES.referenceCPL)} de CPL e{" "}
          {formatPercent(DIAGNOSTIC_REFERENCES.referenceLeadToVisit, 0)} de Lead → Visita) supera o
          cenário atual.
        </p>
      )}

      {qualityNormalization ? (
        <div className="border-t border-[color:var(--color-border)] pt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cenário de normalização de qualidade (explicativo)
          </p>
          <p className="mb-2 text-xs text-muted-foreground">
            Adota o CPL de referência mesmo sendo maior que o atual, só para ilustrar o trade-off
            entre volume barato e o padrão usado na simulação.
          </p>
          <ScenarioChain scenario={qualityNormalization} compact />
        </div>
      ) : null}

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <Row label="Ticket médio" value={formatBRL(inputs.ticket)} />
        <Row label="Receita bruta estimada atual" value={formatBRLAbbrev(current.revenue)} />
        {recommended !== "A" ? (
          <Row
            label="Receita bruta estimada no cenário simulado"
            value={formatBRLAbbrev(winner.vgv * (inputs.commission / 100))}
          />
        ) : null}
      </div>

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <Row
          label="Custo por lead (CPL)"
          value={current.hasLeads ? formatBRL(current.cpl) : "não calculável"}
        />
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

function ScenarioChain({
  title,
  scenario,
  highlight,
  compact,
}: {
  title?: string;
  scenario: ScenarioResult;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? ""
          : "border-t border-[color:var(--color-border)] pt-4 first:border-t-0 first:pt-0"
      }
    >
      {title ? (
        <p
          className={`mb-2 text-xs font-semibold uppercase tracking-wide ${
            highlight ? "text-[color:var(--electric-bright)]" : "text-muted-foreground"
          }`}
        >
          {title}
        </p>
      ) : null}
      <Row label="CPL" value={scenario.cpl !== null ? formatBRL(scenario.cpl) : "não calculável"} />
      <Row label="Leads" value={formatDecimalValue(scenario.leads)} />
      <Row label="Lead → Visita" value={formatPercent(scenario.leadToVisit, 1)} />
      <Row label="Visitas" value={formatDecimalValue(scenario.visits)} />
      <Row label="Visita → Venda" value={formatPercent(scenario.visitToSale, 1)} />
      <Row label="Vendas" value={formatDecimalValue(scenario.sales)} />
      <Row label="VGV" value={formatBRLAbbrev(scenario.vgv)} highlight={highlight} />
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`font-display text-sm font-bold tabular-nums ${
          highlight ? "text-[color:var(--electric-bright)]" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

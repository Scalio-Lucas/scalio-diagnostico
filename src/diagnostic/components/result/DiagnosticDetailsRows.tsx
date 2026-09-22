import { DIAGNOSTIC_CONFIG } from "../../config";
import { formatBRL, formatBRLAbbrev, formatDecimalValue, formatPercent } from "../../engine/format";
import type { CurrentMetrics, FunnelInputs, OpportunityAnalysis } from "../../engine/types";

interface DiagnosticDetailsRowsProps {
  inputs: FunnelInputs;
  current: CurrentMetrics;
  opportunities: OpportunityAnalysis;
}

/**
 * Mostra a cadeia completa (Investimento→CPL→Leads→Lead→Visita→Visitas→
 * Lead→Venda→Vendas→VGV) do cenário atual e do cenário de referência, mais a
 * faixa mínimo/base/máximo de Lead→Venda — para não esconder de onde vem
 * nenhum número. A comissão nunca aparece como possível gargalo, só como
 * variável financeira na receita bruta estimada.
 */
export function DiagnosticDetailsRows({
  inputs,
  current,
  opportunities,
}: DiagnosticDetailsRowsProps) {
  const { reference } = opportunities;
  const {
    qualifiedLeadCPL,
    leadToVisitRate,
    leadToSaleRateMin,
    leadToSaleRateBase,
    leadToSaleRateMax,
  } = DIAGNOSTIC_CONFIG;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cenário atual
        </p>
        <Row label="Investimento" value={formatBRL(inputs.investment)} />
        <Row label="CPL" value={current.hasLeads ? formatBRL(current.cpl) : "não calculável"} />
        <Row label="Leads" value={formatDecimalValue(inputs.leads)} />
        <Row label="Lead → Visita" value={formatPercent(current.leadToVisit, 1)} />
        <Row label="Visitas" value={formatDecimalValue(inputs.visits)} />
        <Row label="Lead → Venda" value={formatPercent(current.leadToSale, 2)} />
        <Row label="Vendas" value={formatDecimalValue(inputs.sales)} />
        <Row label="VGV" value={formatBRLAbbrev(current.vgv)} />
      </div>

      {opportunities.diagnosticType !== "no_investment" ? (
        <div className="border-t border-[color:var(--color-border)] pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--electric-bright)]">
            Cenário de referência
          </p>
          <Row label="Mesmo investimento" value={formatBRL(inputs.investment)} />
          <Row label="CPL utilizado" value={formatBRL(reference.cpl)} />
          <Row label="Leads projetados" value={formatDecimalValue(reference.leads)} />
          <Row label="Lead → Visita" value={formatPercent(reference.leadToVisit, 0)} />
          <Row label="Visitas projetadas" value={formatDecimalValue(reference.visits)} />
          <Row label="Lead → Venda (base)" value={formatPercent(leadToSaleRateBase, 0)} />
          <Row label="Vendas esperadas" value={formatDecimalValue(reference.salesBase)} />
          <Row label="VGV esperado" value={formatBRLAbbrev(reference.vgvBase)} highlight />

          <p className="mb-1 mt-4 text-xs text-muted-foreground">
            Considerando uma conversão Lead → Venda entre {formatPercent(leadToSaleRateMin, 0)} e{" "}
            {formatPercent(leadToSaleRateMax, 0)}:
          </p>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-black/15 p-3">
            <RangeStat
              label={`Mínimo (${formatPercent(leadToSaleRateMin, 0)})`}
              sales={reference.salesMin}
              vgv={reference.vgvMin}
            />
            <RangeStat
              label={`Base (${formatPercent(leadToSaleRateBase, 0)})`}
              sales={reference.salesBase}
              vgv={reference.vgvBase}
            />
            <RangeStat
              label={`Máximo (${formatPercent(leadToSaleRateMax, 0)})`}
              sales={reference.salesMax}
              vgv={reference.vgvMax}
            />
          </div>
        </div>
      ) : null}

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <Row label="Ticket médio" value={formatBRL(inputs.ticket)} />
        <Row label="Receita bruta estimada atual" value={formatBRLAbbrev(current.revenue)} />
        {opportunities.diagnosticType !== "no_investment" ? (
          <Row
            label="Receita bruta estimada no cenário de referência"
            value={formatBRLAbbrev(reference.vgvBase * (inputs.commission / 100))}
          />
        ) : null}
      </div>

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <Row
          label="Custo por lead (CPL)"
          value={current.hasLeads ? formatBRL(current.cpl) : "não calculável"}
        />
        <Row
          label="Custo por visita"
          value={current.hasVisits ? formatBRL(current.costPerVisit) : "não calculável"}
        />
        <Row
          label="Custo de mídia por venda"
          value={current.hasSales ? formatBRL(current.costPerSale) : "não calculável"}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Parâmetros de referência utilizados nesta simulação: {formatBRL(qualifiedLeadCPL)} de CPL de
        lead qualificado, {formatPercent(leadToVisitRate, 0)} de Lead → Visita e{" "}
        {formatPercent(leadToSaleRateMin, 0)}–{formatPercent(leadToSaleRateMax, 0)} de Lead → Venda.
        Não são benchmarks garantidos de mercado nem médias do setor — só os parâmetros usados nesta
        simulação. A comissão é usada apenas para calcular receita, nunca como possível gargalo.
      </p>
    </div>
  );
}

function RangeStat({ label, sales, vgv }: { label: string; sales: number; vgv: number }) {
  return (
    <div className="text-center">
      <p className="font-display text-sm font-bold tabular-nums text-foreground">
        {formatBRLAbbrev(vgv)}
      </p>
      <p className="text-[0.65rem] text-muted-foreground">{formatDecimalValue(sales)} vendas</p>
      <p className="mt-0.5 text-[0.6rem] uppercase tracking-wide text-muted-foreground/80">
        {label}
      </p>
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

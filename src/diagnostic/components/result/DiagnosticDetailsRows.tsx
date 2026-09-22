import { DIAGNOSTIC_CONFIG } from "../../config";
import {
  formatBRL,
  formatBRLAbbrev,
  formatBRLDecimal,
  formatDecimalValue,
  formatPercent,
} from "../../engine/format";
import type { FunnelInputs, Scenario } from "../../engine/types";

interface DiagnosticDetailsRowsProps {
  inputs: FunnelInputs;
  current: Scenario;
  referenceBase: Scenario;
  referenceMin: Scenario;
  referenceMax: Scenario;
}

/**
 * Mostra a cadeia completa (Investimento→CPL→Leads→Lead→Visita→Visitas→
 * Lead→Venda→Vendas→VGV) do cenário atual e do cenário de referência, mais a
 * faixa mínimo/base/máximo de Lead→Venda — para não esconder de onde vem
 * nenhum número. Só existem DUAS bases aqui (atual e referência); nunca um
 * terceiro cenário misto. A comissão nunca aparece como possível gargalo, só
 * como variável financeira na receita bruta estimada.
 */
export function DiagnosticDetailsRows({
  inputs,
  current,
  referenceBase,
  referenceMin,
  referenceMax,
}: DiagnosticDetailsRowsProps) {
  const hasReference = inputs.investment > 0;
  const {
    qualifiedLeadCPL,
    leadToVisitRate,
    leadToSaleRateMin,
    leadToSaleRateBase,
    leadToSaleRateMax,
  } = DIAGNOSTIC_CONFIG;

  const currentRevenue = current.vgv * (inputs.commission / 100);
  const referenceRevenue = referenceBase.vgv * (inputs.commission / 100);
  const costPerVisit = current.visits > 0 ? current.investment / current.visits : null;
  const costPerSale = current.sales > 0 ? current.investment / current.sales : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cenário atual
        </p>
        <Row label="Investimento" value={formatBRL(current.investment)} />
        <Row
          label="CPL"
          value={current.leads > 0 ? formatBRLDecimal(current.cpl) : "não calculável"}
        />
        <Row label="Leads" value={formatDecimalValue(current.leads)} />
        <Row label="Lead → Visita" value={formatPercent(current.leadToVisit, 1)} />
        <Row label="Visitas" value={formatDecimalValue(current.visits)} />
        <Row label="Lead → Venda" value={formatPercent(current.leadToSale, 2)} />
        <Row label="Vendas" value={formatDecimalValue(current.sales)} />
        <Row label="VGV" value={formatBRLAbbrev(current.vgv)} />
      </div>

      {hasReference ? (
        <div className="border-t border-[color:var(--color-border)] pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--electric-bright)]">
            Cenário de referência
          </p>
          <Row label="Mesmo investimento" value={formatBRL(referenceBase.investment)} />
          <Row label="CPL utilizado" value={formatBRLDecimal(referenceBase.cpl)} />
          <Row label="Leads projetados" value={formatDecimalValue(referenceBase.leads)} />
          <Row label="Lead → Visita" value={formatPercent(referenceBase.leadToVisit, 0)} />
          <Row label="Visitas projetadas" value={formatDecimalValue(referenceBase.visits)} />
          <Row label="Lead → Venda (base)" value={formatPercent(leadToSaleRateBase, 0)} />
          <Row label="Vendas esperadas" value={formatDecimalValue(referenceBase.sales)} />
          <Row label="VGV esperado" value={formatBRLAbbrev(referenceBase.vgv)} highlight />

          <p className="mb-1 mt-4 text-xs text-muted-foreground">
            Considerando uma conversão Lead → Venda entre {formatPercent(leadToSaleRateMin, 0)} e{" "}
            {formatPercent(leadToSaleRateMax, 0)}:
          </p>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-black/15 p-3">
            <RangeStat
              label={`Mínimo (${formatPercent(leadToSaleRateMin, 0)})`}
              sales={referenceMin.sales}
              vgv={referenceMin.vgv}
            />
            <RangeStat
              label={`Base (${formatPercent(leadToSaleRateBase, 0)})`}
              sales={referenceBase.sales}
              vgv={referenceBase.vgv}
            />
            <RangeStat
              label={`Máximo (${formatPercent(leadToSaleRateMax, 0)})`}
              sales={referenceMax.sales}
              vgv={referenceMax.vgv}
            />
          </div>
        </div>
      ) : null}

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <Row label="Ticket médio" value={formatBRL(inputs.ticket)} />
        <Row label="Receita bruta estimada atual" value={formatBRLAbbrev(currentRevenue)} />
        {hasReference ? (
          <Row
            label="Receita bruta estimada no cenário de referência"
            value={formatBRLAbbrev(referenceRevenue)}
          />
        ) : null}
      </div>

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <Row
          label="Custo por lead (CPL)"
          value={current.leads > 0 ? formatBRLDecimal(current.cpl) : "não calculável"}
        />
        <Row
          label="Custo por visita"
          value={costPerVisit !== null ? formatBRL(costPerVisit) : "não calculável"}
        />
        <Row
          label="Custo de mídia por venda"
          value={costPerSale !== null ? formatBRL(costPerSale) : "não calculável"}
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

import { formatBRL, formatBRLAbbrev, formatSignedBRLAbbrev } from "../../engine/format";
import type { CurrentMetrics, ProjectedMetrics } from "../../engine/types";

interface DiagnosticDetailsRowsProps {
  current: CurrentMetrics;
  projected: ProjectedMetrics;
}

/** Linhas de dado puro (VGV/receita/custos) — conteúdo de "Ver meu diagnóstico completo". */
export function DiagnosticDetailsRows({ current, projected }: DiagnosticDetailsRowsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Row label="VGV atual" value={formatBRLAbbrev(current.vgv)} />
        <Row label="VGV potencial" value={formatBRLAbbrev(projected.vgvPotential)} highlight />
        <Row
          label="Diferença"
          value={`${formatSignedBRLAbbrev(projected.opportunityVGV)}/mês`}
          signed
        />
      </div>

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <Row label="Receita bruta estimada atual" value={formatBRLAbbrev(current.revenue)} />
        <Row
          label="Receita bruta potencial"
          value={formatBRLAbbrev(projected.revenuePotential)}
          highlight
        />
        <Row
          label="Diferença"
          value={`${formatSignedBRLAbbrev(projected.opportunityRevenue)}/mês`}
          signed
        />
      </div>

      <div className="border-t border-[color:var(--color-border)] pt-4">
        <Row label="Custo por lead (CPL)" value={formatBRL(current.cpl)} />
        <Row label="Custo por visita" value={formatBRL(current.costPerVisit)} />
        <Row label="Custo de mídia por venda" value={formatBRL(current.costPerSale)} />
      </div>

      <p className="text-xs text-muted-foreground">
        Simulação matemática — não é garantia de resultado. Trata-se de receita bruta estimada, não
        lucro.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
  signed,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  signed?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`font-display text-base font-bold tabular-nums ${
          signed
            ? "text-[color:var(--success)]"
            : highlight
              ? "text-[color:var(--electric-bright)]"
              : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

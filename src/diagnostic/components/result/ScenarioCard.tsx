import { cn } from "@/lib/utils";
import { formatBRLAbbrev, formatInt, formatPercent, pluralize } from "../../engine/format";

interface ScenarioCardProps {
  label: string;
  leads: number;
  visitsValue: string;
  visitsCaption: string;
  leadToVisitRate: number;
  salesValue: string;
  salesCaption: string;
  visitToSaleRate: number;
  vgv: number;
  vgvCaption: string;
  accent: "current" | "potential";
}

/**
 * Card compacto de funil: número → número → número → VGV, sem barras que
 * afinam e desalinham. Volume + taxa + consequência lidos em uma tacada só.
 */
export function ScenarioCard({
  label,
  leads,
  visitsValue,
  visitsCaption,
  leadToVisitRate,
  salesValue,
  salesCaption,
  visitToSaleRate,
  vgv,
  vgvCaption,
  accent,
}: ScenarioCardProps) {
  const isPotential = accent === "potential";

  return (
    <div
      className={cn(
        "rounded-2xl border p-5",
        isPotential
          ? "border-[color:var(--electric)]/40 bg-[color:var(--electric)]/[0.06]"
          : "border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]",
      )}
    >
      <p className="mb-3 text-center text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <StatRow value={formatInt(leads)} caption={pluralize(leads, "lead", "leads")} />
      <RateConnector rate={leadToVisitRate} />
      <StatRow value={visitsValue} caption={visitsCaption} />
      <RateConnector rate={visitToSaleRate} />
      <StatRow value={salesValue} caption={salesCaption} />

      <div className="my-3 border-t border-[color:var(--color-border)]" />

      <div className="text-center">
        <p
          className={cn(
            "font-display text-3xl font-extrabold tabular-nums sm:text-4xl",
            isPotential ? "text-[color:var(--electric-bright)]" : "text-foreground",
          )}
        >
          {formatBRLAbbrev(vgv)}
        </p>
        <p className="text-[0.7rem] uppercase tracking-wide text-muted-foreground">{vgvCaption}</p>
      </div>
    </div>
  );
}

function StatRow({ value, caption }: { value: string; caption: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-xl font-bold tabular-nums text-foreground sm:text-2xl">
        {value}
      </p>
      <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">{caption}</p>
    </div>
  );
}

function RateConnector({ rate }: { rate: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-0.5 text-[0.7rem] font-semibold text-[color:var(--electric-bright)]">
      <span aria-hidden>↓</span>
      {formatPercent(rate, 1)}
    </div>
  );
}

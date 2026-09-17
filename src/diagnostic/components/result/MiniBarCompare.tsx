import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatBRLAbbrev } from "../../engine/format";

/** Barra horizontal compacta (~70px de altura) — substitui o gráfico vertical grande. */
export function MiniBarCompare({ current, potential }: { current: number; potential: number }) {
  const max = Math.max(current, potential, 1);
  const currentPct = Math.max((current / max) * 100, 6);
  const potentialPct = Math.max((potential / max) * 100, 6);

  return (
    <div className="w-full space-y-1.5">
      <BarRow label="Hoje" value={current} pct={currentPct} tone="muted" />
      <BarRow label="Potencial" value={potential} pct={potentialPct} tone="electric" />
    </div>
  );
}

function BarRow({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: number;
  pct: number;
  tone: "muted" | "electric";
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[0.6rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full",
            tone === "electric"
              ? "bg-gradient-to-r from-[color:var(--electric)] to-[color:var(--electric-bright)]"
              : "bg-[color:var(--color-border)]",
          )}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
        {formatBRLAbbrev(value)}
      </span>
    </div>
  );
}

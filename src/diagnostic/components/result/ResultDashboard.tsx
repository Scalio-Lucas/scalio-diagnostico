import { useEffect } from "react";
import { formatInt, pluralize } from "../../engine/format";
import { buildDiagnosticRecord, submitDiagnostic } from "../../engine/record";
import { useDiagnostic } from "../../state/DiagnosticContext";
import { useComputationFor } from "../../state/useComputed";
import { CTASection } from "./CTASection";
import { DiagnosisHero } from "./DiagnosisHero";
import { HowWeCalculate } from "./HowWeCalculate";
import { ImpactComparison } from "./ImpactComparison";
import { ScenarioCard } from "./ScenarioCard";
import { SecondaryDiagnosticSection } from "./SecondaryDiagnosticSection";

export function ResultDashboard() {
  const { state, restart } = useDiagnostic();
  const { inputs } = state;

  const { current, referenceBase, referenceMin, referenceMax, diagnostic } =
    useComputationFor(inputs);
  const hasReference = inputs.investment > 0;

  useEffect(() => {
    if (current.sales > 0) {
      submitDiagnostic(buildDiagnosticRecord(inputs, current, referenceBase));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O Scenario Engine só não consegue montar um cenário de referência quando
  // não há investimento informado (não dá para calcular investimento÷CPL).
  // Fora esse caso, a comparação Hoje×Referência está sempre disponível,
  // mesmo sem visitas ou vendas históricas.
  if (!hasReference) {
    return (
      <div className="mx-auto max-w-md px-5 pb-16">
        <DiagnosisHero diagnostic={diagnostic} />

        <div className="mt-8">
          <ScenarioCard
            label="Hoje"
            leads={current.leads}
            visitsValue={formatInt(current.visits)}
            visitsCaption={pluralize(current.visits, "visita", "visitas")}
            leadToVisitRate={current.leadToVisit}
            salesValue={formatInt(current.sales)}
            salesCaption={pluralize(current.sales, "venda", "vendas")}
            visitToSaleRate={current.visitToSale}
            vgv={current.vgv}
            vgvCaption="VGV"
            accent="current"
          />
        </div>

        <ArrowDivider />

        <CTASection />

        <div className="mt-6 space-y-3">
          <SecondaryDiagnosticSection
            diagnostic={diagnostic}
            inputs={inputs}
            current={current}
            referenceBase={referenceBase}
            referenceMin={referenceMin}
            referenceMax={referenceMax}
          />
          <HowWeCalculate />
        </div>

        <RestartLink onRestart={restart} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pb-16">
      {/* BLOCO 1 */}
      <DiagnosisHero diagnostic={diagnostic} />

      {/* BLOCO 2 — Hoje × Cenário de referência */}
      <div className="mt-10">
        <ImpactComparison current={current} reference={referenceBase} diagnostic={diagnostic} />
      </div>

      <ArrowDivider />

      {/* BLOCO 3 — o convite entra imediatamente após a comparação */}
      <CTASection />

      {/* Informações secundárias — fechadas por padrão, a página "termina" no CTA */}
      <div className="mt-8 space-y-3">
        <SecondaryDiagnosticSection
          diagnostic={diagnostic}
          inputs={inputs}
          current={current}
          referenceBase={referenceBase}
          referenceMin={referenceMin}
          referenceMax={referenceMax}
        />
        <HowWeCalculate />
      </div>

      <RestartLink onRestart={restart} />
    </div>
  );
}

function ArrowDivider() {
  return (
    <div aria-hidden className="my-6 flex justify-center text-muted-foreground/50">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 4v16M6 14l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function RestartLink({ onRestart }: { onRestart: () => void }) {
  return (
    <button
      type="button"
      onClick={onRestart}
      className="mx-auto mt-8 block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      Refazer diagnóstico com outros números
    </button>
  );
}

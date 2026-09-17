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
  const { state, setSimulatorRate, restart } = useDiagnostic();
  const { inputs } = state;

  const base = useComputationFor(inputs);

  useEffect(() => {
    if (state.simulatorRate === null) {
      setSimulatorRate(base.projected.leadToVisitProjected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.simulatorRate]);

  useEffect(() => {
    if (base.projected.hasProjectableSales) {
      submitDiagnostic(buildDiagnosticRecord(inputs, base.current, base.projected));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const simulatorRate = state.simulatorRate ?? base.projected.leadToVisitProjected;
  const live = useComputationFor(inputs, simulatorRate);
  const { current, projected, diagnostic } = live;

  // Caso E (sem histórico de vendas): sem comparação nem simulador, só o que os dados permitem.
  if (!current.hasSales) {
    return (
      <div className="mx-auto max-w-md px-5 pb-16">
        <DiagnosisHero diagnostic={diagnostic} current={current} projected={projected} />

        <div className="mt-8">
          <ScenarioCard
            label="Hoje"
            leads={inputs.leads}
            visitsValue={formatInt(inputs.visits)}
            visitsCaption={pluralize(inputs.visits, "visita", "visitas")}
            leadToVisitRate={current.leadToVisit}
            salesValue="0"
            salesCaption="vendas"
            visitToSaleRate={0}
            vgv={0}
            vgvCaption="VGV"
            accent="current"
          />
        </div>

        <ArrowDivider />

        <CTASection />

        <div className="mt-6">
          <HowWeCalculate />
        </div>

        <RestartLink onRestart={restart} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pb-16">
      {/* BLOCO 1 */}
      <DiagnosisHero diagnostic={diagnostic} current={current} projected={projected} />

      {/* BLOCO 2 */}
      <div className="mt-10">
        <ImpactComparison inputs={inputs} current={current} projected={projected} />
      </div>

      <ArrowDivider />

      {/* BLOCO 3 — o convite entra imediatamente após a comparação */}
      <CTASection />

      {/* Informações secundárias — fechadas por padrão, a página "termina" no CTA */}
      <div className="mt-8 space-y-3">
        <SecondaryDiagnosticSection
          diagnostic={diagnostic}
          current={current}
          projected={projected}
          simulatorRate={simulatorRate}
          simulatorMin={live.simulatorMin}
          simulatorMax={live.simulatorMax}
          onSimulatorChange={setSimulatorRate}
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

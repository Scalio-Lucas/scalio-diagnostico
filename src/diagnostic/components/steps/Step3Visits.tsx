import { formatInt, parseIntInput, pluralize } from "../../engine/format";
import { useDiagnostic } from "../../state/DiagnosticContext";
import { StepShell } from "../StepShell";
import { QuestionSlider } from "../ui/QuestionSlider";

export function Step3Visits() {
  const { state, setField, nextStep, prevStep } = useDiagnostic();
  const { leads, visits } = state.inputs;

  return (
    <StepShell
      step={2}
      question="Quantas visitas são realizadas por mês com esses leads?"
      helper={
        leads === 0
          ? "Registre pelo menos 1 lead na etapa anterior para informar visitas."
          : undefined
      }
      onBack={prevStep}
      onContinue={nextStep}
    >
      <QuestionSlider
        value={visits}
        onChange={(v) => setField("visits", v)}
        min={0}
        max={Math.max(leads, 0)}
        step={1}
        formatValue={(v) => `${formatInt(v)} ${pluralize(v, "visita", "visitas")}`}
        formatEdgeMin="0"
        formatEdgeMax={`${formatInt(leads)} (todos os leads)`}
        parseManual={parseIntInput}
        disabled={leads === 0}
      />
    </StepShell>
  );
}

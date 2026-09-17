import { formatInt, parseIntInput, pluralize } from "../../engine/format";
import { LEADS_BREAKPOINTS, createPiecewiseScale } from "../../engine/scale";
import { useDiagnostic } from "../../state/DiagnosticContext";
import { StepShell } from "../StepShell";
import { QuestionSlider } from "../ui/QuestionSlider";

const scale = createPiecewiseScale(LEADS_BREAKPOINTS);

export function Step2Leads() {
  const { state, setField, nextStep, prevStep } = useDiagnostic();

  return (
    <StepShell
      step={1}
      question="Quantos leads esse investimento gera por mês?"
      onBack={prevStep}
      onContinue={nextStep}
    >
      <QuestionSlider
        value={state.inputs.leads}
        onChange={(v) => setField("leads", v)}
        min={scale.min}
        max={scale.max}
        scale={scale}
        formatValue={(v) => `${formatInt(v)} ${pluralize(v, "lead", "leads")}`}
        formatEdgeMin="0"
        formatEdgeMax="5.000+"
        parseManual={parseIntInput}
      />
    </StepShell>
  );
}

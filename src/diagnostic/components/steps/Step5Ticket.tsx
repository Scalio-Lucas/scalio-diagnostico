import { formatBRL, parseCurrencyInput } from "../../engine/format";
import { TICKET_BREAKPOINTS, createPiecewiseScale } from "../../engine/scale";
import { useDiagnostic } from "../../state/DiagnosticContext";
import { StepShell } from "../StepShell";
import { QuestionSlider } from "../ui/QuestionSlider";

const scale = createPiecewiseScale(TICKET_BREAKPOINTS);

export function Step5Ticket() {
  const { state, setField, nextStep, prevStep } = useDiagnostic();

  return (
    <StepShell
      step={4}
      question="Qual o valor médio dos imóveis vendidos?"
      onBack={prevStep}
      onContinue={nextStep}
    >
      <QuestionSlider
        value={state.inputs.ticket}
        onChange={(v) => setField("ticket", v)}
        min={scale.min}
        max={scale.max}
        step={100000}
        scale={scale}
        formatValue={(v) => formatBRL(v)}
        formatEdgeMin="R$ 100 mil"
        formatEdgeMax="R$ 10 mi+"
        parseManual={parseCurrencyInput}
      />
    </StepShell>
  );
}

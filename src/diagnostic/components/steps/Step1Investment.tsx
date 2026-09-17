import { formatBRL, parseCurrencyInput } from "../../engine/format";
import { INVESTMENT_BREAKPOINTS, createPiecewiseScale } from "../../engine/scale";
import { useDiagnostic } from "../../state/DiagnosticContext";
import { StepShell } from "../StepShell";
import { QuestionSlider } from "../ui/QuestionSlider";

const scale = createPiecewiseScale(INVESTMENT_BREAKPOINTS);

export function Step1Investment({ onExit }: { onExit?: () => void }) {
  const { state, setField, nextStep } = useDiagnostic();

  return (
    <StepShell
      step={0}
      question="Quanto sua imobiliária investe em marketing por mês?"
      onBack={onExit}
      onContinue={nextStep}
    >
      <QuestionSlider
        value={state.inputs.investment}
        onChange={(v) => setField("investment", v)}
        min={scale.min}
        max={scale.max}
        step={200}
        scale={scale}
        formatValue={(v) => `${formatBRL(v)}/mês`}
        formatEdgeMin="R$ 0"
        formatEdgeMax="R$ 100.000+"
        parseManual={parseCurrencyInput}
      />
    </StepShell>
  );
}

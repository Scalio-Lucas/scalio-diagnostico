import { parsePercentInput } from "../../engine/format";
import { useDiagnostic } from "../../state/DiagnosticContext";
import { StepShell } from "../StepShell";
import { QuestionSlider } from "../ui/QuestionSlider";

export function Step6Commission() {
  const { state, setField, goToProcessing, prevStep } = useDiagnostic();

  return (
    <StepShell
      step={5}
      question="Qual percentual de comissão fica com a imobiliária em uma venda?"
      onBack={prevStep}
      onContinue={goToProcessing}
      continueLabel="Ver meu diagnóstico"
    >
      <QuestionSlider
        value={state.inputs.commission}
        onChange={(v) => setField("commission", v)}
        min={0}
        max={10}
        step={1}
        formatValue={(v) => `${Math.round(v)}%`}
        formatEdgeMin="0%"
        formatEdgeMax="10%"
        parseManual={parsePercentInput}
        inputMode="decimal"
      />
    </StepShell>
  );
}

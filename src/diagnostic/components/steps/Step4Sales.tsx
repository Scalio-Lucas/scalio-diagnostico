import { formatInt, parseIntInput, pluralize } from "../../engine/format";
import { useDiagnostic } from "../../state/DiagnosticContext";
import { StepShell } from "../StepShell";
import { QuestionSlider } from "../ui/QuestionSlider";

export function Step4Sales() {
  const { state, setField, nextStep, prevStep } = useDiagnostic();
  const { visits, sales } = state.inputs;

  return (
    <StepShell
      step={3}
      question="Quantas vendas vieram desses leads no último mês?"
      helper="Considere somente vendas originadas dos leads de marketing informados anteriormente — não misture indicação, carteira própria, orgânico ou parcerias."
      onBack={prevStep}
      onContinue={nextStep}
    >
      <QuestionSlider
        value={sales}
        onChange={(v) => setField("sales", v)}
        min={0}
        max={Math.max(visits, 0)}
        step={1}
        formatValue={(v) => `${formatInt(v)} ${pluralize(v, "venda", "vendas")}`}
        formatEdgeMin="0"
        formatEdgeMax={`${formatInt(visits)} (todas as visitas)`}
        parseManual={parseIntInput}
        disabled={visits === 0}
      />
    </StepShell>
  );
}

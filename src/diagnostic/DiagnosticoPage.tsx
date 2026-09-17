import { Processing } from "./components/Processing";
import { ResultDashboard } from "./components/result/ResultDashboard";
import { Step1Investment } from "./components/steps/Step1Investment";
import { Step2Leads } from "./components/steps/Step2Leads";
import { Step3Visits } from "./components/steps/Step3Visits";
import { Step4Sales } from "./components/steps/Step4Sales";
import { Step5Ticket } from "./components/steps/Step5Ticket";
import { Step6Commission } from "./components/steps/Step6Commission";
import { DiagnosticProvider, useDiagnostic } from "./state/DiagnosticContext";

function DiagnosticoFlow() {
  const { state, goToResult } = useDiagnostic();

  if (state.phase === "processing") {
    return <Processing onDone={goToResult} />;
  }

  if (state.phase === "result") {
    return <ResultDashboard />;
  }

  switch (state.step) {
    case 0:
      return <Step1Investment />;
    case 1:
      return <Step2Leads />;
    case 2:
      return <Step3Visits />;
    case 3:
      return <Step4Sales />;
    case 4:
      return <Step5Ticket />;
    default:
      return <Step6Commission />;
  }
}

export default function DiagnosticoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden noise">
      <DiagnosticProvider>
        <DiagnosticoFlow />
      </DiagnosticProvider>
    </div>
  );
}

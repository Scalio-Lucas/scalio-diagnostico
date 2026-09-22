import { useMemo } from "react";
import { SCENARIOS, SIMULATOR_ABSOLUTE_CEILING, SIMULATOR_DEFAULT_CEILING } from "../config";
import { buildDiagnostic, pickInitialScenario } from "../engine/diagnosticEngine";
import { computeCurrentMetrics } from "../engine/metrics";
import { analyzeOpportunities, buildStageComparison } from "../engine/opportunityEngine";
import { computeProjection } from "../engine/scenarios";
import type { FunnelInputs, ScenarioKey } from "../engine/types";
import { useDiagnostic } from "./DiagnosticContext";

/** Pipeline completo Input -> Metrics -> Opportunity -> Diagnostic, memoizado. */
export function useDiagnosticComputation(overrideRate?: number) {
  const { state } = useDiagnostic();
  return useComputationFor(state.inputs, overrideRate);
}

export function useComputationFor(inputs: FunnelInputs, overrideRate?: number) {
  return useMemo(() => {
    const current = computeCurrentMetrics(inputs);

    // Scenario Engine — cenário de referência SEMPRE recalculado a partir do
    // investimento e dos parâmetros de DIAGNOSTIC_CONFIG, nunca do volume
    // atual de leads (regra absoluta: nunca copiar leads atuais).
    const opportunities = analyzeOpportunities(inputs, current);
    const comparison = buildStageComparison(inputs, current, opportunities);
    const diagnostic = buildDiagnostic(current, opportunities);

    // Simulador compacto (BLOCO 3 / "Ver diagnóstico completo") continua
    // simulando especificamente Lead→Visita, como já aprovado — independente
    // de qual etapa o Opportunity Engine aponta como gargalo principal.
    const initialScenario: ScenarioKey = pickInitialScenario(current);
    const rate =
      overrideRate ??
      SCENARIOS[initialScenario === "custom" ? "potential" : initialScenario].leadToVisit;
    const projected = computeProjection(
      inputs,
      current,
      rate,
      overrideRate !== undefined ? "custom" : initialScenario,
    );

    const simulatorMin = current.leadToVisit;
    const simulatorMax = Math.min(
      Math.max(SIMULATOR_DEFAULT_CEILING, current.leadToVisit + 0.05),
      SIMULATOR_ABSOLUTE_CEILING,
    );

    return {
      current,
      opportunities,
      comparison,
      diagnostic,
      projected,
      initialScenario,
      simulatorMin,
      simulatorMax,
    };
  }, [inputs, overrideRate]);
}

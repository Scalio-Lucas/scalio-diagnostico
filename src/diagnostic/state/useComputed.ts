import { useMemo } from "react";
import { SCENARIOS, SIMULATOR_ABSOLUTE_CEILING, SIMULATOR_DEFAULT_CEILING } from "../config";
import { buildDiagnostic, pickInitialScenario } from "../engine/diagnosticEngine";
import { computeCurrentMetrics } from "../engine/metrics";
import { computeProjection } from "../engine/scenarios";
import type { FunnelInputs, ScenarioKey } from "../engine/types";
import { useDiagnostic } from "./DiagnosticContext";

/** Pipeline completo Input -> Metrics -> Scenario -> Diagnostic, memoizado. */
export function useDiagnosticComputation(overrideRate?: number) {
  const { state } = useDiagnostic();
  return useComputationFor(state.inputs, overrideRate);
}

export function useComputationFor(inputs: FunnelInputs, overrideRate?: number) {
  return useMemo(() => {
    const current = computeCurrentMetrics(inputs);
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
    const diagnostic = buildDiagnostic(inputs, current, projected);

    const simulatorMin = current.leadToVisit;
    const simulatorMax = Math.min(
      Math.max(SIMULATOR_DEFAULT_CEILING, current.leadToVisit + 0.05),
      SIMULATOR_ABSOLUTE_CEILING,
    );

    return { current, projected, diagnostic, initialScenario, simulatorMin, simulatorMax };
  }, [inputs, overrideRate]);
}

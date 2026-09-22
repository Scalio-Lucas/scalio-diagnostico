import { useMemo } from "react";
import { DIAGNOSTIC_CONFIG } from "../config";
import { buildDiagnostic } from "../engine/diagnosticEngine";
import {
  analyzeOpportunity,
  assertReferenceLeadsConsistency,
  calculateCurrentScenario,
  calculateReferenceScenario,
} from "../engine/scenarioEngine";
import type { FunnelInputs } from "../engine/types";
import { useDiagnostic } from "./DiagnosticContext";

/** Pipeline completo Input -> Scenario Engine -> Diagnostic, memoizado. */
export function useDiagnosticComputation() {
  const { state } = useDiagnostic();
  return useComputationFor(state.inputs);
}

export function useComputationFor(inputs: FunnelInputs) {
  return useMemo(() => {
    const current = calculateCurrentScenario(inputs);

    const {
      qualifiedLeadCPL,
      leadToVisitRate,
      leadToSaleRateMin,
      leadToSaleRateBase,
      leadToSaleRateMax,
    } = DIAGNOSTIC_CONFIG;

    // As três chamadas usam a MESMA função (calculateReferenceScenario) e o
    // MESMO cpl/leadToVisit — só o leadToSale varia. Nenhuma fórmula de faixa
    // separada existe em lugar nenhum do código.
    const referenceBase = calculateReferenceScenario(inputs, {
      cpl: qualifiedLeadCPL,
      leadToVisit: leadToVisitRate,
      leadToSale: leadToSaleRateBase,
    });
    const referenceMin = calculateReferenceScenario(inputs, {
      cpl: qualifiedLeadCPL,
      leadToVisit: leadToVisitRate,
      leadToSale: leadToSaleRateMin,
    });
    const referenceMax = calculateReferenceScenario(inputs, {
      cpl: qualifiedLeadCPL,
      leadToVisit: leadToVisitRate,
      leadToSale: leadToSaleRateMax,
    });

    if (inputs.investment > 0) {
      assertReferenceLeadsConsistency(inputs.investment, qualifiedLeadCPL, referenceBase.leads);
    }

    const opportunity = analyzeOpportunity(inputs, current, referenceBase);
    const diagnostic = buildDiagnostic(
      current,
      referenceBase,
      referenceMin,
      referenceMax,
      opportunity,
    );

    return { current, referenceBase, referenceMin, referenceMax, opportunity, diagnostic };
  }, [inputs]);
}

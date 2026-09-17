import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { TOTAL_QUESTIONS } from "../config";
import { clampDependents, DEFAULT_INPUTS } from "../engine/validation";
import type { FunnelInputs } from "../engine/types";

export type Phase = "questions" | "processing" | "result";

interface DiagnosticState {
  inputs: FunnelInputs;
  step: number; // 0..TOTAL_QUESTIONS-1
  phase: Phase;
  simulatorRate: number | null; // null = ainda não inicializado a partir do diagnóstico
}

type Action =
  | { type: "SET_FIELD"; field: keyof FunnelInputs; value: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_PROCESSING" }
  | { type: "GO_TO_RESULT" }
  | { type: "SET_SIMULATOR_RATE"; value: number }
  | { type: "RESTART" };

const STORAGE_KEY = "scalio-diagnostic-inputs-v1";

function loadPersistedInputs(): FunnelInputs {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INPUTS;
    const parsed = JSON.parse(raw);
    return clampDependents({ ...DEFAULT_INPUTS, ...parsed });
  } catch {
    return DEFAULT_INPUTS;
  }
}

function persistInputs(inputs: FunnelInputs) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch {
    // ignora — não bloqueia o fluxo
  }
}

function initState(): DiagnosticState {
  return {
    inputs: loadPersistedInputs(),
    step: 0,
    phase: "questions",
    simulatorRate: null,
  };
}

function reducer(state: DiagnosticState, action: Action): DiagnosticState {
  switch (action.type) {
    case "SET_FIELD": {
      const inputs = clampDependents({ ...state.inputs, [action.field]: action.value });
      persistInputs(inputs);
      return { ...state, inputs };
    }
    case "NEXT_STEP":
      return { ...state, step: Math.min(state.step + 1, TOTAL_QUESTIONS - 1) };
    case "PREV_STEP":
      return { ...state, step: Math.max(state.step - 1, 0) };
    case "GO_TO_PROCESSING":
      return { ...state, phase: "processing" };
    case "GO_TO_RESULT":
      return { ...state, phase: "result" };
    case "SET_SIMULATOR_RATE":
      return { ...state, simulatorRate: action.value };
    case "RESTART":
      persistInputs(DEFAULT_INPUTS);
      return { inputs: DEFAULT_INPUTS, step: 0, phase: "questions", simulatorRate: null };
    default:
      return state;
  }
}

interface DiagnosticContextValue {
  state: DiagnosticState;
  setField: (field: keyof FunnelInputs, value: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToProcessing: () => void;
  goToResult: () => void;
  setSimulatorRate: (value: number) => void;
  restart: () => void;
}

const DiagnosticContext = createContext<DiagnosticContextValue | null>(null);

export function DiagnosticProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  const value = useMemo<DiagnosticContextValue>(
    () => ({
      state,
      setField: (field, value) => dispatch({ type: "SET_FIELD", field, value }),
      nextStep: () => dispatch({ type: "NEXT_STEP" }),
      prevStep: () => dispatch({ type: "PREV_STEP" }),
      goToProcessing: () => dispatch({ type: "GO_TO_PROCESSING" }),
      goToResult: () => dispatch({ type: "GO_TO_RESULT" }),
      setSimulatorRate: (value) => dispatch({ type: "SET_SIMULATOR_RATE", value }),
      restart: () => dispatch({ type: "RESTART" }),
    }),
    [state],
  );

  return <DiagnosticContext.Provider value={value}>{children}</DiagnosticContext.Provider>;
}

export function useDiagnostic() {
  const ctx = useContext(DiagnosticContext);
  if (!ctx) throw new Error("useDiagnostic precisa estar dentro de <DiagnosticProvider>");
  return ctx;
}

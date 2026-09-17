import type { FunnelInputs } from "./types";

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export const DEFAULT_INPUTS: FunnelInputs = {
  investment: 5000,
  leads: 120,
  visits: 12,
  sales: 2,
  ticket: 600000,
  commission: 5,
};

/**
 * Garante `visitas <= leads` e `vendas <= visitas` sempre que uma variável
 * upstream muda (regra da seção 51). Chamado a cada SET_FIELD do reducer —
 * única porta de entrada para o estado, então nunca existe um estado
 * matematicamente impossível na árvore.
 */
export function clampDependents(inputs: FunnelInputs): FunnelInputs {
  const investment = Math.max(0, safe(inputs.investment));
  const leads = Math.max(0, safe(inputs.leads));
  const visits = clamp(safe(inputs.visits), 0, leads);
  const sales = clamp(safe(inputs.sales), 0, visits);
  const ticket = Math.max(0, safe(inputs.ticket));
  const commission = clamp(safe(inputs.commission), 0, 100);
  return { investment, leads, visits, sales, ticket, commission };
}

function safe(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Escala não-linear por trechos: cada segmento entre dois breakpoints recebe
 * a MESMA fatia de curso do slider (0-1000), então trechos de valor pequeno
 * (onde a precisão importa mais) ganham proporcionalmente mais espaço físico
 * no dedo do usuário do que trechos de valor grande. Usado pelos sliders de
 * investimento, leads e ticket médio (seções 7, 8, 11).
 */
export interface PiecewiseScale {
  breakpoints: number[];
  /** valor real -> posição inteira 0..resolution, para alimentar o <Slider> */
  toPosition(value: number): number;
  /** posição do <Slider> -> valor real */
  toValue(position: number): number;
  min: number;
  max: number;
  resolution: number;
}

export function createPiecewiseScale(breakpoints: number[], resolution = 1000): PiecewiseScale {
  const segments = breakpoints.length - 1;
  const min = breakpoints[0];
  const max = breakpoints[breakpoints.length - 1];

  function toPosition(value: number): number {
    const v = Math.min(Math.max(value, min), max);
    for (let i = 0; i < segments; i++) {
      const a = breakpoints[i];
      const b = breakpoints[i + 1];
      if (v >= a && v <= b) {
        const localT = b === a ? 0 : (v - a) / (b - a);
        return Math.round(((i + localT) / segments) * resolution);
      }
    }
    return resolution;
  }

  function toValue(position: number): number {
    const p = Math.min(Math.max(position, 0), resolution);
    const scaled = (p / resolution) * segments;
    const i = Math.min(Math.floor(scaled), segments - 1);
    const localT = scaled - i;
    const a = breakpoints[i];
    const b = breakpoints[i + 1];
    return a + localT * (b - a);
  }

  return { breakpoints, toPosition, toValue, min, max, resolution };
}

export const INVESTMENT_BREAKPOINTS = [
  0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2500, 3000, 3500, 4000, 4500, 5000,
  6000, 7000, 8000, 9000, 10000, 15000, 20000, 30000, 50000, 75000, 100000,
];

export const LEADS_BREAKPOINTS = [
  0, 10, 20, 30, 40, 50, 75, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000,
];

export const TICKET_BREAKPOINTS = [
  100000, 150000, 200000, 250000, 300000, 350000, 400000, 500000, 600000, 750000, 1000000, 1250000,
  1500000, 2000000, 3000000, 5000000, 10000000,
];

// Toda formatação pt-BR do app passa por aqui. Nenhum componente deve
// chamar Intl/toFixed diretamente — evita divergência de formatação e
// garante que NaN/Infinity nunca cheguem à tela.

export function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

const intFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatInt(value: number): string {
  return intFormatter.format(Math.round(safeNumber(value)));
}

export function formatBRL(value: number): string {
  return brlFormatter.format(safeNumber(value));
}

const brlDecimalFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Para valores pequenos (ex.: CPL) onde arredondar para reais inteiros perde a informação. */
export function formatBRLDecimal(value: number): string {
  return brlDecimalFormatter.format(safeNumber(value));
}

/** "R$ 500 mil", "R$ 1,5 mi", "R$ 3,2 mi" — para números grandes em destaque visual. */
export function formatBRLAbbrev(value: number): string {
  const v = safeNumber(value);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const rounded = Math.round(millions * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
    return `${sign}R$ ${text} mi`;
  }
  if (abs >= 1000) {
    const thousands = abs / 1000;
    const rounded = Math.round(thousands * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(".", ",");
    return `${sign}R$ ${text} mil`;
  }
  return formatBRL(v);
}

export function formatSignedBRLAbbrev(value: number): string {
  const v = safeNumber(value);
  const prefix = v > 0 ? "+" : "";
  return `${prefix}${formatBRLAbbrev(v)}`;
}

export function formatPercent(value01: number, decimals = 0): string {
  const v = safeNumber(value01) * 100;
  return `${v.toFixed(decimals).replace(".", ",")}%`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return Math.round(safeNumber(count)) === 1 ? singular : plural;
}

/**
 * Número de visitas/vendas potenciais SEM arredondar para inteiro — mostra a
 * casa decimal (ex.: "≈ 3,5") para não destoar do VGV calculado a partir dele.
 * Use `pluralize` à parte para a legenda (singular/plural).
 */
export function formatDecimalValue(value: number, decimals = 1): string {
  const v = safeNumber(value);
  const factor = 10 ** decimals;
  const rounded = Math.round(v * factor) / factor;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 1e-9;
  const text = isWhole ? formatInt(rounded) : rounded.toFixed(decimals).replace(".", ",");
  return isWhole ? text : `≈ ${text}`;
}

export function parseCurrencyInput(raw: string): number {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!digitsOnly) return 0;
  return safeNumber(parseInt(digitsOnly, 10));
}

export function parseIntInput(raw: string): number {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!digitsOnly) return 0;
  return safeNumber(parseInt(digitsOnly, 10));
}

export function parsePercentInput(raw: string): number {
  const normalized = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const value = parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

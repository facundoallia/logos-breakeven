export type Family = 'fija' | 'cer' | 'dlk';

export interface BondConfig {
  ticker: string;
  nombre: string;
  family: Family;
}

/** data912 live price row (subset we use). */
export interface LiveBond {
  symbol: string;
  c: number | null;
  pct_change: number | null;
  q_op: number | null;
}

/** One point on a family's yield curve, ready for analytics. */
export interface CurveNode {
  ticker: string;
  nombre: string;
  family: Family;
  /** Calendar days to maturity. */
  days: number;
  /** days / 365. */
  years: number;
  /** Effective annual yield, as a DECIMAL (e.g. 0.35 = 35%). */
  tir: number;
  /** Modified duration in years (may be null for short letras). */
  md: number | null;
  vencimiento: string | null;
  precio: number | null;
  varDia: number | null;
}

export interface CurvesResponse {
  fija: CurveNode[];
  cer: CurveNode[];
  dlk: CurveNode[];
  asOf: string;
  /** Current wholesale USD (~A3500), used to project the implied official-FX path. */
  dolarMayorista: number | null;
  dolarFecha: string | null;
  /** Tickers requested that had no usable TIR/price (for transparency). */
  missing: string[];
}

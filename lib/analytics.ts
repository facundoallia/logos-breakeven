/**
 * Core fixed-income analytics for the breakeven app. Pure functions, no React —
 * kept framework-agnostic so they can be unit-tested in isolation.
 *
 * All rates here are EFFECTIVE ANNUAL and expressed as DECIMALS (0.35 = 35%).
 * The Fisher relations are applied MULTIPLICATIVELY, never by subtracting rates —
 * the additive approximation (i - r ≈ π) breaks down badly at Argentine inflation
 * levels, so we always use the exact (1+i)/(1+r) - 1 form.
 */

import type { CurveNode } from './types';

/** A generic term-structure point: time in years -> effective annual rate (decimal). */
export interface RatePoint {
  years: number;
  rate: number;
}

/**
 * Linear interpolation of a curve (rate vs years) at `targetYears`.
 * Returns null when the target falls outside the curve's observed range —
 * we deliberately do NOT extrapolate, to avoid inventing rates the market
 * has not priced.
 */
export function interpolateRate(points: RatePoint[], targetYears: number): number | null {
  const pts = [...points].filter((p) => Number.isFinite(p.years) && Number.isFinite(p.rate)).sort((a, b) => a.years - b.years);
  if (pts.length === 0) return null;
  if (targetYears < pts[0].years || targetYears > pts[pts.length - 1].years) return null;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (targetYears >= a.years && targetYears <= b.years) {
      if (b.years === a.years) return a.rate;
      const w = (targetYears - a.years) / (b.years - a.years);
      return a.rate + w * (b.rate - a.rate);
    }
  }
  return pts[pts.length - 1].rate;
}

/** Project a nominal FX level from spot and an annualized devaluation, over `years`. */
export function projectFx(spot: number, annualDeval: number, years: number): number {
  return spot * Math.pow(1 + annualDeval, years);
}

/** Effective annual rate -> effective MONTHLY rate (TEM). (1+a)^(1/12) - 1. */
export function toMonthly(annual: number): number {
  return Math.pow(1 + annual, 1 / 12) - 1;
}

/** Breakeven inflation from nominal (fija) and real (CER) effective annual rates. */
export function breakevenInflation(iNom: number, rReal: number): number {
  return (1 + iNom) / (1 + rReal) - 1;
}

/** Breakeven (official) devaluation from nominal (fija) and dollar-linked rates. */
export function breakevenDeval(iNom: number, dRate: number): number {
  return (1 + iNom) / (1 + dRate) - 1;
}

/**
 * Forward rate for the segment (t1 -> t2), stripped from two cumulative
 * annualized rates. Works for any annualized breakeven (inflation/devaluation)
 * or for nominal/real yields.
 */
export function forwardRate(xCum1: number, t1: number, xCum2: number, t2: number): number | null {
  if (t2 <= t1) return null;
  const ratio = Math.pow(1 + xCum2, t2) / Math.pow(1 + xCum1, t1);
  return Math.pow(ratio, 1 / (t2 - t1)) - 1;
}

export interface BreakevenPoint {
  years: number;
  days: number;
  vencimiento: string | null;
  iNom: number;   // nominal (fija) rate interpolated at this horizon
  other: number;  // real (CER) or dollar-linked rate at this horizon
  breakeven: number;
}

/**
 * Build the breakeven term structure by evaluating both curves at a common set
 * of maturities. We anchor on the union of both curves' maturities that lie
 * within the OVERLAP range (so both curves are interpolated, never extrapolated).
 */
export function buildBreakevenSeries(
  nominal: CurveNode[],
  other: CurveNode[],
  kind: 'inflation' | 'deval',
): BreakevenPoint[] {
  // Derive years from integer days at full precision (NOT the API-rounded `years`
  // field) so anchor lookups can't fall a rounding-hair outside the curve range.
  const nomPts: RatePoint[] = nominal.map((n) => ({ years: n.days / 365, rate: n.tir }));
  const othPts: RatePoint[] = other.map((n) => ({ years: n.days / 365, rate: n.tir }));
  if (nomPts.length < 2 || othPts.length < 2) return [];

  const nomYears = nomPts.map((p) => p.years);
  const othYears = othPts.map((p) => p.years);
  const lo = Math.max(Math.min(...nomYears), Math.min(...othYears));
  const hi = Math.min(Math.max(...nomYears), Math.max(...othYears));
  if (hi <= lo) return [];

  // Anchor maturities: every node from BOTH curves that sits inside the overlap.
  const anchorsSet = new Set<number>();
  for (const n of [...nominal, ...other]) {
    const y = n.days / 365;
    if (y >= lo && y <= hi) anchorsSet.add(Math.round(n.days));
  }
  const anchors = [...anchorsSet].sort((a, b) => a - b);

  // Map days -> a representative vencimiento string when available.
  const vencByDays = new Map<number, string | null>();
  for (const n of [...nominal, ...other]) vencByDays.set(Math.round(n.days), n.vencimiento);

  const out: BreakevenPoint[] = [];
  for (const days of anchors) {
    const years = days / 365;
    const iNom = interpolateRate(nomPts, years);
    const oth = interpolateRate(othPts, years);
    if (iNom == null || oth == null) continue;
    const breakeven = kind === 'inflation' ? breakevenInflation(iNom, oth) : breakevenDeval(iNom, oth);
    out.push({ years, days, vencimiento: vencByDays.get(days) ?? null, iNom, other: oth, breakeven });
  }
  return out;
}

export interface ForwardCell {
  fromYears: number;
  toYears: number;
  fromDays: number;
  toDays: number;
  forward: number | null;
}

/**
 * Matrix of forward breakevens between every pair of horizons in the series
 * (only the upper triangle, i.e. from < to, is meaningful). Feeds the heatmap.
 */
export function buildForwardMatrix(series: BreakevenPoint[]): ForwardCell[][] {
  return series.map((from) =>
    series.map((to) => ({
      fromYears: from.years,
      toYears: to.years,
      fromDays: from.days,
      toDays: to.days,
      forward: to.days > from.days ? forwardRate(from.breakeven, from.years, to.breakeven, to.years) : null,
    })),
  );
}

export interface SensitivityRow {
  scenario: number;   // assumed realized inflation/devaluation (decimal)
  fija: number;       // real (or in-USD) return of the fixed bond under that scenario
  linked: number;     // return of the CER/DLK bond (≈ its own real/hard rate, scenario-independent)
}

/**
 * Sensitivity of holding the FIXED bond vs the inflation/dollar-LINKED bond as a
 * function of the realized inflation (or devaluation). The two lines cross exactly
 * at the breakeven — that is the intuition we want to make visible.
 *
 * - Fixed bond real (or in-USD) return under scenario x: (1 + iNom)/(1 + x) - 1
 * - Linked bond return: its own quoted rate `linkedRate` (real for CER, hard for DLK),
 *   which does not depend on the realized scenario.
 */
export function sensitivity(
  iNom: number,
  linkedRate: number,
  scenarios: number[],
): SensitivityRow[] {
  return scenarios.map((x) => ({
    scenario: x,
    fija: (1 + iNom) / (1 + x) - 1,
    linked: linkedRate,
  }));
}

/** Evenly spaced scenario grid around a center value (e.g. ±spread of the breakeven). */
export function scenarioGrid(center: number, spread: number, steps = 21): number[] {
  const lo = Math.max(0, center - spread);
  const hi = center + spread;
  const grid: number[] = [];
  for (let i = 0; i < steps; i++) grid.push(lo + ((hi - lo) * i) / (steps - 1));
  return grid;
}

export interface MonthlyPathPoint {
  date: string;      // ISO maturity date of the bond pair (segment end)
  monthly: number;   // implied breakeven for THIS segment, as a monthly rate (TEM, decimal)
  fromYears: number; // segment start (years from today)
  toYears: number;   // segment end (years from today)
  tickers: string;   // the bond pair anchoring this point
}

interface PairNode {
  day: number;
  years: number;
  breakeven: number;
  tickers: string;
}

/**
 * Drop an interior pair that sits clearly off the curve (a single bond mispriced/illiquid
 * vs its neighbours), which would otherwise create a spike-and-dip in the stripped forwards.
 * Dropped if its cumulative breakeven deviates from the linear interpolation of its
 * immediate neighbours by more than `tolPp` percentage points.
 */
function denoisePairs(pairs: PairNode[], tolPp = 0.02): PairNode[] {
  if (pairs.length <= 2) return pairs;
  const kept: PairNode[] = [pairs[0]];
  for (let i = 1; i < pairs.length - 1; i++) {
    const a = pairs[i - 1], b = pairs[i + 1], c = pairs[i];
    const w = b.years === a.years ? 0 : (c.years - a.years) / (b.years - a.years);
    const interp = a.breakeven + w * (b.breakeven - a.breakeven);
    if (Math.abs(c.breakeven - interp) <= tolPp) kept.push(c);
  }
  kept.push(pairs[pairs.length - 1]);
  return kept;
}

/**
 * Implied breakeven path built PER BOND PAIR (the "sendero"). Each point is a real
 * maturity where a nominal bond (LECAP/BONCAP) meets an inflation/dollar bond: bonds
 * maturing within `tolDays` of each other are clustered into one pair, so the spacing
 * of the points follows actual maturities (a 3-month gap between pairs is one segment,
 * not an interpolated monthly grid).
 *
 * For each pair we compute the CUMULATIVE breakeven to that maturity; then the value
 * plotted is the FORWARD between consecutive pairs, expressed as a monthly rate (TEM) —
 * i.e. the inflation/devaluation the market prices for that specific stretch of time.
 */
export function monthlyBreakevenPath(
  nominal: CurveNode[],
  other: CurveNode[],
  kind: 'inflation' | 'deval',
  fromMs: number = Date.now(),
  tolDays = 20,
): MonthlyPathPoint[] {
  const nomPts: RatePoint[] = nominal.map((n) => ({ years: n.days / 365, rate: n.tir }));
  const othPts: RatePoint[] = other.map((n) => ({ years: n.days / 365, rate: n.tir }));
  if (nomPts.length < 1 || othPts.length < 1) return [];

  const lo = Math.max(Math.min(...nomPts.map((p) => p.years)), Math.min(...othPts.map((p) => p.years)));
  const hi = Math.min(Math.max(...nomPts.map((p) => p.years)), Math.max(...othPts.map((p) => p.years)));
  if (hi <= lo) return [];

  // Candidate maturities (days) from BOTH families inside the overlap, then cluster the
  // ones that fall within tolDays of each other → each cluster is one bond pair.
  const days = [...new Set([...nominal, ...other].map((n) => Math.round(n.days)).filter((d) => {
    const y = d / 365;
    return y >= lo && y <= hi;
  }))].sort((a, b) => a - b);
  if (days.length === 0) return [];

  const clusters: number[][] = [[days[0]]];
  for (let i = 1; i < days.length; i++) {
    const cur = clusters[clusters.length - 1];
    if (days[i] - cur[cur.length - 1] <= tolDays) cur.push(days[i]);
    else clusters.push([days[i]]);
  }
  const reps = clusters.map((c) => Math.round(c.reduce((s, x) => s + x, 0) / c.length));

  // Label each rep with the tickers maturing in its cluster window.
  const tickersFor = (repDay: number): string => {
    const near = [...nominal, ...other]
      .filter((n) => Math.abs(Math.round(n.days) - repDay) <= tolDays)
      .map((n) => n.ticker);
    return [...new Set(near)].join(' / ');
  };

  const pairs: PairNode[] = [];
  for (const day of reps) {
    const y = day / 365;
    const iNom = interpolateRate(nomPts, y);
    const oth = interpolateRate(othPts, y);
    if (iNom == null || oth == null) continue;
    const be = kind === 'inflation' ? breakevenInflation(iNom, oth) : breakevenDeval(iNom, oth);
    pairs.push({ day, years: y, breakeven: be, tickers: tickersFor(day) });
  }
  if (pairs.length === 0) return [];

  const clean = denoisePairs(pairs);
  const today = new Date(fromMs);
  const out: MonthlyPathPoint[] = [];
  let prev: PairNode | null = null;

  for (const c of clean) {
    const date = new Date(today.getTime() + c.day * 86_400_000).toISOString();
    let fwdAnnual: number | null;
    if (prev == null) {
      fwdAnnual = c.breakeven; // first segment: from today to first maturity = cumulative breakeven
    } else {
      fwdAnnual = forwardRate(prev.breakeven, prev.years, c.breakeven, c.years);
      if (fwdAnnual == null) { prev = c; continue; }
    }
    out.push({
      date,
      monthly: toMonthly(fwdAnnual),
      fromYears: prev ? prev.years : 0,
      toYears: c.years,
      tickers: c.tickers,
    });
    prev = c;
  }
  return out;
}

/**
 * Drop interior breakeven points that sit clearly off the curve (a single illiquid/mispriced
 * bond), so downstream forwards and heatmaps aren't skewed by one outlier. Same rule as the
 * per-pair de-noise: dropped if it deviates from the neighbour interpolation by > tolPp.
 */
export function denoiseBreakevens(series: BreakevenPoint[], tolPp = 0.02): BreakevenPoint[] {
  if (series.length <= 2) return series;
  const kept: BreakevenPoint[] = [series[0]];
  for (let i = 1; i < series.length - 1; i++) {
    const a = series[i - 1], b = series[i + 1], c = series[i];
    const w = b.years === a.years ? 0 : (c.years - a.years) / (b.years - a.years);
    const interp = a.breakeven + w * (b.breakeven - a.breakeven);
    if (Math.abs(c.breakeven - interp) <= tolPp) kept.push(c);
  }
  kept.push(series[series.length - 1]);
  return kept;
}

/** Convenience: pick the longest-horizon breakeven point (the "hasta [fecha]" headline). */
export function headlinePoint(series: BreakevenPoint[]): BreakevenPoint | null {
  if (series.length === 0) return null;
  return series.reduce((a, b) => (b.days > a.days ? b : a));
}

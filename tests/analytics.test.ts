import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  interpolateRate,
  breakevenInflation,
  breakevenDeval,
  forwardRate,
  buildBreakevenSeries,
  monthlyBreakevenPath,
  toMonthly,
  sensitivity,
} from '../lib/analytics.ts';
import type { CurveNode } from '../lib/types.ts';

const approx = (a: number, b: number, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) < eps, `expected ${a} ≈ ${b}`);

test('interpolateRate is linear inside range and null outside', () => {
  const pts = [
    { years: 1, rate: 0.30 },
    { years: 2, rate: 0.40 },
  ];
  approx(interpolateRate(pts, 1.5)!, 0.35);
  approx(interpolateRate(pts, 1)!, 0.30);
  assert.equal(interpolateRate(pts, 0.5), null); // no extrapolation
  assert.equal(interpolateRate(pts, 3), null);
});

test('breakeven inflation uses multiplicative Fisher, not subtraction', () => {
  // Nominal 60%, real 10% -> (1.6/1.1)-1 = 0.4545..., NOT 0.50
  const be = breakevenInflation(0.60, 0.10);
  approx(be, 1.6 / 1.1 - 1);
  assert.ok(Math.abs(be - 0.50) > 0.04, 'should differ materially from additive 50%');
});

test('breakeven devaluation mirrors the inflation formula', () => {
  approx(breakevenDeval(0.50, 0.05), 1.5 / 1.05 - 1);
});

test('forwardRate strips the segment correctly and round-trips', () => {
  // Flat cumulative rate -> forward equals the same rate.
  approx(forwardRate(0.30, 1, 0.30, 2)!, 0.30, 1e-9);
  // Compose: (1+f)^(t2-t1) * (1+x1)^t1 == (1+x2)^t2
  const x1 = 0.40, t1 = 1, x2 = 0.30, t2 = 2.5;
  const f = forwardRate(x1, t1, x2, t2)!;
  approx(Math.pow(1 + x1, t1) * Math.pow(1 + f, t2 - t1), Math.pow(1 + x2, t2), 1e-9);
  assert.equal(forwardRate(0.3, 2, 0.3, 1), null); // t2 <= t1
});

test('buildBreakevenSeries only uses the overlap and is non-empty when curves overlap', () => {
  const mk = (t: string, days: number, tir: number, family: CurveNode['family']): CurveNode => ({
    ticker: t, nombre: t, family, days, years: days / 365, tir, md: null,
    vencimiento: null, precio: null, varDia: null,
  });
  const fija = [mk('F1', 90, 0.50, 'fija'), mk('F2', 365, 0.45, 'fija'), mk('F3', 730, 0.42, 'fija')];
  const cer = [mk('C1', 180, 0.10, 'cer'), mk('C2', 540, 0.09, 'cer')];
  const series = buildBreakevenSeries(fija, cer, 'inflation');
  assert.ok(series.length >= 2);
  // Every anchor must be within the overlap [180, 540] days.
  for (const p of series) assert.ok(p.days >= 180 && p.days <= 540);
  // Breakeven must equal the Fisher combination of the interpolated legs.
  for (const p of series) approx(p.breakeven, (1 + p.iNom) / (1 + p.other) - 1);
});

const node = (ticker: string, days: number, tir: number, family: CurveNode['family']): CurveNode => ({
  ticker, nombre: ticker, family, days, years: days / 365, tir, md: null,
  vencimiento: null, precio: null, varDia: null,
});

test('monthlyBreakevenPath: one point per bond pair, flat breakeven -> flat monthly TEM', () => {
  // fija ~35%, CER ~4% at every maturity -> constant ~30% annual breakeven -> constant TEM.
  const fija = [90, 180, 270, 365, 545].map((d) => node(`F${d}`, d, 0.35, 'fija'));
  const cer = [95, 185, 275, 360, 540].map((d) => node(`C${d}`, d, (1.35 / 1.30) - 1, 'cer'));
  const be = (1.35 / 1.30) - 1; // ≈ what CER makes breakeven ≈ 0.30
  const path = monthlyBreakevenPath(fija, cer, 'inflation', Date.UTC(2026, 0, 1));
  // 5 maturities within ~20 days each pair -> ~5 points (not an interpolated monthly grid).
  assert.ok(path.length >= 4 && path.length <= 6, `expected ~5 pair points, got ${path.length}`);
  for (const p of path) approx(p.monthly, toMonthly(0.30), 3e-3);
  assert.ok(path.every((p) => p.tickers.length > 0));
  void be;
});

test('monthlyBreakevenPath: de-noises a single off-curve bond (no spike-and-dip)', () => {
  // CER curve with one illiquid outlier bond well off the line at ~2.35y.
  const fija = [40, 365, 820, 860, 1000, 1425].map((d) => node(`F${d}`, d, 0.25, 'fija'));
  const cer = [
    node('C1', 40, 0.05, 'cer'), node('C2', 365, 0.05, 'cer'),
    node('C3', 820, 0.085, 'cer'), node('OUT', 860, 0.02, 'cer'), // outlier: real rate way off
    node('C5', 1000, 0.085, 'cer'), node('C6', 1425, 0.08, 'cer'),
  ];
  const path = monthlyBreakevenPath(fija, cer, 'inflation', Date.UTC(2026, 0, 1));
  const maxMonthly = Math.max(...path.map((p) => p.monthly));
  assert.ok(maxMonthly < 0.03, `no segment should spike above 3% monthly, got ${(maxMonthly * 100).toFixed(1)}%`);
});

test('sensitivity lines cross at the breakeven', () => {
  const iNom = 0.60, rReal = 0.10;
  const be = breakevenInflation(iNom, rReal);
  const rows = sensitivity(iNom, rReal, [be]);
  approx(rows[0].fija, rows[0].linked, 1e-9); // at x = breakeven, fixed real return == CER real rate
});

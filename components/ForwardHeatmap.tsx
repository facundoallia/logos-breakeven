'use client';
import { useMemo } from 'react';
import { buildForwardMatrix, denoiseBreakevens, BreakevenPoint } from '@/lib/analytics';
import { pct, shortDate, horizon } from '@/lib/format';
import { InfoTip } from './InfoTip';

interface Props {
  series: BreakevenPoint[];
  kindLabel: string; // "inflación" | "devaluación"
}

type RGB = [number, number, number];

/** Linear blend between two RGB colors, t in [0,1]. */
function blend(a: RGB, b: RGB, t: number): string {
  const u = Math.max(0, Math.min(1, t));
  const c = a.map((av, i) => Math.round(av + (b[i] - av) * u));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function quantile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

// Diverging palette: below-median -> cool, median -> neutral, above-median -> warm.
const COOL: RGB = [199, 224, 244]; // soft blue
const MID: RGB = [255, 246, 214];  // pale amber
const HOT: RGB = [214, 40, 40];    // red

/**
 * Heatmap of FORWARD breakevens: each cell (fila = desde, columna = hasta) is the
 * annualized rate the market implies for the segment between those two maturities.
 * Colors use a diverging scale centred on the median and clamped to the p10–p90 range,
 * so the map isn't washed out to a single colour by a few extreme cells.
 */
export function ForwardHeatmap({ series, kindLabel }: Props) {
  const clean = useMemo(() => denoiseBreakevens(series), [series]);
  const matrix = useMemo(() => buildForwardMatrix(clean), [clean]);

  const values = matrix.flat().map((c) => c.forward).filter((v): v is number => v != null);
  if (values.length === 0) {
    return <div style={{ fontSize: 13, color: '#8ba5bf', padding: 12 }}>Datos insuficientes para forwards.</div>;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = quantile(sorted, 0.5);
  const lo = quantile(sorted, 0.10);
  const hi = quantile(sorted, 0.90);

  const cellColor = (v: number): { bg: string; dark: boolean } => {
    let t: number; // 0 = coolest, 0.5 = mid, 1 = hottest
    if (v <= mid) t = mid > lo ? 0.5 * ((v - lo) / (mid - lo)) : 0.25;
    else t = hi > mid ? 0.5 + 0.5 * ((v - mid) / (hi - mid)) : 0.75;
    t = Math.max(0, Math.min(1, t));
    const bg = t <= 0.5 ? blend(COOL, MID, t / 0.5) : blend(MID, HOT, (t - 0.5) / 0.5);
    return { bg, dark: t > 0.72 };
  };

  const labels = clean.map((p) => (p.vencimiento ? shortDate(p.vencimiento) : horizon(p.years)));

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 6, display: 'flex', alignItems: 'center' }}>
        Forwards de {kindLabel}
        <InfoTip text={`Cada celda es la ${kindLabel} anualizada que el mercado descuenta SOLO para el tramo entre dos vencimientos (por ejemplo, entre 2027 y 2028), no el promedio desde hoy. Sirve para ver cómo el mercado espera que evolucione a futuro.`} />
      </div>
      {/* Leyenda de escala */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: '#8ba5bf', marginBottom: 8 }}>
        <span>menor</span>
        <span style={{ display: 'inline-block', width: 90, height: 8, borderRadius: 2, background: `linear-gradient(90deg, ${blend(COOL, MID, 0)}, ${blend(MID, MID, 0)}, ${blend(MID, HOT, 1)})` }} />
        <span>mayor {kindLabel}</span>
        <span style={{ marginLeft: 4 }}>(p10–p90)</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ padding: 4, color: '#8ba5bf', fontWeight: 600, textAlign: 'right' }}>desde \ hasta</th>
              {labels.map((l, j) => (
                <th key={j} style={{ padding: '4px 6px', color: '#4a6880', fontWeight: 600, whiteSpace: 'nowrap' }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td style={{ padding: '4px 6px', color: '#4a6880', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{labels[i]}</td>
                {row.map((cell, j) => {
                  if (cell.forward == null) {
                    return <td key={j} style={{ background: '#F8FAFC', border: '1px solid #EEF2F7' }} />;
                  }
                  const { bg, dark } = cellColor(cell.forward);
                  return (
                    <td
                      key={j}
                      title={`${labels[i]} → ${labels[j]}: ${pct(cell.forward)} anualizado`}
                      style={{
                        background: bg, color: dark ? '#fff' : '#0D1B2A',
                        border: '1px solid #fff', padding: '5px 8px', textAlign: 'center',
                        fontWeight: 600, whiteSpace: 'nowrap',
                      }}
                    >
                      {pct(cell.forward, 1)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

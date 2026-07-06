'use client';
import { useMemo } from 'react';
import { buildForwardMatrix, BreakevenPoint } from '@/lib/analytics';
import { pct, shortDate, horizon } from '@/lib/format';
import { InfoTip } from './InfoTip';

interface Props {
  series: BreakevenPoint[];
  kindLabel: string; // "inflación" | "devaluación"
}

/** Linear blend between two hex colors, t in [0,1]. */
function blend(a: [number, number, number], b: [number, number, number], t: number): string {
  const c = a.map((av, i) => Math.round(av + (b[i] - av) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/**
 * Heatmap of FORWARD breakevens: each cell (fila = desde, columna = hasta) is the
 * annualized rate the market implies for the segment between those two maturities.
 * The diagonal/lower triangle is empty (only forward-looking segments make sense).
 */
export function ForwardHeatmap({ series, kindLabel }: Props) {
  const matrix = useMemo(() => buildForwardMatrix(series), [series]);

  const values = matrix.flat().map((c) => c.forward).filter((v): v is number => v != null);
  if (values.length === 0) {
    return <div style={{ fontSize: 13, color: '#8ba5bf', padding: 12 }}>Datos insuficientes para forwards.</div>;
  }
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const COOL: [number, number, number] = [235, 245, 251]; // #EBF5FB
  const HOT: [number, number, number] = [220, 38, 38];     // #DC2626

  const labels = series.map((p) => (p.vencimiento ? shortDate(p.vencimiento) : horizon(p.years)));

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 6, display: 'flex', alignItems: 'center' }}>
        Forwards de {kindLabel}
        <InfoTip text={`Cada celda es la ${kindLabel} anualizada que el mercado descuenta SOLO para el tramo entre dos vencimientos (por ejemplo, entre 2027 y 2028), no el promedio desde hoy. Sirve para ver cómo el mercado espera que evolucione a futuro.`} />
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
                  const t = hi > lo ? (cell.forward - lo) / (hi - lo) : 0.5;
                  const bg = blend(COOL, HOT, t);
                  return (
                    <td
                      key={j}
                      title={`${labels[i]} → ${labels[j]}: ${pct(cell.forward)} anualizado`}
                      style={{
                        background: bg, color: t > 0.55 ? '#fff' : '#0D1B2A',
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

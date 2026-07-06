'use client';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList,
} from 'recharts';
import { MonthlyPathPoint } from '@/lib/analytics';
import { monthAxis } from '@/lib/format';
import { InfoTip } from './InfoTip';

interface Props {
  path: MonthlyPathPoint[];
  color: string;
  kindLabel: string; // "inflación" | "devaluación"
}

/**
 * Monthly implied breakeven path — the "sendero". One point per calendar month with
 * its implied monthly rate (TEM), labelled on each dot, like the 1816/BCRA charts.
 * Everything here is forward-looking (implied by today's bond prices).
 */
export function SenderoChart({ path, color, kindLabel }: Props) {
  if (path.length < 2) {
    return <div style={{ fontSize: 13, color: '#8ba5bf', padding: 12 }}>Datos insuficientes para el sendero mensual.</div>;
  }

  const rows = path.map((p) => ({ label: monthAxis(p.date), monthly: +(p.monthly * 100).toFixed(2), tickers: p.tickers }));
  const vals = rows.map((r) => r.monthly);
  const yMax = Math.ceil(Math.max(...vals) + 0.5);
  const yMin = Math.max(0, Math.floor(Math.min(...vals) - 0.5));

  return (
    <div>
      <div style={{ fontSize: 12.5, color: '#4a6880', marginBottom: 8, display: 'flex', alignItems: 'center', lineHeight: 1.5 }}>
        {kindLabel === 'inflación' ? 'Inflación' : 'Devaluación'} mensual (TEM) implícita en cada tramo.
        <strong>&nbsp;Cada punto es un par de bonos</strong> que vencen en la misma fecha; el espaciado
        sigue los vencimientos reales.
        <InfoTip text={`Cada punto compara un bono a tasa fija con uno ${kindLabel === 'inflación' ? 'CER' : 'dollar-linked'} que vencen juntos (par). Entre pares consecutivos se calcula el forward: cuánta ${kindLabel} por mes implica ese tramo. Es forward-looking, sale de los precios de hoy. Pasá el mouse para ver el par.`} />
      </div>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 24, right: 16, bottom: 46, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" vertical={false} />
            <XAxis
              dataKey="label" interval={0} angle={-60} textAnchor="end" height={50}
              tick={{ fontSize: 9.5, fill: '#8ba5bf' }}
            />
            <YAxis
              domain={[yMin, yMax]} tickFormatter={(v) => `${(+v).toFixed(0)}%`}
              tick={{ fontSize: 10, fill: '#8ba5bf' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as { monthly: number; tickers: string };
                return (
                  <div style={{ background: '#fff', border: '1px solid #DDE6EF', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: '#0D1B2A' }}>{String(label)}</div>
                    <div style={{ color }}>{d.monthly.toFixed(2)}% mensual</div>
                    {d.tickers && <div style={{ fontSize: 10.5, color: '#8ba5bf', marginTop: 2 }}>par: {d.tickers}</div>}
                  </div>
                );
              }}
            />
            <Line
              dataKey="monthly" stroke={color} strokeWidth={2.5} strokeDasharray="6 4"
              dot={{ r: 3.5, fill: color }} type="monotone" isAnimationActive={false}
            >
              <LabelList dataKey="monthly" position="top" offset={8}
                formatter={(v) => (typeof v === 'number' ? v.toFixed(1) : `${v ?? ''}`)}
                style={{ fontSize: 9.5, fill: color, fontWeight: 600 }} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

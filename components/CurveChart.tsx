'use client';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { yearsToMonthYear } from '@/lib/format';

export interface CurveSeries {
  name: string;
  color: string;
  /** Points as {years, rate(decimal)}. */
  data: { years: number; rate: number }[];
  dashed?: boolean;
}

interface Props {
  series: CurveSeries[];
  height?: number;
  yLabel?: string;
}

/**
 * Overlay of one or more term structures: effective annual rate (%) vs horizon (years).
 * Each family/breakeven is a coloured line. Uses a merged x-domain so lines share an axis.
 */
export function CurveChart({ series, height = 300, yLabel = 'Tasa anual (%)' }: Props) {
  // Merge all points onto rows keyed by years so Recharts can align multiple lines.
  const yearsSet = new Set<number>();
  for (const s of series) for (const p of s.data) yearsSet.add(+p.years.toFixed(3));
  const xs = [...yearsSet].sort((a, b) => a - b);

  const rows = xs.map((x) => {
    const row: Record<string, number | null> = { years: x };
    for (const s of series) {
      const match = s.data.find((p) => +p.years.toFixed(3) === x);
      row[s.name] = match ? +(match.rate * 100).toFixed(2) : null;
    }
    return row;
  });

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 20, bottom: 34, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
          <XAxis
            dataKey="years" type="number" domain={['dataMin', 'dataMax']}
            tickFormatter={(v) => yearsToMonthYear(+v)}
            tick={{ fontSize: 9.5, fill: '#8ba5bf' }}
            angle={-30} textAnchor="end" height={44}
            label={{ value: 'Vencimiento', position: 'insideBottom', offset: 0, fontSize: 10, fill: '#8ba5bf' }}
          />
          <YAxis
            tickFormatter={(v) => `${(+v).toFixed(0)}%`}
            tick={{ fontSize: 10, fill: '#8ba5bf' }}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 10, fill: '#8ba5bf' }}
          />
          <Tooltip
            formatter={(v) => (typeof v === 'number' ? `${v.toFixed(2)}%` : '—')}
            labelFormatter={(v) => `Vencimiento: ${yearsToMonthYear(+v)}`}
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #DDE6EF' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) => (
            <Line
              key={s.name} dataKey={s.name} stroke={s.color} strokeWidth={2}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              dot={{ r: 3, fill: s.color }} connectNulls type="monotone"
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

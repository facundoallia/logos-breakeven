'use client';
import {
  ComposedChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { BreakevenPoint, projectFx } from '@/lib/analytics';
import { ars, shortDate, yearsToMonthYear } from '@/lib/format';

interface Props {
  series: BreakevenPoint[];
  spot: number;
  spotDate: string | null;
}

/**
 * Implied path of the OFFICIAL wholesale dollar (~A3500): the market-priced level
 * at each maturity = spot × (1 + devaluación implícita)^años. Starts at today's spot.
 */
export function FxPathChart({ series, spot, spotDate }: Props) {
  const rows = [
    { years: 0, fx: Math.round(spot), label: 'hoy' },
    ...series.map((p) => ({
      years: +p.years.toFixed(3),
      fx: Math.round(projectFx(spot, p.breakeven, p.years)),
      label: p.vencimiento ? shortDate(p.vencimiento) : `${p.years.toFixed(1)}a`,
    })),
  ];
  const last = rows[rows.length - 1];

  return (
    <div>
      <div style={{ fontSize: 12.5, color: '#4a6880', marginBottom: 8, lineHeight: 1.5 }}>
        Nivel del <strong>dólar oficial mayorista (~A3500)</strong> que descuenta el mercado en cada
        vencimiento. Hoy: <strong style={{ color: '#0D1B2A' }}>{ars(spot)}</strong>
        {spotDate ? ` (${shortDate(spotDate)})` : ''} → implícito a {last.label}:{' '}
        <strong style={{ color: '#3b1a56' }}>{ars(last.fx)}</strong>.
      </div>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 20, bottom: 34, left: 10 }}>
            <defs>
              <linearGradient id="fxfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b1a56" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#3b1a56" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
            <XAxis
              dataKey="years" type="number" domain={[0, 'dataMax']}
              tickFormatter={(v) => yearsToMonthYear(+v)}
              tick={{ fontSize: 9.5, fill: '#8ba5bf' }}
              angle={-30} textAnchor="end" height={44}
              label={{ value: 'Vencimiento', position: 'insideBottom', offset: 0, fontSize: 10, fill: '#8ba5bf' }}
            />
            <YAxis
              tickFormatter={(v) => `$${Math.round(+v).toLocaleString('es-AR')}`}
              tick={{ fontSize: 10, fill: '#8ba5bf' }}
              domain={['dataMin', 'dataMax']} width={64}
            />
            <Tooltip
              formatter={(v) => (typeof v === 'number' ? ars(v) : '—')}
              labelFormatter={(v) => yearsToMonthYear(+v)}
              contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #DDE6EF' }}
            />
            <ReferenceLine y={Math.round(spot)} stroke="#8ba5bf" strokeDasharray="4 3"
              label={{ value: `hoy ${ars(spot)}`, fontSize: 10, fill: '#8ba5bf', position: 'insideTopLeft' }} />
            <Area dataKey="fx" stroke="none" fill="url(#fxfill)" isAnimationActive={false} />
            <Line dataKey="fx" name="Dólar oficial implícito" stroke="#3b1a56" strokeWidth={2}
              dot={{ r: 3, fill: '#3b1a56' }} type="monotone" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

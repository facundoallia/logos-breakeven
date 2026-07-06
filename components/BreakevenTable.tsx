'use client';
import { BreakevenPoint, toMonthly } from '@/lib/analytics';
import { pct, shortDate, horizon } from '@/lib/format';
import { InfoTip } from './InfoTip';

interface Props {
  series: BreakevenPoint[];
  kind: 'inflation' | 'deval';
}

/** Term-structure table: for each horizon, the two legs and the implied breakeven,
 *  each shown as annual (TEA) with the monthly (TEM) below — the monthly is more
 *  direct for the short end. */
export function BreakevenTable({ series, kind }: Props) {
  const isInfl = kind === 'inflation';
  const otherLabel = isInfl ? 'Tasa real (CER)' : 'Tasa dollar-linked';
  const beLabel = isInfl ? 'Inflación implícita' : 'Devaluación implícita';

  const th: React.CSSProperties = { padding: '8px 10px', textAlign: 'right', fontSize: 11, color: '#4a6880', fontWeight: 600, borderBottom: '2px solid #DDE6EF', whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '7px 10px', textAlign: 'right', borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap' };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ fontSize: 11, color: '#8ba5bf', marginBottom: 6 }}>
        Cada tasa: <strong>anual (TEA)</strong> arriba · <span style={{ color: '#4a6880' }}>mensual (TEM)</span> abajo
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'left' }}>Vencimiento</th>
            <th style={th}>Plazo</th>
            <th style={th}>Tasa fija (nominal)</th>
            <th style={th}>{otherLabel}</th>
            <th style={{ ...th, color: '#1F4E79' }}>
              {beLabel}
              <InfoTip text={isInfl
                ? 'Inflación que iguala el rendimiento de un bono a tasa fija con uno CER hasta ese vencimiento. Fisher: (1+tasa fija)/(1+tasa real) − 1. La mensual (TEM) es más directa en el tramo corto.'
                : 'Devaluación del dólar OFICIAL que iguala un bono a tasa fija con uno dollar-linked: (1+tasa fija)/(1+tasa DLK) − 1. La mensual (TEM) es más directa en el tramo corto.'} />
            </th>
          </tr>
        </thead>
        <tbody>
          {series.map((p) => (
            <tr key={p.days}>
              <td style={{ ...td, textAlign: 'left', fontSize: 12.5, color: '#0D1B2A' }}>{p.vencimiento ? shortDate(p.vencimiento) : '—'}</td>
              <td style={{ ...td, fontSize: 12.5, color: '#0D1B2A' }}>{horizon(p.years)}</td>
              <RateCell annual={p.iNom} td={td} />
              <RateCell annual={p.other} td={td} />
              <RateCell annual={p.breakeven} td={td} accent />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RateCell({ annual, td, accent }: { annual: number; td: React.CSSProperties; accent?: boolean }) {
  return (
    <td style={td}>
      <div style={{ fontSize: 13, fontWeight: 700, color: accent ? '#1F4E79' : '#0D1B2A' }}>{pct(annual)}</div>
      <div style={{ fontSize: 10.5, color: '#8ba5bf' }}>{pct(toMonthly(annual), 1)} m.</div>
    </td>
  );
}

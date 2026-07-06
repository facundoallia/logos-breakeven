'use client';
import { CurveNode } from '@/lib/types';
import { CurveChart, CurveSeries } from './CurveChart';
import { Section } from './Section';
import { InfoTip } from './InfoTip';
import { toMonthly } from '@/lib/analytics';
import { pct, shortDate, horizon } from '@/lib/format';

interface Props {
  fija: CurveNode[];
  cer: CurveNode[];
  dlk: CurveNode[];
}

const FAMILY_META = {
  fija: { label: 'Tasa fija (nominal en $)', color: '#1F4E79', tip: 'Rendimiento nominal en pesos de LECAPs y bonos a tasa fija (TIR efectiva anual).' },
  cer:  { label: 'CER (tasa real)', color: '#16A34A', tip: 'Rendimiento REAL (por encima de la inflación) de los bonos CER. Es la tasa real que descuenta el mercado.' },
  dlk:  { label: 'Dollar-linked (vs oficial)', color: '#3b1a56', tip: 'Rendimiento en dólares oficiales de los bonos dollar-linked, que ajustan por el tipo de cambio A3500.' },
} as const;

export function CurvesView({ fija, cer, dlk }: Props) {
  const chartSeries: CurveSeries[] = [
    { name: FAMILY_META.fija.label, color: FAMILY_META.fija.color, data: fija.map((n) => ({ years: n.years, rate: n.tir })) },
    { name: FAMILY_META.cer.label, color: FAMILY_META.cer.color, data: cer.map((n) => ({ years: n.years, rate: n.tir })) },
    { name: FAMILY_META.dlk.label, color: FAMILY_META.dlk.color, data: dlk.map((n) => ({ years: n.years, rate: n.tir })) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Section title="Curvas de rendimiento por familia">
        <div style={{ fontSize: 12.5, color: '#4a6880', marginBottom: 10, lineHeight: 1.5 }}>
          Cada familia mide algo distinto: la <strong>fija</strong> es rendimiento nominal en pesos,
          el <strong>CER</strong> es tasa real, y el <strong>dollar-linked</strong> es rendimiento en dólar oficial.
          Comparar la fija contra las otras dos es lo que da la inflación y la devaluación implícitas.
        </div>
        <CurveChart series={chartSeries} height={320} />
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <NodesTable title={FAMILY_META.cer.label} tip={FAMILY_META.cer.tip} nodes={cer} rateHeader="Tasa real" />
        <NodesTable title={FAMILY_META.fija.label} tip={FAMILY_META.fija.tip} nodes={fija} rateHeader="TIR nominal" />
        <NodesTable title={FAMILY_META.dlk.label} tip={FAMILY_META.dlk.tip} nodes={dlk} rateHeader="TIR en USD of." />
      </div>
    </div>
  );
}

function NodesTable({ title, tip, nodes, rateHeader }: { title: string; tip: string; nodes: CurveNode[]; rateHeader: string }) {
  const th: React.CSSProperties = { padding: '6px 8px', textAlign: 'right', fontSize: 10.5, color: '#4a6880', fontWeight: 600, borderBottom: '2px solid #DDE6EF' };
  const td: React.CSSProperties = { padding: '5px 8px', textAlign: 'right', fontSize: 12, color: '#0D1B2A', borderBottom: '1px solid #EEF2F7', whiteSpace: 'nowrap' };
  return (
    <Section title={title}>
      <div style={{ fontSize: 11, color: '#8ba5bf', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
        <InfoTip text={tip} /> <span style={{ marginLeft: 6 }}>{nodes.length} instrumentos</span>
      </div>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'left' }}>Ticker</th>
            <th style={th}>Vto.</th>
            <th style={th}>Plazo</th>
            <th style={th}>{rateHeader}</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((n) => (
            <tr key={n.ticker}>
              <td style={{ ...td, textAlign: 'left', fontWeight: 600 }}>{n.ticker}</td>
              <td style={td}>{shortDate(n.vencimiento)}</td>
              <td style={td}>{horizon(n.years)}</td>
              <td style={td}>
                <div style={{ fontWeight: 700 }}>{pct(n.tir)}</div>
                <div style={{ fontSize: 10, color: '#8ba5bf' }}>{pct(toMonthly(n.tir), 1)} m.</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  );
}

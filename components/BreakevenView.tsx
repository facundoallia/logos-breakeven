'use client';
import { useMemo } from 'react';
import { CurveNode } from '@/lib/types';
import { buildBreakevenSeries, monthlyBreakevenPath, BreakevenPoint, toMonthly, projectFx } from '@/lib/analytics';
import { CurveChart, CurveSeries } from './CurveChart';
import { BreakevenTable } from './BreakevenTable';
import { ForwardHeatmap } from './ForwardHeatmap';
import { SensitivityPanel } from './SensitivityPanel';
import { SenderoChart } from './SenderoChart';
import { FxPathChart } from './FxPathChart';
import { Section } from './Section';
import { InfoTip } from './InfoTip';
import { pct, ars, monthYear, horizon } from '@/lib/format';

interface Props {
  nominal: CurveNode[];
  other: CurveNode[];
  kind: 'inflation' | 'deval';
  /** Current wholesale USD spot — only used for the deval FX projection. */
  spot?: number | null;
  spotDate?: string | null;
}

function nearestToOneYear(series: BreakevenPoint[]): BreakevenPoint {
  return series.reduce((a, b) => (Math.abs(b.years - 1) < Math.abs(a.years - 1) ? b : a));
}

/** Pick short / ~1y / long representative points (deduped) — the term structure at a glance. */
function representativePoints(series: BreakevenPoint[]): BreakevenPoint[] {
  if (series.length === 0) return [];
  const first = series[0];
  const last = series[series.length - 1];
  const mid = nearestToOneYear(series);
  const picked = [first, mid, last].filter((p, i, arr) => arr.findIndex((q) => q.days === p.days) === i);
  return picked;
}

export function BreakevenView({ nominal, other, kind, spot, spotDate }: Props) {
  const series = useMemo(() => buildBreakevenSeries(nominal, other, kind), [nominal, other, kind]);

  const isInfl = kind === 'inflation';
  const otherName = isInfl ? 'Tasa real (CER)' : 'Tasa dollar-linked';
  const beName = isInfl ? 'Inflación implícita' : 'Devaluación implícita';
  const accent = isInfl ? '#1F4E79' : '#3b1a56';

  if (series.length === 0) {
    return (
      <div style={{ padding: 20, fontSize: 13, color: '#8ba5bf', textAlign: 'center' }}>
        No hay suficiente superposición de plazos entre las curvas para calcular el breakeven en este momento.
      </div>
    );
  }

  const reps = representativePoints(series);
  const head = nearestToOneYear(series); // sensitivity anchored on the ~1y point
  const showFx = !isInfl && spot != null && spot > 0;
  const sendero = useMemo(() => monthlyBreakevenPath(nominal, other, kind), [nominal, other, kind]);

  const chartSeries: CurveSeries[] = [
    { name: 'Tasa fija (nominal)', color: '#1F4E79', data: series.map((p) => ({ years: p.years, rate: p.iNom })) },
    { name: otherName, color: '#16A34A', data: series.map((p) => ({ years: p.years, rate: p.other })) },
    { name: beName, color: isInfl ? '#D97706' : '#3b1a56', dashed: true, data: series.map((p) => ({ years: p.years, rate: p.breakeven })) },
  ];

  const heroTitle = isInfl ? '¿Cuánta inflación espera el mercado?' : '¿Cuánto espera el mercado que suba el dólar oficial?';
  const heroTip = isInfl
    ? 'Se obtiene comparando un bono a tasa fija con uno CER al mismo plazo (ecuación de Fisher): (1 + tasa fija) / (1 + tasa real) − 1. Es lo que descuentan los precios, no un pronóstico oficial.'
    : 'Se obtiene comparando un bono a tasa fija con uno dollar-linked al mismo plazo: (1 + tasa fija) / (1 + tasa dollar-linked) − 1. Es contra el dólar oficial mayorista (A3500).';
  const heroIntro = isInfl
    ? 'Inflación promedio anual que hoy descuentan los precios de los bonos. Cambia según hasta cuándo mires: abajo, el tramo corto, cerca de un año y el plazo más largo disponible.'
    : 'Devaluación promedio anual del dólar oficial (A3500) que descuentan los bonos, según el plazo.';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* HERO — bloque principal: qué espera el mercado, con los plazos clave */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#0D1B2A', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center' }}>
          {heroTitle}<InfoTip text={heroTip} />
        </h2>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#4a6880', lineHeight: 1.5, maxWidth: 640 }}>
          {heroIntro}
        </p>

        {/* Term-structure summary chips (corto / ~1 año / largo) — auto-fit wraps on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          {reps.map((p, i) => {
            const tag = i === 0 ? 'Corto plazo' : i === reps.length - 1 ? 'Largo plazo' : 'Cerca de 1 año';
            return (
              <div key={p.days} style={{
                background: '#fff', border: '1px solid #DDE6EF', borderLeft: `3px solid ${accent}`,
                borderRadius: 8, padding: '13px 15px',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent, marginBottom: 5 }}>
                  {tag}
                </div>
                <div style={{ fontSize: 11.5, color: '#4a6880', marginBottom: 3 }}>
                  Promedio hasta <strong style={{ color: '#0D1B2A' }}>{monthYear(p.vencimiento)}</strong> ({horizon(p.years)})
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1.05, letterSpacing: '-0.5px' }}>
                    {pct(p.breakeven, 1)}
                  </span>
                  <span style={{ fontSize: 12, color: '#4a6880', fontWeight: 600 }}>anual</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#4a6880', marginTop: 3 }}>
                  equivale a <strong style={{ color: '#0D1B2A' }}>{pct(toMonthly(p.breakeven), 1)}</strong> por mes
                </div>
                {showFx && (
                  <div style={{ fontSize: 11.5, color: '#4a6880', marginTop: 7, paddingTop: 7, borderTop: '1px dashed #BDD0E0' }}>
                    dólar oficial ~<strong style={{ color: '#3b1a56' }}>{ars(projectFx(spot!, p.breakeven, p.years))}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <CaveatNote kind={kind} />

      <Section title={isInfl ? 'Sendero de inflación breakeven mensual (Lecap–Boncer)' : 'Sendero de devaluación breakeven mensual'}>
        <SenderoChart path={sendero} color={accent} kindLabel={isInfl ? 'inflación' : 'devaluación'} />
      </Section>

      <Section title={`Curvas: tasa fija vs ${isInfl ? 'CER' : 'dollar-linked'} y ${beName.toLowerCase()}`}>
        <CurveChart series={chartSeries} height={300} />
      </Section>

      {showFx && (
        <Section title="Sendero del dólar oficial implícito">
          <FxPathChart series={series} spot={spot!} spotDate={spotDate ?? null} />
        </Section>
      )}

      <Section title="Heatmap de forwards">
        <ForwardHeatmap series={series} kindLabel={isInfl ? 'inflación' : 'devaluación'} />
      </Section>

      <Section title="Sensibilidad">
        <SensitivityPanel iNom={head.iNom} linkedRate={head.other} breakeven={head.breakeven} kind={kind} />
      </Section>

      {/* Tabla detallada — al final, desplegable (referencia) */}
      <Section title={`${beName} por plazo (detalle)`} collapsible defaultOpen={false}>
        <BreakevenTable series={series} kind={kind} />
      </Section>
    </div>
  );
}

/**
 * Warns that the near-term reading is distorted by the accrual lag: CER bonds adjust
 * with ~45 days lag (and the previous month's CPI may not be published yet), so the
 * shortest-tenor breakeven mixes already-known accrual with expectations.
 */
function CaveatNote({ kind }: { kind: 'inflation' | 'deval' }) {
  const isInfl = kind === 'inflation';
  return (
    <div style={{
      background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8,
      padding: '10px 12px', fontSize: 12, color: '#0D1B2A', lineHeight: 1.5,
      display: 'flex', gap: 8, alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: 15 }}>⚠️</span>
      <div>
        {isInfl ? (
          <>
            <strong>A tener en cuenta en el tramo más corto.</strong> Los bonos CER ajustan con ~45 días de rezago
            y el dato de inflación del mes anterior puede no estar publicado todavía, por lo que buena parte
            del ajuste del bono más corto ya está <em>devengado</em> (conocido). En plazos cortos conviene
            observar la <strong>tasa mensual (TEM)</strong>, más directa que la anualizada.
            <InfoTip text="Ejemplo: a comienzos de un mes, un LECER que vence a fin de ese mes ya tiene devengada casi toda la inflación del mes anterior (que el INDEC publica a mitad de mes). Su tasa real 'de mercado' incorpora ese dato ya conocido, no una expectativa pura." />
          </>
        ) : (
          <>
            <strong>Devaluación del dólar oficial (A3500).</strong> Los dollar-linked ajustan casi sin
            rezago, pero en el tramo muy corto la anualización exagera: mirá la <strong>tasa mensual (TEM)</strong>,
            que refleja mejor el ritmo esperado de devaluación mes a mes.
            <InfoTip text="No confundir con CCL/MEP: acá la devaluación implícita es contra el tipo de cambio oficial (comunicación A3500 del BCRA), que es a lo que ajustan los bonos dollar-linked." />
          </>
        )}
      </div>
    </div>
  );
}

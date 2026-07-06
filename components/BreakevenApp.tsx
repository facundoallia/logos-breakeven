'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { CurvesResponse } from '@/lib/types';
import { BreakevenView } from './BreakevenView';
import { CurvesView } from './CurvesView';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Tab = 'inflacion' | 'devaluacion' | 'curvas';

const TABS: { id: Tab; label: string }[] = [
  { id: 'inflacion', label: 'Inflación implícita' },
  { id: 'devaluacion', label: 'Devaluación implícita' },
  { id: 'curvas', label: 'Curvas y tasas reales' },
];

export function BreakevenApp() {
  const { data, error, isLoading } = useSWR<CurvesResponse>('/api/curves', fetcher, {
    refreshInterval: 120_000,
    revalidateOnFocus: false,
  });
  const [tab, setTab] = useState<Tab>('inflacion');

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 16px 40px' }}>
      {/* Header */}
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0D1B2A', letterSpacing: '-0.5px' }}>
          ¿Qué espera el mercado?
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4a6880', maxWidth: 660, lineHeight: 1.5 }}>
          Inflación y devaluación que el mercado de bonos del Tesoro descuenta hoy, extraídas
          comparando las curvas de tasa fija, CER y dollar-linked. El breakeven depende del plazo:
          mirá la curva completa, no un solo número.
        </p>
      </header>

      {/* Tabs */}
      <nav style={{ display: 'flex', gap: 4, borderBottom: '1px solid #DDE6EF', marginBottom: 18, flexWrap: 'wrap' }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                color: active ? '#1F4E79' : '#8ba5bf',
                borderBottom: `2px solid ${active ? '#1F4E79' : 'transparent'}`,
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      {isLoading && <Placeholder text="Cargando curvas de bonos…" />}
      {error && <Placeholder text="No se pudieron cargar los datos. Reintentá en unos minutos." />}
      {data && (
        <>
          {tab === 'inflacion' && <BreakevenView nominal={data.fija} other={data.cer} kind="inflation" />}
          {tab === 'devaluacion' && <BreakevenView nominal={data.fija} other={data.dlk} kind="deval" spot={data.dolarMayorista} spotDate={data.dolarFecha} />}
          {tab === 'curvas' && <CurvesView fija={data.fija} cer={data.cer} dlk={data.dlk} />}
        </>
      )}

      {/* Footer / disclaimer */}
      <footer style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid #DDE6EF', fontSize: 11, color: '#8ba5bf', lineHeight: 1.5 }}>
        {data?.asOf && <div>Datos al {new Date(data.asOf).toLocaleString('es-AR')} · Precios: data912.com (demorados) · Metadata/TIR: bonistas.com</div>}
        <div style={{ marginTop: 4 }}>
          La devaluación implícita se refiere al dólar <strong>oficial</strong> (A3500), no al CCL/MEP.
          Contenido educativo — no constituye recomendación de inversión.
        </div>
      </footer>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div style={{
      padding: 40, textAlign: 'center', color: '#8ba5bf', fontSize: 14,
      background: '#F8FAFC', border: '1px dashed #DDE6EF', borderRadius: 10,
    }}>
      {text}
    </div>
  );
}

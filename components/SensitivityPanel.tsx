'use client';
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend,
} from 'recharts';
import { sensitivity, scenarioGrid } from '@/lib/analytics';
import { pct } from '@/lib/format';
import { InfoTip } from './InfoTip';

interface Props {
  iNom: number;         // nominal (fija) effective annual rate, decimal
  linkedRate: number;   // CER real rate OR dollar-linked rate, decimal
  breakeven: number;    // decimal
  kind: 'inflation' | 'deval';
}

/**
 * Makes the breakeven tangible: slider over the realized inflation/devaluation.
 * The fixed-bond line and the linked-bond line CROSS exactly at the breakeven —
 * left of it the fixed bond wins, right of it the linked bond wins.
 */
export function SensitivityPanel({ iNom, linkedRate, breakeven, kind }: Props) {
  const [assumed, setAssumed] = useState(breakeven);

  const isInfl = kind === 'inflation';
  const scenarioName = isInfl ? 'inflación' : 'devaluación';
  const fijaLabel = 'Bono a tasa fija';
  const linkedLabel = isInfl ? 'Bono CER' : 'Bono dollar-linked';
  const retLabel = isInfl ? 'rendimiento real' : 'rendimiento en dólares';

  const spread = Math.max(0.15, breakeven * 0.9);
  const grid = scenarioGrid(breakeven, spread, 41);
  const rows = sensitivity(iNom, linkedRate, grid).map((r) => ({
    scenario: +(r.scenario * 100).toFixed(2),
    [fijaLabel]: +(r.fija * 100).toFixed(2),
    [linkedLabel]: +(r.linked * 100).toFixed(2),
  }));

  const fijaRet = (1 + iNom) / (1 + assumed) - 1;
  const linkedRet = linkedRate;
  const winner = Math.abs(fijaRet - linkedRet) < 0.003 ? 'empate'
    : fijaRet > linkedRet ? 'fija' : 'linked';

  const sliderMax = breakeven + spread;

  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #DDE6EF', borderRadius: 8, padding: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0D1B2A', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
        Análisis de sensibilidad: ¿fija o {linkedLabel.toLowerCase()}?
        <InfoTip text={`Deslizá para suponer cuánta ${scenarioName} habrá realmente. El bono a tasa fija te da un ${retLabel} de (1+tasa fija)/(1+${scenarioName}) − 1, mientras que el bono ${isInfl ? 'CER' : 'dollar-linked'} te asegura su tasa. Las dos líneas se cruzan justo en el breakeven.`} />
      </div>

      {/* Slider */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4a6880', marginBottom: 4 }}>
          <span>Suponé una {scenarioName} anual de:</span>
          <strong style={{ color: '#1F4E79', fontSize: 14 }}>{pct(assumed)}</strong>
        </div>
        <input
          type="range" min={0} max={+(sliderMax * 100).toFixed(0)} step={0.5}
          value={+(assumed * 100).toFixed(1)}
          onChange={(e) => setAssumed(Number(e.target.value) / 100)}
          style={{ width: '100%', accentColor: '#1F4E79' }}
        />
      </div>

      {/* Verdict */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <Metric label={`${fijaLabel} (${retLabel})`} value={pct(fijaRet)} highlight={winner === 'fija'} />
        <Metric label={`${linkedLabel} (${retLabel})`} value={pct(linkedRet)} highlight={winner === 'linked'} />
        <div style={{
          flex: '1 1 160px', minWidth: 160, padding: '8px 12px', borderRadius: 6,
          background: winner === 'empate' ? '#EBF5FB' : winner === 'fija' ? '#ECFDF3' : '#FEF3F2',
          border: `1px solid ${winner === 'empate' ? '#BDD0E0' : winner === 'fija' ? '#16A34A' : '#DC2626'}`,
          fontSize: 12.5, color: '#0D1B2A', display: 'flex', alignItems: 'center',
        }}>
          {winner === 'empate'
            ? `A ${pct(assumed)} de ${scenarioName} da casi lo mismo: estás en el breakeven.`
            : winner === 'fija'
              ? `A ${pct(assumed)} conviene la tasa FIJA (la ${scenarioName} resultaría menor a la que descuenta el mercado).`
              : `A ${pct(assumed)} conviene el bono ${isInfl ? 'CER' : 'DLK'} (la ${scenarioName} superaría el breakeven).`}
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 20, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#DDE6EF" />
            <XAxis
              dataKey="scenario" type="number" domain={['dataMin', 'dataMax']}
              tickFormatter={(v) => `${(+v).toFixed(0)}%`}
              tick={{ fontSize: 10, fill: '#8ba5bf' }}
              label={{ value: `${scenarioName} realizada`, position: 'insideBottom', offset: -10, fontSize: 10, fill: '#8ba5bf' }}
            />
            <YAxis tickFormatter={(v) => `${(+v).toFixed(0)}%`} tick={{ fontSize: 10, fill: '#8ba5bf' }} />
            <Tooltip
              formatter={(v) => (typeof v === 'number' ? `${v.toFixed(2)}%` : '—')}
              labelFormatter={(v) => `${scenarioName}: ${(+v).toFixed(1)}%`}
              contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #DDE6EF' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine x={+(breakeven * 100).toFixed(2)} stroke="#3b1a56" strokeDasharray="4 3"
              label={{ value: 'Breakeven', fontSize: 10, fill: '#3b1a56', position: 'top' }} />
            <ReferenceLine x={+(assumed * 100).toFixed(2)} stroke="#ffc107" strokeWidth={2} />
            <Line dataKey={fijaLabel} stroke="#1F4E79" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line dataKey={linkedLabel} stroke="#16A34A" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight: boolean }) {
  return (
    <div style={{
      flex: '1 1 120px', minWidth: 120, padding: '8px 12px', borderRadius: 6,
      background: '#fff', border: `1px solid ${highlight ? '#1F4E79' : '#DDE6EF'}`,
      boxShadow: highlight ? '0 0 0 1px #1F4E79' : 'none',
    }}>
      <div style={{ fontSize: 10.5, color: '#8ba5bf', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#0D1B2A' }}>{value}</div>
    </div>
  );
}

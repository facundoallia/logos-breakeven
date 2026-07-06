import { BondConfig, CurveNode, CurvesResponse, LiveBond, Family } from '@/lib/types';
import bondsList from '@/config/bonds-config.json';

const bonds = bondsList as BondConfig[];

/**
 * Builds the three Treasury yield curves (fija / CER / dollar-linked) used to
 * derive market-implied inflation and devaluation.
 *
 * Data pipeline mirrors the proven `bonos-logos` app:
 *   - data912.com/live/arg_bonds + arg_notes  -> live clean prices
 *   - bonistas.com/api/bonds (ONE bulk request) -> TIR, modified duration, dates
 *
 * bonistas `tir` is the EFFECTIVE ANNUAL yield as a decimal fraction (e.g. 0.42
 * for a 42% peso letra, 0.0995 for a 9.95% hard-dollar bond). We keep it as a
 * decimal here — analytics.ts expects decimals.
 */
export async function GET() {
  // 1) Live prices from data912 (bonds + letras)
  let bondsData: LiveBond[] = [];
  let notesData: LiveBond[] = [];
  try {
    const [r1, r2] = await Promise.all([
      fetch('https://data912.com/live/arg_bonds', { next: { revalidate: 60 } }),
      fetch('https://data912.com/live/arg_notes', { next: { revalidate: 60 } }),
    ]);
    if (r1.ok) bondsData = await r1.json();
    if (r2.ok) notesData = await r2.json();
  } catch {}

  const priceMap = new Map<string, LiveBond>(
    [...bondsData, ...notesData]
      .filter((p) => p.symbol && !p.symbol.includes(' '))
      .map((p) => [p.symbol, p]),
  );

  // 1b) Current wholesale dollar (~A3500) to anchor the implied FX path.
  let dolarMayorista: number | null = null;
  let dolarFecha: string | null = null;
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares/mayorista', { next: { revalidate: 300 } });
    if (r.ok) {
      const d = await r.json();
      const compra = typeof d?.compra === 'number' ? d.compra : null;
      const venta = typeof d?.venta === 'number' ? d.venta : null;
      dolarMayorista = compra != null && venta != null ? (compra + venta) / 2 : (venta ?? compra);
      dolarFecha = d?.fechaActualizacion ?? null;
    }
  } catch {}

  // 2) Bond metadata from bonistas (bulk, avoids per-ticker rate limits)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metaMap = new Map<string, any>();
  try {
    const r = await fetch('https://bonistas.com/api/bonds', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });
    if (r.ok) {
      const all = await r.json();
      if (Array.isArray(all)) {
        for (const b of all) if (b?.ticker) metaMap.set(String(b.ticker).toUpperCase(), b);
      }
    }
  } catch {}

  const missing: string[] = [];
  const curves: Record<Family, CurveNode[]> = { fija: [], cer: [], dlk: [] };

  for (const bond of bonds) {
    const meta = metaMap.get(bond.ticker.toUpperCase());
    const price = priceMap.get(bond.ticker) ?? null;

    const tir: number | null = meta?.tir ?? null;

    // Days to maturity: prefer bonistas days_to_finish, else derive from end_date.
    let days: number | null = meta?.days_to_finish ?? null;
    const endDate: string | null = meta?.end_date ?? null;
    if (days == null && endDate) {
      const diff = (new Date(endDate).getTime() - Date.now()) / 86_400_000;
      days = Number.isFinite(diff) ? Math.round(diff) : null;
    }

    if (tir == null || days == null || days <= 0) {
      missing.push(bond.ticker);
      continue;
    }

    curves[bond.family].push({
      ticker: bond.ticker,
      nombre: bond.nombre,
      family: bond.family,
      days,
      years: +(days / 365).toFixed(4),
      tir: +tir.toFixed(6),
      md: meta?.modified_duration != null ? +meta.modified_duration.toFixed(2) : null,
      vencimiento: endDate,
      precio: price?.c ?? null,
      varDia: price?.pct_change ?? null,
    });
  }

  // Sort each curve by maturity so the client can plot/interpolate directly.
  for (const f of Object.keys(curves) as Family[]) curves[f].sort((a, b) => a.days - b.days);

  const body: CurvesResponse = {
    ...curves,
    asOf: new Date().toISOString(),
    dolarMayorista,
    dolarFecha,
    missing,
  };

  return Response.json(body, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  });
}

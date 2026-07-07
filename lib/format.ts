/** Formatting helpers. Rates are decimals (0.185 -> "18,5%"). */

export function pct(x: number | null | undefined, dec = 1): string {
  if (x == null || !Number.isFinite(x)) return '—';
  return `${(x * 100).toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec })}%`;
}

export function num(x: number | null | undefined, dec = 2): string {
  if (x == null || !Number.isFinite(x)) return '—';
  return x.toLocaleString('es-AR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/** Pesos with no decimals, e.g. "$1.860". */
export function ars(x: number | null | undefined): string {
  if (x == null || !Number.isFinite(x)) return '—';
  return `$${Math.round(x).toLocaleString('es-AR')}`;
}

/** "hasta [mes-año]" label from an ISO date. */
export function monthYear(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

/** Compact month-axis label, e.g. "ago-26". */
export function monthAxis(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const mon = d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mon}-${yy}`;
}

export function shortDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
}

/** Horizon in years -> friendly "1 mes" / "X meses" / "1 año" / "X,X años". */
export function horizon(years: number): string {
  if (years < 1) {
    const m = Math.max(1, Math.round(years * 12));
    return m === 1 ? '1 mes' : `${m} meses`;
  }
  const y = +years.toFixed(1);
  if (y === 1) return '1 año';
  return `${y.toLocaleString('es-AR', { maximumFractionDigits: 1 })} años`;
}

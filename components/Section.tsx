import { ReactNode } from 'react';

/** White card with a title bar — the standard content block. */
export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section style={{ background: '#fff', border: '1px solid #DDE6EF', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0D1B2A' }}>{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

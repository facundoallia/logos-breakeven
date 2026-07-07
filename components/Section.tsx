'use client';
import { ReactNode, useState } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  right?: ReactNode;
  /** If true, the card body collapses/expands on header click. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/** White card with a title bar — the standard content block. Optionally collapsible. */
export function Section({ title, children, right, collapsible = false, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyVisible = !collapsible || open;

  return (
    <section style={{ background: '#fff', border: '1px solid #DDE6EF', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: bodyVisible ? 12 : 0 }}>
        {collapsible ? (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none',
              padding: 0, cursor: 'pointer', font: 'inherit',
            }}
          >
            <span
              aria-hidden
              style={{ fontSize: 11, color: '#8ba5bf', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              ▼
            </span>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0D1B2A' }}>{title}</h3>
          </button>
        ) : (
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0D1B2A' }}>{title}</h3>
        )}
        {right}
      </div>
      {bodyVisible && children}
    </section>
  );
}

'use client';
import { useState } from 'react';

/**
 * Small inline "?" that reveals a plain-language explanation on hover/tap.
 * This is the explainability layer — every technical concept gets one.
 */
export function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-label="Explicación"
        style={{
          width: 16, height: 16, borderRadius: '50%', border: '1px solid #BDD0E0',
          background: '#EBF5FB', color: '#1F4E79', fontSize: 11, fontWeight: 700,
          lineHeight: '14px', cursor: 'help', padding: 0, marginLeft: 4,
        }}
      >
        ?
      </button>
      {open && (
        <span
          style={{
            position: 'absolute', bottom: '140%', left: '50%', transform: 'translateX(-50%)',
            width: 240, background: '#0D1B2A', color: '#fff', fontSize: 11.5, lineHeight: 1.45,
            fontWeight: 400, padding: '8px 10px', borderRadius: 6, zIndex: 20,
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)', textAlign: 'left',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

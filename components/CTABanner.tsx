'use client';

/** Advisor CTA — same pattern/tone as the other Logos apps. */
export function CTABanner() {
  return (
    <div style={{
      background: '#1F4E79', borderRadius: 10, padding: '22px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 16,
    }}>
      <div>
        <p style={{ margin: '0 0 3px', fontSize: 12, color: '#BDD0E0', fontWeight: 500 }}>
          ¿Querés posicionarte según lo que descuenta el mercado?
        </p>
        <h3 style={{ margin: '0 0 4px', fontSize: 19, fontWeight: 700, color: '#FFFFFF' }}>
          Armá tu estrategia con un asesor de Logos
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: '#BDD0E0' }}>
          Logos Servicios Financieros — Agente Productor Bursátil N°1271 CNV · Primera reunión sin costo
        </p>
      </div>
      <a
        href="https://wa.me/5493517414245?text=Hola!%20Quiero%20asesoramiento%20sobre%20bonos%20(tasa%20fija%2C%20CER%20y%20dollar-linked)."
        target="_blank" rel="noopener noreferrer"
        style={{
          background: '#ffc107', color: '#0D1B2A',
          padding: '12px 22px', borderRadius: 8,
          fontSize: 14, fontWeight: 700,
          textDecoration: 'none', whiteSpace: 'nowrap',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#e6ac00')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#ffc107')}
      >
        Consultar por WhatsApp →
      </a>
    </div>
  );
}

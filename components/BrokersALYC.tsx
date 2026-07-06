'use client';

const ALYCS = [
  {
    name: 'Balanz',
    logo: '/balanz.png',
    url: 'https://logos-serviciosfinancieros.com.ar/servicios/asesoramiento-en-balanz',
    cta: 'Asesoramiento en Balanz',
    logoHeight: '64px',
  },
  {
    name: 'Bull Market',
    logo: '/bull-market.png',
    url: 'https://logos-serviciosfinancieros.com.ar/servicios/asesoramiento-en-bull-market',
    cta: 'Asesoramiento en Bull Market',
    logoHeight: '64px',
  },
  {
    name: 'Invertir Online',
    logo: '/invertir-online.png',
    url: 'https://logos-serviciosfinancieros.com.ar/servicios/vinculacion-de-clientes-invertir-online',
    cta: 'Asesoramiento en Invertir Online',
    logoHeight: '76px',
  },
  {
    name: 'Inviu',
    logo: '/inviu.png',
    url: 'https://logos-serviciosfinancieros.com.ar/servicios/asesoramiento-en-inviu',
    cta: 'Asesoramiento en Inviu',
    logoHeight: '64px',
  },
];

/** 4 main ALyCs — reuses the pattern/logos from logos-mep. */
export function BrokersALYC() {
  return (
    <section style={{ marginTop: 8 }}>
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#1F4E79', margin: '0 0 4px' }}>
          Plataformas de operación
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0D1B2A', margin: 0 }}>
          Operá los bonos con las mejores ALyCs del país
        </h2>
        <p style={{ fontSize: 13.5, color: '#4A6880', margin: '6px 0 0', maxWidth: 560, lineHeight: 1.5 }}>
          Abrí tu cuenta con cualquiera de nuestras ALyCs asociadas y operá tasa fija, CER y dollar-linked
          con el acompañamiento de un asesor de Logos.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }} className="alyc-grid">
        {ALYCS.map((alyc) => (
          <a
            key={alyc.name}
            href={alyc.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '26px 14px', border: '1px solid #DDE6EF', borderRadius: 8, backgroundColor: '#FFFFFF',
              textDecoration: 'none', transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = '#1F4E79';
              el.style.boxShadow = '0 4px 20px rgba(31,78,121,0.14)';
              el.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = '#DDE6EF';
              el.style.boxShadow = 'none';
              el.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={alyc.logo} alt={alyc.name} style={{ height: alyc.logoHeight, maxWidth: 180, objectFit: 'contain', opacity: 0.9 }} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, marginTop: 12, letterSpacing: '0.03em', lineHeight: 1.3, color: '#1F4E79' }}>
              {alyc.cta}
            </span>
          </a>
        ))}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .alyc-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
        }
      `}</style>
    </section>
  );
}

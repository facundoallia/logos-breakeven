'use client';
import { useState } from 'react';

const faqs = [
  {
    q: '¿Qué es la inflación implícita o "breakeven"?',
    a: 'Es la inflación que iguala el rendimiento de un bono a tasa fija con uno que ajusta por inflación (CER), al mismo plazo. Si ambos bonos rinden lo mismo bajo cierta inflación, esa es la inflación que el mercado está descontando. No es un pronóstico oficial: es lo que hoy están "apostando" los precios de los bonos.',
  },
  {
    q: '¿Cómo se calcula exactamente?',
    a: 'Con la ecuación de Fisher, de forma multiplicativa: inflación implícita = (1 + tasa fija) / (1 + tasa real CER) − 1. Usamos tasas efectivas anuales y, cuando los bonos no vencen exactamente el mismo día, interpolamos la curva. Nunca restamos tasas: a los niveles de inflación argentinos, el atajo de restar (tasa fija − tasa real) da un número equivocado.',
  },
  {
    q: '¿Qué significa que el sendero muestre, por ejemplo, 1,5% mensual?',
    a: 'Que para ese tramo del calendario el mercado descuenta una inflación promedio de 1,5% por mes. Mostramos siempre la tasa anual (TEA) y la mensual (TEM) porque, sobre todo en el tramo corto, la mensual es más intuitiva y comparable con los datos del INDEC.',
  },
  {
    q: '¿Por qué cada punto del sendero es un "par de bonos"?',
    a: 'Porque cada punto compara un bono a tasa fija (LECAP/BONCAP) con uno CER (LECER/BONCER) que vencen en la misma fecha. El espaciado sigue los vencimientos reales: si el próximo par vence en 3 meses, ese es el siguiente punto. Entre pares consecutivos calculamos el "forward": cuánta inflación por mes implica ese tramo puntual.',
  },
  {
    q: '¿Conviene tasa fija o CER?',
    a: 'Depende de tu expectativa frente al breakeven. Si creés que la inflación va a ser MENOR a la implícita, te conviene tasa fija (te asegurás una tasa alta en términos reales). Si creés que va a ser MAYOR, te conviene un bono CER (te cubre la inflación). El panel de sensibilidad muestra ese cruce de forma visual.',
  },
  {
    q: '¿La devaluación implícita es del dólar oficial o del MEP?',
    a: 'Del dólar oficial mayorista (comunicación A3500 del BCRA), porque es a lo que ajustan los bonos dollar-linked que usamos para el cálculo. No es el CCL ni el MEP. Además del porcentaje, proyectamos el nivel nominal esperado del dólar oficial en cada vencimiento.',
  },
  {
    q: '¿De dónde salen los datos y cada cuánto se actualizan?',
    a: 'Los precios vienen de data912.com (con demora de mercado), la metadata y las TIR de bonistas.com, y el dólar mayorista de dolarapi.com. La página se actualiza sola cada un par de minutos con los últimos precios disponibles.',
  },
  {
    q: '¿Por qué el tramo más corto puede verse distorsionado?',
    a: 'Porque los bonos CER ajustan con unos 45 días de rezago y el dato de inflación del mes anterior puede no estar publicado todavía. Eso hace que buena parte del ajuste del bono más corto ya esté "devengado" (conocido), y no sea una expectativa pura. Por eso en el tramo corto conviene mirar la tasa mensual.',
  },
  {
    q: '¿Esto es una recomendación de inversión?',
    a: 'No. Es una herramienta educativa y de análisis. Las decisiones dependen de tu perfil, tus objetivos y tu horizonte. Si querés que te acompañemos, en Logos hacemos una primera reunión sin costo — somos Agente Productor Bursátil N°1271 registrado en la CNV.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--logos-border)', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, padding: '14px 18px', background: open ? 'var(--logos-bg-section)' : '#fff',
          border: 'none', cursor: 'pointer', transition: 'background 0.15s',
        }}
      >
        <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--logos-text-primary)', lineHeight: 1.4 }}>{q}</span>
        <span
          aria-hidden
          style={{
            flexShrink: 0, fontSize: 12, color: 'var(--logos-text-muted)',
            transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s',
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 16px', background: '#fff' }}>
          <p style={{ fontSize: 13.5, color: 'var(--logos-text-secondary)', lineHeight: 1.7, margin: 0 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export function FAQ() {
  return (
    <section>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--logos-text-primary)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
        Preguntas frecuentes
      </h2>
      <p style={{ fontSize: 14, color: 'var(--logos-text-secondary)', margin: '0 0 20px' }}>
        Cómo leer la inflación y la devaluación que descuenta el mercado.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {faqs.map(({ q, a }) => (
          <FAQItem key={q} q={q} a={a} />
        ))}
      </div>

      {/* FAQ Schema for SEO (indexed on the Joomla page, not the noindex vercel URL) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map(({ q, a }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }),
        }}
      />
    </section>
  );
}

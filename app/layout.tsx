import type { Metadata } from 'next';
import './globals.css';
import { IframeResizer } from '@/components/IframeResizer';

export const metadata: Metadata = {
  title: 'Breakeven — Inflación y devaluación implícita | Logos Servicios Financieros',
  description:
    'Qué espera el mercado de bonos argentinos: inflación implícita (fija vs CER), devaluación implícita (fija vs dollar-linked), tasas reales y curvas. Con heatmaps de forwards y análisis de sensibilidad.',
  // Prevent Vercel URL from being indexed — Google must index logos-serviciosfinancieros.com.ar
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <IframeResizer />
        {children}
      </body>
    </html>
  );
}

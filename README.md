# Logos Breakeven

Inflación y devaluación **implícitas** del mercado de bonos del Tesoro argentino, extraídas
comparando las curvas de tasa fija (LECAP/BONCAP), CER (BONCER/LECER) y dollar-linked.

App de [Logos Servicios Financieros](https://logos-serviciosfinancieros.com.ar), embebida vía
iframe en `/productos/breakeven`.

## Qué hace

- **Inflación implícita** (fija vs CER) y **devaluación implícita** del dólar oficial (fija vs dollar-linked), vía Fisher multiplicativo.
- **Sendero mensual** de breakeven **por par de bonos**: cada punto es un par (fija + CER/DLK) que vence en la misma fecha; el forward entre pares da la tasa mensual (TEM) de ese tramo.
- **Curvas** de rendimiento por familia y **tasas reales**.
- **Sendero del dólar oficial** implícito (nivel nominal proyectado).
- **Heatmap de forwards** y **análisis de sensibilidad** (cruce fija vs CER = breakeven).
- Todo con tasa **anual (TEA)** y **mensual (TEM)**, y explicaciones inline.

## Datos

- Precios: [data912.com](https://data912.com) (demorados)
- TIR / duration / fechas: [bonistas.com](https://bonistas.com)
- Dólar mayorista (~A3500): [dolarapi.com](https://dolarapi.com)

## Stack

Next.js 16 · React 19 · Tailwind 4 · Recharts. Lógica financiera en [`lib/analytics.ts`](lib/analytics.ts)
(funciones puras, testeadas con `npm test`).

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # tests del núcleo analítico
npm run build
```

Contenido educativo — no constituye recomendación de inversión.

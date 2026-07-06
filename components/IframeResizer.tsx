'use client';
import { useEffect } from 'react';

const ALLOWED_ORIGINS = [
  'https://logos-serviciosfinancieros.com.ar',
  'https://www.logos-serviciosfinancieros.com.ar',
];

/**
 * Sends the document height to the Joomla parent page via postMessage
 * so the iframe auto-resizes without its own scrollbar.
 *
 * Uses 'logos-breakeven-resize' as message type — the Joomla listener must
 * handle window.addEventListener('message', e => { if (e.data?.type === 'logos-breakeven-resize') ... })
 */
export function IframeResizer() {
  useEffect(() => {
    const sendHeight = () => {
      requestAnimationFrame(() => {
        const height = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
        );
        ALLOWED_ORIGINS.forEach((origin) => {
          try {
            window.parent.postMessage({ type: 'logos-breakeven-resize', height }, origin);
          } catch {}
        });
      });
    };

    // Immediate + delayed shots — Recharts finishes painting ~300-800ms after mount
    sendHeight();
    const t1 = setTimeout(sendHeight, 500);
    const t2 = setTimeout(sendHeight, 1500);

    const observer = new ResizeObserver(sendHeight);
    observer.observe(document.body);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, []);

  return null;
}

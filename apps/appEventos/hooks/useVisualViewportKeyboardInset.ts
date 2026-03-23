import { useEffect, useState } from 'react';

/**
 * Estima el espacio que el teclado virtual (u otras barras) ocultan en la parte inferior
 * usando `VisualViewport`. Sirve para añadir padding al área del input en Copilot embebido.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
 */
export function useVisualViewportKeyboardInset(): number {
  const [insetPx, setInsetPx] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const vv = window.visualViewport;

    const update = () => {
      const layoutH = window.innerHeight;
      // Zona del layout no cubierta por el visual viewport (típico: teclado)
      const obscured = Math.max(0, layoutH - vv.height - vv.offsetTop);
      setInsetPx(Math.round(obscured));
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return insetPx;
}

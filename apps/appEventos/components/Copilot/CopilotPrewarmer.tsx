/**
 * CopilotPrewarmer - Pre-calienta el chat de LobeChat en segundo plano
 *
 * Este componente hace un fetch invisible a las páginas de LobeChat
 * cuando la aplicación carga, para que Next.js compile las páginas
 * antes de que el usuario las necesite.
 *
 * Beneficios:
 * - El usuario no tiene que esperar a que compile cuando abre el Copilot
 * - El iframe carga instantáneamente porque las páginas ya están compiladas
 * - Mejora significativa en la experiencia del usuario
 */

import { useEffect, useRef } from 'react';
import { getCopilotBaseUrl } from './getCopilotBaseUrl';

interface CopilotPrewarmerProps {
  development?: string;
}

export const CopilotPrewarmer: React.FC<CopilotPrewarmerProps> = ({ development = 'bodasdehoy' }) => {
  const hasPrewarmed = useRef(false);

  useEffect(() => {
    // Solo pre-calentar una vez
    if (hasPrewarmed.current) return;
    hasPrewarmed.current = true;

    const prewarmChat = async () => {
      try {
        // Usar util compartido (misma lógica que CopilotIframe y ChatSidebar)
        const cleanBase = getCopilotBaseUrl();

        const prewarmUrls = [
          `/${development}/chat`, // Página principal del chat
          `/${development}`,       // Página base
        ];

        // Pre-calentar en paralelo con timeout de 5s por URL
        await Promise.allSettled(
          prewarmUrls.map(async (path) => {
            const url = `${cleanBase}${path}`;
            const ac = new AbortController();
            const tid = setTimeout(() => ac.abort(), 5_000);
            try {
              await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                credentials: 'omit',
                signal: ac.signal,
              });
            } catch {
              // Silently ignore prewarm failures (red, CORS, 404 en otro origen, timeout)
            } finally {
              clearTimeout(tid);
            }
          })
        );

      } catch {
        // Silently ignore prewarm errors
      }
    };

    // Pre-calentar usando requestIdleCallback para no competir con el render inicial
    if (typeof window !== 'undefined') {
      const runPrewarm = () => {
        if ('requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void })
            .requestIdleCallback(prewarmChat, { timeout: 3000 });
        } else {
          setTimeout(prewarmChat, 0);
        }
      };
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        runPrewarm();
      } else {
        window.addEventListener('load', runPrewarm, { once: true });
      }
    }
  }, [development]);

  // Este componente no renderiza nada visible
  return null;
};

export default CopilotPrewarmer;

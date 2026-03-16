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
        // Monorepo: app-test ↔ chat-test. Precalentar la URL que usará el Copilot (chat-test en app-test).
        let baseUrl = process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com';
        if (typeof window !== 'undefined' && window.location.hostname?.includes('app-test')) {
          baseUrl = 'https://chat-test.bodasdehoy.com';
        }
        const cleanBase = baseUrl.replace(/\/$/, '');

        const prewarmUrls = [
          `/${development}/chat`, // Página principal del chat
          `/${development}`,       // Página base
        ];

        // Pre-calentar todas las URLs en paralelo (404 en chat-ia es aceptable en dev si la ruta no existe aún)
        await Promise.allSettled(
          prewarmUrls.map(async (path) => {
            const url = `${cleanBase}${path}`;
            try {
              await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                credentials: 'omit',
              });
            } catch {
              // Silently ignore prewarm failures (red, CORS, 404 en otro origen)
            }
          })
        );

      } catch {
        // Silently ignore prewarm errors
      }
    };

    // Esperar a que la página principal cargue antes de pre-calentar
    // Esto evita competir por recursos durante la carga inicial
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        setTimeout(prewarmChat, 500);
      } else {
        window.addEventListener('load', () => {
          setTimeout(prewarmChat, 500);
        }, { once: true });
      }
    }
  }, [development]);

  // Este componente no renderiza nada visible
  return null;
};

export default CopilotPrewarmer;

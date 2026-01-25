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

const PREWARM_URLS = [
  '/bodasdehoy/chat', // Página principal del chat
  '/bodasdehoy',       // Página base
];

export const CopilotPrewarmer: React.FC<CopilotPrewarmerProps> = ({ development = 'bodasdehoy' }) => {
  const hasPrewarmed = useRef(false);

  useEffect(() => {
    // Solo pre-calentar una vez
    if (hasPrewarmed.current) return;
    hasPrewarmed.current = true;

    const prewarmChat = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_CHAT || 'https://chat-test.bodasdehoy.com';
        const cleanBase = baseUrl.replace(/\/$/, '');

        // Pre-calentar las URLs en secuencia (no en paralelo para no sobrecargar)
        for (const path of PREWARM_URLS) {
          const url = `${cleanBase}${path}`;

          try {
            // Usar fetch con mode: 'no-cors' para evitar problemas de CORS
            // No necesitamos la respuesta, solo queremos que el servidor compile
            await fetch(url, {
              method: 'GET',
              mode: 'no-cors',
              cache: 'force-cache', // Aprovechar caché
              credentials: 'omit',  // No enviar cookies
            });
            console.log(`[CopilotPrewarmer] ✅ Pre-calentado: ${url}`);
          } catch (err) {
            // Ignorar errores - el pre-calentamiento es opcional
            console.log(`[CopilotPrewarmer] ⚠️ No se pudo pre-calentar: ${url}`);
          }

          // Pequeña pausa entre requests para no saturar
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('[CopilotPrewarmer] 🚀 Pre-calentamiento completado');
      } catch (err) {
        console.log('[CopilotPrewarmer] ⚠️ Error en pre-calentamiento:', err);
      }
    };

    // Esperar a que la página principal cargue antes de pre-calentar
    // Esto evita competir por recursos durante la carga inicial
    if (typeof window !== 'undefined') {
      if (document.readyState === 'complete') {
        // Página ya cargada, iniciar pre-calentamiento después de un pequeño delay
        setTimeout(prewarmChat, 2000);
      } else {
        // Esperar a que la página cargue completamente
        window.addEventListener('load', () => {
          setTimeout(prewarmChat, 2000);
        }, { once: true });
      }
    }
  }, [development]);

  // Este componente no renderiza nada visible
  return null;
};

export default CopilotPrewarmer;

/**
 * Copilot Page - LobeChat Completo
 *
 * Esta página muestra el LobeChat COMPLETO real desde apps/copilot (puerto 3210)
 * usando el proxy configurado en next.config.js (/copilot-chat → localhost:3210)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const CopilotPage = () => {
  const router = useRouter();
  const [iframeUrl, setIframeUrl] = useState<string>('/copilot-chat');

  // Recuperar contexto del sessionStorage si viene del sidebar
  useEffect(() => {
    try {
      const contextStr = sessionStorage.getItem('copilot_open_context');
      if (contextStr) {
        const context = JSON.parse(contextStr);
        console.log('[Copilot Page] Contexto recuperado:', context);

        // Podemos pasar el contexto como query params si es necesario
        // Por ahora solo lo logueamos
      }
    } catch (err) {
      console.error('[Copilot Page] Error recuperando contexto:', err);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Copilot - Asistente IA</title>
        <meta name="description" content="Asistente inteligente para gestionar eventos" />
      </Head>

      {/* LobeChat Completo en iframe */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <iframe
          src={iframeUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            margin: 0,
            padding: 0,
          }}
          title="LobeChat Copilot"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </>
  );
};

export default CopilotPage;

'use client';

import { useEffect } from 'react';

/**
 * ContextFromEmbed - Recupera contexto guardado desde el sidebar embebido
 *
 * Cuando el usuario hace click en "Ver completo" desde el sidebar de app-test,
 * el contexto del evento se guarda en sessionStorage. Este componente lo recupera
 * y lo aplica al chat actual para mantener continuidad.
 */
const ContextFromEmbed = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedContext = sessionStorage.getItem('copilot_open_context');

      if (!savedContext) return;

      const context = JSON.parse(savedContext);

      // Verificar que no sea muy viejo (< 10 segundos)
      // Esto evita usar contexto de una sesión anterior
      const age = Date.now() - (context.timestamp || 0);
      if (age > 10_000) {
        console.log('[ContextFromEmbed] Contexto demasiado viejo, ignorando:', age, 'ms');
        sessionStorage.removeItem('copilot_open_context');
        return;
      }

      console.log('[ContextFromEmbed] 📥 Contexto recuperado desde sidebar embebido:', {
        age,
        development: context.development,
        eventId: context.eventId,
        eventName: context.eventName,
        userId: context.userId,
      });

      // TODO: Aquí podríamos inyectar el pageContext en el primer mensaje del chat
      // o en el system prompt, para que el AI tenga contexto del evento desde el inicio

      // Por ahora, simplemente logging para verificar que funciona
      if (context.pageContext) {
        console.log('[ContextFromEmbed] PageContext disponible:', {
          eventName: context.pageContext.eventName,
          pageName: context.pageContext.pageName,
          screenData: context.pageContext.screenData,
        });
      }

      // Limpiar sessionStorage después de usarlo
      sessionStorage.removeItem('copilot_open_context');
      console.log('[ContextFromEmbed] ✅ Contexto recuperado y limpiado');

    } catch (err) {
      console.error('[ContextFromEmbed] Error recuperando contexto:', err);
      // Limpiar en caso de error para no dejar data corrupta
      sessionStorage.removeItem('copilot_open_context');
    }
  }, []);

  return null; // Componente invisible
};

export default ContextFromEmbed;

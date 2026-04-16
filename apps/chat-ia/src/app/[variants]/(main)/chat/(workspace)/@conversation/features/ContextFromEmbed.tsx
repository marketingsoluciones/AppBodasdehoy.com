'use client';

import { useEffect } from 'react';

/**
 * ContextFromEmbed - Recupera contexto guardado desde el sidebar embebido
 *
 * Cuando el usuario hace click en "Ver completo" desde el sidebar de app-test,
 * el contexto del evento se guarda en sessionStorage con la clave 'copilot_open_context'.
 * Este componente lo recupera al montar y lo aplica al chat activo:
 *   1. Actualiza el systemRole del agente activo con el contexto del evento
 *   2. Limpia sessionStorage para no reusar el contexto en sesiones futuras
 */
const ContextFromEmbed = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const applyContext = async () => {
      try {
        const savedContext = sessionStorage.getItem('copilot_open_context');
        if (!savedContext) return;

        const context = JSON.parse(savedContext);

        // Verificar que no sea muy viejo (< 30 segundos)
        const age = Date.now() - (context.timestamp || 0);
        if (age > 30_000) {
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

        // Limpiar sessionStorage antes de operar (evitar dobles inyecciones)
        sessionStorage.removeItem('copilot_open_context');

        if (!context.pageContext) return;

        const { eventName, pageName, screenData } = context.pageContext;

        // Construir bloque de contexto a anteponer al system prompt
        const lines: string[] = ['<!-- Contexto del evento (inyectado automáticamente) -->'];
        if (eventName) lines.push(`Evento: ${eventName}`);
        if (pageName) lines.push(`Pantalla actual: ${pageName}`);
        if (context.eventId) lines.push(`ID de evento: ${context.eventId}`);
        if (screenData) {
          try {
            const dataStr =
              typeof screenData === 'string' ? screenData : JSON.stringify(screenData, null, 2);
            lines.push(`Datos de la pantalla:\n${dataStr}`);
          } catch {
            // Ignorar si screenData no es serializable
          }
        }
        lines.push('<!-- fin contexto -->');
        const contextBlock = lines.join('\n');

        // Importar el agent store dinámicamente para evitar dependencias circulares
        const [{ useAgentStore }, { agentSelectors }] = await Promise.all([
          import('@/store/agent'),
          import('@/store/agent/selectors'),
        ]);
        if (!isMounted) return;

        const agentStore = useAgentStore.getState();

        // Obtener el system role actual del agente activo
        const currentSystemRole: string =
          agentSelectors.currentAgentSystemRole(useAgentStore.getState()) || '';

        // Eliminar cualquier bloque de contexto anterior (evita acumulación)
        const cleanedSystemRole = currentSystemRole
          .replaceAll(/<!--\s*Contexto del evento[\S\s]*?<!--\s*fin contexto\s*-->\n*/g, '')
          .trimStart();

        // Anteponer el nuevo contexto al system role limpio
        const newSystemRole = cleanedSystemRole
          ? `${contextBlock}\n\n${cleanedSystemRole}`
          : contextBlock;

        await agentStore.updateAgentConfig({ systemRole: newSystemRole });

        console.log('[ContextFromEmbed] ✅ Contexto de evento inyectado en system prompt:', {
          eventName,
          pageName,
          systemRoleLength: newSystemRole.length,
        });
      } catch (err) {
        console.error('[ContextFromEmbed] Error recuperando contexto:', err);
        sessionStorage.removeItem('copilot_open_context');
      }
    };

    // Diferir ligeramente para que el agent store tenga tiempo de inicializar
    const timeout = setTimeout(() => {
      if (isMounted) applyContext();
    }, 800);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  return null; // Componente invisible
};

export default ContextFromEmbed;

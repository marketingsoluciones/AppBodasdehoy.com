'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chat';

/**
 * Bloque de instrucciones de cualificación de leads para usuarios guest.
 * Se inyecta al system prompt del agente activo cuando el usuario es visitante.
 *
 * Patrón: Similar a ContextFromEmbed.tsx que inyecta contexto de evento en el systemRole.
 */
const LEAD_QUALIFICATION_PROMPT = `<!-- Instrucciones de cualificación de leads (visitante no registrado) -->
Cuando el usuario sea un visitante nuevo (no registrado), después de responder su pregunta inicial,
hazle UNA pregunta de cualificación a la vez de forma natural y conversacional:

1. ¿Qué tipo de evento planeas? (boda, XV años, corporativo, bautizo, comunión, etc.)
2. ¿Para cuándo aproximadamente tienes pensada la fecha?
3. ¿Cuántos invitados esperas aproximadamente?
4. ¿Tienes un presupuesto estimado?
5. ¿En qué ciudad o zona será el evento?
6. ¿Qué servicios necesitas? (fotografía, catering, decoración, música, etc.)

IMPORTANTE: No preguntes todas a la vez. Espera la respuesta a cada pregunta antes de hacer la siguiente.
Si el usuario ya proporcionó algún dato en su mensaje, no lo preguntes de nuevo.
Sé natural, amable y no interrogativo — integra las preguntas en la conversación.

Cuando obtengas información de cualificación del usuario, inclúyela SIEMPRE en un bloque oculto al final de tu respuesta:
<!--LEAD_DATA {"event_type":"boda","guest_count":150,"event_date":"junio 2026","budget":"15000","location":"Madrid","services_needed":["fotografía","catering"]} LEAD_DATA-->

Solo incluye los campos que el usuario haya mencionado. No inventes datos.
Si el usuario da su nombre, email o teléfono, inclúyelos como:
<!--LEAD_DATA {"name":"Juan","email":"juan@email.com","phone":"+34666123456"} LEAD_DATA-->
<!-- fin instrucciones de cualificación -->`;

/**
 * LeadQualificationContext — Componente invisible que inyecta instrucciones de
 * cualificación de leads en el system prompt del agente cuando el usuario es guest.
 *
 * Similar a ContextFromEmbed pero específico para lead qualification.
 */
const LeadQualificationContext = () => {
  const injectedRef = useRef(false);

  const { currentUserId, userType, externalChatsInit } = useChatStore((s) => ({
    currentUserId: s.currentUserId,
    externalChatsInit: s.externalChatsInit,
    userType: s.userType,
  }));

  const isGuest =
    externalChatsInit && (
      !currentUserId ||
      currentUserId === 'visitante@guest.local' ||
      currentUserId === 'guest' ||
      currentUserId === 'anonymous' ||
      currentUserId?.startsWith('visitor_') ||
      userType === 'guest' ||
      userType === 'visitor'
    );

  useEffect(() => {
    if (!isGuest || injectedRef.current) return;

    let isMounted = true;

    const injectQualificationPrompt = async () => {
      try {
        const [{ useAgentStore }, { agentSelectors }] = await Promise.all([
          import('@/store/agent'),
          import('@/store/agent/selectors'),
        ]);
        if (!isMounted) return;

        const agentStore = useAgentStore.getState();
        const currentSystemRole: string =
          agentSelectors.currentAgentSystemRole(agentStore) || '';

        // Don't inject if already present
        if (currentSystemRole.includes('instrucciones de cualificación de leads')) {
          injectedRef.current = true;
          return;
        }

        // Append qualification instructions to system role
        const newSystemRole = currentSystemRole
          ? `${currentSystemRole}\n\n${LEAD_QUALIFICATION_PROMPT}`
          : LEAD_QUALIFICATION_PROMPT;

        await agentStore.updateAgentConfig({ systemRole: newSystemRole });
        injectedRef.current = true;

        console.log('[LeadQualificationContext] Instrucciones de cualificación inyectadas en system prompt');
      } catch (err) {
        console.error('[LeadQualificationContext] Error inyectando instrucciones:', err);
      }
    };

    // Delay to let agent store initialize (same pattern as ContextFromEmbed)
    const timeout = setTimeout(() => {
      if (isMounted) injectQualificationPrompt();
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [isGuest]);

  return null; // Invisible component
};

export default LeadQualificationContext;

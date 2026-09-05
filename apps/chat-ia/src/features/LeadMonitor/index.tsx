'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { useLeads, type SaveLeadRequest } from '@/hooks/useLeads';
import { extractLeadData, type ExtractedLeadData } from '@/services/leadExtraction';

/**
 * LeadMonitor — Componente invisible que observa mensajes del asistente,
 * detecta bloques <!--LEAD_DATA--> en las respuestas y guarda el lead
 * automáticamente vía useLeads.saveLead().
 *
 * Solo se activa para usuarios guest (no logueados).
 * Se monta en el ClassicChatInput junto a ContextFromEmbed.
 */
const LeadMonitor = () => {
  const { saveLead } = useLeads();
  const lastProcessedCountRef = useRef(0);
  const accumulatedDataRef = useRef<ExtractedLeadData>({});

  const currentUserId = useChatStore((s) => s.currentUserId);
  const userType = useChatStore((s) => s.userType);
  const development = useChatStore((s) => s.development);
  const activeExternalChatId = useChatStore((s) => s.activeExternalChatId);

  // Get assistant messages from active chat
  const assistantMessages = useChatStore((s) =>
    chatSelectors.activeBaseChats(s)
      .filter((m) => m.role === 'assistant')
      .map((m) => (typeof m.content === 'string' ? m.content : '')),
  );

  const isGuest =
    !currentUserId ||
    currentUserId === 'visitante@guest.local' ||
    currentUserId === 'guest' ||
    currentUserId === 'anonymous' ||
    currentUserId?.startsWith('visitor_') ||
    userType === 'guest' ||
    userType === 'visitor';

  useEffect(() => {
    if (!isGuest) return;
    if (assistantMessages.length <= lastProcessedCountRef.current) return;

    // Only process new messages
    const newMessages = assistantMessages.slice(lastProcessedCountRef.current);
    lastProcessedCountRef.current = assistantMessages.length;

    for (const content of newMessages) {
      const { data } = extractLeadData(content);
      if (!data) continue;

      // Accumulate qualifying data across messages
      if (data.qualifying_data) {
        accumulatedDataRef.current.qualifying_data = {
          ...accumulatedDataRef.current.qualifying_data,
          ...data.qualifying_data,
        };
      }
      if (data.contact) {
        accumulatedDataRef.current.contact = {
          ...accumulatedDataRef.current.contact,
          ...data.contact,
        };
      }

      // Save the accumulated lead data
      const sessionId = activeExternalChatId || `guest-${Date.now()}`;
      const payload: SaveLeadRequest = {
        development: development || 'bodasdehoy',
        session_id: sessionId,
        source: 'chatbot',
      };

      if (accumulatedDataRef.current.qualifying_data) {
        payload.qualifying_data = accumulatedDataRef.current.qualifying_data;
      }
      if (accumulatedDataRef.current.contact) {
        payload.contact = accumulatedDataRef.current.contact;
      }

      saveLead(payload).catch((err) => {
        console.warn('[LeadMonitor] Error guardando lead:', err);
      });
    }
  }, [assistantMessages, isGuest, activeExternalChatId, development, saveLead]);

  return null; // Invisible component
};

export default LeadMonitor;

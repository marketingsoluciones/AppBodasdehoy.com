'use client';

import { useQueryState } from 'nuqs';
import { memo, useLayoutEffect, useEffect } from 'react';
import { createStoreUpdater } from 'zustand-utils';

import { useChatStore } from '@/store/chat';

// sync outside state to useChatStore
const ChatHydration = memo(() => {
  const useStoreUpdater = createStoreUpdater(useChatStore);

  // two-way bindings the topic params to chat store
  const [topic, setTopic] = useQueryState('topic', { history: 'replace', throttleMs: 500 });
  const [thread, setThread] = useQueryState('thread', { history: 'replace', throttleMs: 500 });
  useStoreUpdater('activeTopicId', topic ?? undefined);
  useStoreUpdater('activeThreadId', thread ?? undefined);

  useLayoutEffect(() => {
    const unsubscribeTopic = useChatStore.subscribe(
      (s) => s.activeTopicId,
      (state) => {
        setTopic(!state ? null : state);
      },
    );
    const unsubscribeThread = useChatStore.subscribe(
      (s) => s.activeThreadId,
      (state) => {
        setThread(!state ? null : state);
      },
    );

    return () => {
      unsubscribeTopic();
      unsubscribeThread();
    };
  }, []);

  // ✅ Mostrar mensaje de bienvenida si existe en localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const welcomeData = localStorage.getItem('welcome-message');
      if (welcomeData) {
        const { message, timestamp } = JSON.parse(welcomeData);

        // Verificar que el mensaje no sea muy viejo (máximo 5 minutos)
        const messageAge = Date.now() - timestamp;
        if (messageAge < 5 * 60 * 1000) {
          // Esperar un poco para que el chat se inicialice
          setTimeout(() => {
            const store = useChatStore.getState();
            const activeId = store.activeId;

            if (!activeId || !message) return;

            // Verificar si ya hay mensajes en el chat
            const messages = store.messagesMap[activeId] || [];
            const hasMessages = messages.length > 0;

            // Solo mostrar si no hay mensajes
            if (!hasMessages) {
              console.log('✅ Mostrando mensaje de bienvenida con eventos');
              // Crear mensaje de bienvenida como mensaje del asistente
              store.internal_createMessage({
                content: message,
                role: 'assistant',
                sessionId: activeId,
              });
              // Limpiar el mensaje de bienvenida después de mostrarlo
              localStorage.removeItem('welcome-message');
            } else {
              // Ya hay mensajes, limpiar el welcome message
              localStorage.removeItem('welcome-message');
            }
          }, 1500);
        } else {
          // Mensaje muy viejo, limpiarlo
          localStorage.removeItem('welcome-message');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error leyendo welcome-message:', error);
      localStorage.removeItem('welcome-message');
    }
  }, []);

  return null;
});

export default ChatHydration;

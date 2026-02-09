'use client';

import { Input } from 'antd';
import { memo, useMemo, useState } from 'react';

import { useConversationHistory } from '@/hooks/useConversationHistory';
import { useChatStore } from '@/store/chat';

import ConversationItem from './ConversationItem';

const formatLastSync = (timestamp?: number) => {
  if (!timestamp) return null;
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return null;
  }
};

const ConversationHistory = memo(() => {
  const [development, userEmail, isGuestUser] = useChatStore((s) => {
    const email =
      s.userProfile?.email ||
      (s.currentUserId && s.currentUserId.includes('@') ? s.currentUserId : undefined);

    // Detectar si es usuario invitado (no tiene conversaciones en API2)
    const isGuest = !email ||
      email.includes('guest') ||
      email.includes('visitante') ||
      email.includes('anonymous') ||
      email === 'dev-user@localhost';

    return [s.development || 'bodasdehoy', email, isGuest] as const;
  });
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data,
    isLoading,
    error,
  } = useConversationHistory(development, isGuestUser ? undefined : userEmail);
  const conversations = data?.conversations ?? [];

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.nombre.toLowerCase().includes(query) ||
        conv.ultimoMensaje.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  // Si no hay email o es usuario invitado, mostrar mensaje de login
  if (!userEmail || isGuestUser) {
    return (
      <div className="text-center text-gray-500 text-sm mt-8 py-4 px-4">
        <div className="mb-2">🔐</div>
        <div className="font-medium mb-2">Inicia sesión para ver tu historial</div>
        <div className="text-xs text-gray-400 mb-3">
          El historial de conversaciones de WhatsApp, Instagram y otros canales
          requiere que inicies sesión con tu cuenta.
        </div>
        {userEmail && (
          <div className="text-xs text-amber-600 mb-3 bg-amber-50 rounded px-2 py-1 inline-block">
            Usuario actual: {userEmail.split('@')[0]}... (invitado)
          </div>
        )}
        <div>
          <a
            className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full hover:opacity-90 transition-opacity"
            href="/dev-login"
          >
            Iniciar sesión con tu cuenta
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-gray-500 text-sm mt-8 py-4">
        <div className="mb-2">❌</div>
        <div>Error al cargar el historial</div>
        <div className="text-xs text-gray-400 mt-1">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      </div>
    );
  }

  const renderStatusBanner = () => {
    if (!data) return null;

    if (data.isFallback) {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded px-3 py-2 mx-2 mb-3">
          <div className="font-medium">Mostrando historial guardado en este dispositivo.</div>
          <div>
            {data.errorMessage
              ? `No se pudo conectar con el backend: ${data.errorMessage}`
              : 'Sin conexión con API2.'}
          </div>
          {data.lastUpdated && (
            <div className="text-amber-700/80 mt-1">
              Última sincronización: {formatLastSync(data.lastUpdated)}
            </div>
          )}
        </div>
      );
    }

    if (data.source === 'api2') {
      return (
        <div className="text-[11px] text-gray-500 px-3 pb-2">
          ✅ Historial sincronizado con API2{' '}
          {data.lastUpdated ? `(${formatLastSync(data.lastUpdated)})` : ''}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {renderStatusBanner()}
      <div className="mb-4 px-2">
        <Input
          className="w-full"
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Buscar en historial..."
          size="small"
          value={searchQuery}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-gray-500 text-sm mt-8 py-4">
            <div className="mb-2 animate-spin text-2xl">⏳</div>
            <div>Cargando conversaciones...</div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-12 py-4 px-4">
            <div className="mb-3 text-4xl opacity-50">💬</div>
            <div className="font-medium text-gray-600 mb-1">
              {searchQuery ? 'Sin resultados' : 'Sin conversaciones'}
            </div>
            <div className="text-xs">
              {searchQuery
                ? 'Intenta con otros términos de búsqueda'
                : 'Las conversaciones de WhatsApp, Instagram y otros canales aparecerán aquí'}
            </div>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conversation) => (
              <ConversationItem
                conversation={conversation}
                key={conversation.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ConversationHistory.displayName = 'ConversationHistory';

export default ConversationHistory;


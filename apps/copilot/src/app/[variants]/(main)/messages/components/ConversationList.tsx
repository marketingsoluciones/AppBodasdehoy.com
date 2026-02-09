'use client';

import { useAuthCheck } from '@/hooks/useAuthCheck';

import { useConversations } from '../hooks/useConversations';
import { ConversationItem } from './ConversationItem';

interface ConversationListProps {
  channel: string | null;
  selectedId?: string;
}

export function ConversationList({ channel, selectedId }: ConversationListProps) {
  const { conversations, loading, error } = useConversations(channel);
  const { checkAuth } = useAuthCheck();
  const { isAuthenticated } = checkAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-3xl">⏳</div>
          <p className="text-sm text-gray-500">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-2 text-3xl">❌</div>
          <p className="text-sm text-red-600">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    // ✅ MEJORA 1: Mensaje específico para usuarios invitados
    if (!isAuthenticated) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="mb-4 text-5xl">🔐</div>
            <p className="text-sm font-medium text-gray-700 mb-2">No has iniciado sesión</p>
            <p className="text-xs text-gray-500 mb-6">
              Inicia sesión para ver tus conversaciones de WhatsApp, Instagram, Telegram y otros
              canales.
            </p>
            <a
              className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              href="/dev-login"
            >
              Iniciar sesión
            </a>
          </div>
        </div>
      );
    }

    // Mensaje para usuarios registrados sin conversaciones
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-2 text-4xl">📭</div>
          <p className="text-sm text-gray-500">No hay conversaciones</p>
          <p className="text-xs text-gray-400 mt-1">
            Tus conversaciones aparecerán aquí cuando recibas mensajes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
        <div className="mt-2">
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Buscar conversación..."
            type="text"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="divide-y divide-gray-200">
        {conversations.map((conversation) => (
          <ConversationItem
            conversation={conversation}
            isSelected={conversation.id === selectedId}
            key={conversation.id}
          />
        ))}
      </div>
    </div>
  );
}

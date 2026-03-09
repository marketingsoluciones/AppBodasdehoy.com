'use client';

import { useConversations } from '../hooks/useConversations';
import { ChannelBadge } from './ChannelBadge';

interface ConversationHeaderProps {
  conversationId: string;
}

export function ConversationHeader({ conversationId }: ConversationHeaderProps) {
  const { conversations } = useConversations(null);
  const conversation = conversations.find((c) => c.id === conversationId);

  if (!conversation) {
    return (
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
      {/* Left: Contact Info */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
          {conversation.contact.name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">
              {conversation.contact.name}
            </h2>
            <ChannelBadge
              channel={conversation.channel}
              size="sm"
            />
          </div>
          <p className="text-xs text-gray-500">
            {conversation.contact.phone || conversation.contact.username || 'Sin info de contacto'}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-gray-600 transition-colors hover:bg-gray-100"
          title="Buscar en conversación"
          type="button"
        >
          🔍
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-gray-600 transition-colors hover:bg-gray-100"
          title="Llamar"
          type="button"
        >
          📞
        </button>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-gray-600 transition-colors hover:bg-gray-100"
          title="Más opciones"
          type="button"
        >
          ⋮
        </button>
      </div>
    </div>
  );
}


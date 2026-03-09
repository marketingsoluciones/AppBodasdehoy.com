'use client';

import { useRouter } from 'next/navigation';
import { Conversation } from '../hooks/useConversations';
import { ChannelBadge } from './ChannelBadge';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected?: boolean;
}

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
};

export function ConversationItem({
  conversation,
  isSelected,
}: ConversationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(
      `/messages/${conversation.channel}/${conversation.id}`
    );
  };

  return (
    <button
      className={`w-full text-left transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-4 border-blue-600'
          : 'hover:bg-gray-50'
      }`}
      onClick={handleClick}
      type="button"
    >
      <div className="flex items-start gap-3 p-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-semibold text-white">
            {conversation.contact.name.charAt(0).toUpperCase()}
          </div>
          {conversation.unreadCount > 0 && (
            <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {conversation.unreadCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3
                className={`truncate text-sm font-semibold ${
                  conversation.unreadCount > 0
                    ? 'text-gray-900'
                    : 'text-gray-700'
                }`}
              >
                {conversation.contact.name}
              </h3>
              <ChannelBadge channel={conversation.channel} size="sm" />
            </div>
            <span className="flex-shrink-0 text-xs text-gray-500">
              {formatTimestamp(conversation.lastMessage.timestamp)}
            </span>
          </div>

          {/* Last Message */}
          <div className="flex items-center gap-2">
            {!conversation.lastMessage.fromUser && (
              <span className="text-xs text-blue-600">Tú:</span>
            )}
            <p
              className={`truncate text-sm ${
                conversation.unreadCount > 0
                  ? 'font-medium text-gray-900'
                  : 'text-gray-600'
              }`}
            >
              {conversation.lastMessage.text}
            </p>
          </div>

          {/* Contact Info */}
          <div className="mt-1 text-xs text-gray-500">
            {conversation.contact.phone || conversation.contact.username || ''}
          </div>
        </div>
      </div>
    </button>
  );
}


interface ChannelFilterProps {
  onChannelChange: (channel: string | null) => void;
  selectedChannel: string | null;
  unreadCounts?: Record<string, number>;
}

export function ChannelFilter({
  selectedChannel,
  onChannelChange,
  unreadCounts = {},
}: ChannelFilterProps) {
  const channels = [
    { icon: '💬', id: null, label: 'Todos' },
    { icon: '📱', id: 'whatsapp', label: 'WhatsApp' },
    { icon: '📷', id: 'instagram', label: 'Instagram' },
    { icon: '✈️', id: 'telegram', label: 'Telegram' },
    { icon: '📧', id: 'email', label: 'Email' },
    { icon: '🌐', id: 'web', label: 'Web Chat' },
  ];

  // Sum all unread for the "Todos" channel
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  const getUnreadCount = (channelId: string | null): number => {
    if (channelId === null) return totalUnread;
    return unreadCounts[channelId] || 0;
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {channels.map((channel) => {
        const unread = getUnreadCount(channel.id);
        return (
          <button
            className={`relative flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedChannel === channel.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            key={channel.id || 'all'}
            onClick={() => onChannelChange(channel.id)}
            type="button"
          >
            <span>{channel.icon}</span>
            <span>{channel.label}</span>
            {unread > 0 && (
              <span
                className={`ml-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  selectedChannel === channel.id
                    ? 'bg-white text-blue-600'
                    : 'bg-red-500 text-white'
                }`}
              >
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

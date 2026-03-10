interface ChannelFilterProps {
  onChannelChange: (channel: string | null) => void;
  selectedChannel: string | null;
}

export function ChannelFilter({
  selectedChannel,
  onChannelChange,
}: ChannelFilterProps) {
  const channels = [
    { icon: '💬', id: null, label: 'Todos' },
    { icon: '📱', id: 'whatsapp', label: 'WhatsApp' },
    { icon: '📷', id: 'instagram', label: 'Instagram' },
    { icon: '✈️', id: 'telegram', label: 'Telegram' },
    { icon: '📧', id: 'email', label: 'Email' },
    { icon: '🌐', id: 'web', label: 'Web Chat' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {channels.map((channel) => (
        <button
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
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
        </button>
      ))}
    </div>
  );
}


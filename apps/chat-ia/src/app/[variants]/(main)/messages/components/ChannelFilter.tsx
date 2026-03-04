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
  ];

  return (
    <div className="flex gap-2">
      {channels.map((channel) => (
        <button
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedChannel === channel.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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


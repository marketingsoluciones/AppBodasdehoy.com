'use client';

import { useRouter } from 'next/navigation';

interface Channel {
  color: string;
  icon: string;
  id: string;
  name: string;
  unreadCount: number;
}

interface InboxSidebarProps {
  onChannelSelect: (channel: string | null) => void;
  selectedChannel: string | null;
}

export function InboxSidebar({
  selectedChannel,
  onChannelSelect,
}: InboxSidebarProps) {
  const router = useRouter();

  const channels: Channel[] = [
    {
      color: 'bg-green-100 text-green-700 hover:bg-green-200',
      icon: '📱',
      id: 'whatsapp',
      name: 'WhatsApp',
      unreadCount: 5,
    },
    {
      color: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
      icon: '📷',
      id: 'instagram',
      name: 'Instagram',
      unreadCount: 2,
    },
    {
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      icon: '✈️',
      id: 'telegram',
      name: 'Telegram',
      unreadCount: 0,
    },
    {
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
      icon: '📧',
      id: 'email',
      name: 'Email',
      unreadCount: 1,
    },
  ];

  const totalUnread = channels.reduce((sum, ch) => sum + ch.unreadCount, 0);

  const handleChannelClick = (channelId: string | null) => {
    onChannelSelect(channelId);
    router.push('/messages');
  };

  return (
    <aside className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50">
      <div className="flex flex-col items-center gap-2 py-4">
        {/* Header */}
        <button
          className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg transition-colors ${
            selectedChannel === null
              ? 'bg-blue-600 text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          onClick={() => handleChannelClick(null)}
          title="Todos los canales"
          type="button"
        >
          <div className="text-2xl">💬</div>
          {totalUnread > 0 && (
            <div className="mt-0.5 text-xs font-semibold">{totalUnread}</div>
          )}
        </button>

        <div className="my-2 h-px w-12 bg-gray-300" />

        {/* Channels */}
        {channels.map((channel) => (
          <button
            className={`relative flex h-14 w-14 flex-col items-center justify-center rounded-lg transition-colors ${
              selectedChannel === channel.id
                ? 'bg-blue-600 text-white'
                : channel.color
            }`}
            key={channel.id}
            onClick={() => handleChannelClick(channel.id)}
            title={channel.name}
            type="button"
          >
            <div className="text-2xl">{channel.icon}</div>
            {channel.unreadCount > 0 && (
              <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[0.6rem] font-bold text-white">
                {channel.unreadCount}
              </div>
            )}
          </button>
        ))}

        <div className="my-2 h-px w-12 bg-gray-300" />

        {/* Settings */}
        <button
          className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl text-gray-600 transition-colors hover:bg-gray-200"
          title="Configuración"
          type="button"
        >
          ⚙️
        </button>
      </div>
    </aside>
  );
}


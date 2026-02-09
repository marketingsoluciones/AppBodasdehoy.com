interface ChannelBadgeProps {
  channel: 'whatsapp' | 'instagram' | 'telegram' | 'email';
  size?: 'sm' | 'md' | 'lg';
}

export function ChannelBadge({ channel, size = 'md' }: ChannelBadgeProps) {
  const configs = {
    email: {
      color: 'bg-purple-100 text-purple-700',
      icon: '📧',
      name: 'Email',
    },
    instagram: {
      color: 'bg-pink-100 text-pink-700',
      icon: '📷',
      name: 'Instagram',
    },
    telegram: {
      color: 'bg-blue-100 text-blue-700',
      icon: '✈️',
      name: 'Telegram',
    },
    whatsapp: {
      color: 'bg-green-100 text-green-700',
      icon: '📱',
      name: 'WhatsApp',
    },
  };

  const config = configs[channel];
  
  const sizeClasses = {
    lg: 'text-sm px-3 py-1.5',
    md: 'text-xs px-2 py-1',
    sm: 'text-[0.65rem] px-1.5 py-0.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
    >
      <span>{config.icon}</span>
      {size !== 'sm' && <span>{config.name}</span>}
    </span>
  );
}


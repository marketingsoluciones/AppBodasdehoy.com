import Image from 'next/image';

import { Message } from '../hooks/useMessages';

interface MessageItemProps {
  message: Message;
}

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sent': {
        return '✓';
      }
      case 'delivered': {
        return '✓✓';
      }
      case 'read': {
        return <span className="text-blue-500">✓✓</span>;
      }
      default: {
        return null;
      }
    }
  };

export function MessageItem({ message }: MessageItemProps) {
  const isFromUser = message.fromUser;

  return (
    <div className={`flex ${isFromUser ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isFromUser
            ? 'bg-white shadow-sm'
            : 'bg-blue-600 text-white shadow-md'
        }`}
      >
        {/* Message Text */}
        <p className="whitespace-pre-wrap break-words text-sm">{message.text}</p>

        {/* Timestamp & Status */}
        <div
          className={`mt-1 flex items-center justify-end gap-1 text-xs ${
            isFromUser ? 'text-gray-500' : 'text-blue-100'
          }`}
        >
          <span>{formatTime(message.timestamp)}</span>
          {!isFromUser && message.status && (
            <span className="ml-1">{getStatusIcon(message.status)}</span>
          )}
        </div>

        {/* Attachments (if any) */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => (
              <div key={index}>
                {attachment.type === 'image' ? (
                  <Image
                    alt="Adjunto"
                    className="h-auto max-w-full rounded-lg"
                    height={400}
                    sizes="(max-width: 768px) 80vw, 400px"
                    src={attachment.url}
                    width={400}
                  />
                ) : (
                  <a
                    className={`flex items-center gap-2 rounded-lg p-2 ${
                      isFromUser ? 'bg-gray-100' : 'bg-blue-700'
                    }`}
                    href={attachment.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="text-lg">📎</span>
                    <span className="text-sm">{attachment.filename}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


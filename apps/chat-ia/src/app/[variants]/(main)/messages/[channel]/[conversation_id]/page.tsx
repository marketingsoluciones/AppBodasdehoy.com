'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConversationList } from '../../components/ConversationList';
import { MessageList } from '../../components/MessageList';
import { MessageInput } from '../../components/MessageInput';
import { ConversationHeader } from '../../components/ConversationHeader';
import { TaskDetailWorkspace } from '../../components/TaskDetailWorkspace';

interface ConversationPageProps {
  params: Promise<{
    channel: string;
    conversation_id: string;
  }>;
}

// Matches ev-{eventId}-task pattern
function parseTaskChannel(channel: string): string | null {
  const m = channel.match(/^ev-(.+)-task$/);
  return m ? m[1] : null;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { channel, conversation_id } = use(params);
  const router = useRouter();
  const [searchFilter, setSearchFilter] = useState('');

  const taskEventId = parseTaskChannel(channel);

  if (taskEventId) {
    return <TaskDetailWorkspace eventId={taskEventId} taskId={conversation_id} />;
  }

  return (
    <>
      <div className="hidden w-[420px] shrink-0 overflow-auto border-r border-gray-200 bg-white md:block">
        <ConversationList channel={channel} selectedId={conversation_id} />
      </div>

      <div className="flex flex-1 flex-col bg-gray-50">
        <div className="md:hidden flex items-center gap-2 border-b border-gray-200 bg-white px-2 py-1">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => router.push('/messages')}
            type="button"
          >
            ←
          </button>
          <div className="flex-1">
            <ConversationHeader
              channel={channel}
              conversationId={conversation_id}
              onSearchFilter={setSearchFilter}
            />
          </div>
        </div>

        <div className="hidden md:block">
          <ConversationHeader
            channel={channel}
            conversationId={conversation_id}
            onSearchFilter={setSearchFilter}
          />
        </div>

        <div className="flex-1 overflow-auto">
          <MessageList channel={channel} conversationId={conversation_id} searchFilter={searchFilter} />
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <MessageInput channel={channel} conversationId={conversation_id} />
        </div>
      </div>
    </>
  );
}

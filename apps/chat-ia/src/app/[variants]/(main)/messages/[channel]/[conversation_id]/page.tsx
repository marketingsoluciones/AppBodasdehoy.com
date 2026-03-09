'use client';

import { use } from 'react';
import { InboxSidebar } from '../../components/InboxSidebar';
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

  const taskEventId = parseTaskChannel(channel);

  return (
    <>
      <InboxSidebar />

      {taskEventId ? (
        <TaskDetailWorkspace eventId={taskEventId} taskId={conversation_id} />
      ) : (
        <>
          {/* Lista de conversaciones */}
          <div className="w-80 shrink-0 overflow-auto border-r border-slate-700 bg-slate-900">
            <ConversationList channel={channel} selectedId={conversation_id} />
          </div>

          {/* Área de chat */}
          <div className="flex flex-1 flex-col bg-slate-900">
            <ConversationHeader conversationId={conversation_id} />

            <div className="flex-1 overflow-auto">
              <MessageList channel={channel} conversationId={conversation_id} />
            </div>

            <div className="border-t border-slate-700 p-4">
              <MessageInput channel={channel} conversationId={conversation_id} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

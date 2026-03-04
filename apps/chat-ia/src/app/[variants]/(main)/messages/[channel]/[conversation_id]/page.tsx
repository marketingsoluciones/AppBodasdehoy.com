'use client';

import { use } from 'react';
import { InboxSidebar } from '../../components/InboxSidebar';
import { ConversationList } from '../../components/ConversationList';
import { MessageList } from '../../components/MessageList';
import { MessageInput } from '../../components/MessageInput';
import { ConversationHeader } from '../../components/ConversationHeader';

interface ConversationPageProps {
  params: Promise<{
    channel: string;
    conversation_id: string;
  }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { channel, conversation_id } = use(params);

  return (
    <>
      {/* Sidebar con canales */}
      <InboxSidebar onChannelSelect={() => {}} selectedChannel={channel} />

      {/* Lista de conversaciones */}
      <div className="w-80 flex-shrink-0 overflow-auto border-r border-gray-200">
        <ConversationList channel={channel} selectedId={conversation_id} />
      </div>

      {/* Área de chat */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <ConversationHeader conversationId={conversation_id} />

        {/* Messages */}
        <div className="flex-1 overflow-auto">
          <MessageList
            channel={channel}
            conversationId={conversation_id}
          />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <MessageInput
            channel={channel}
            conversationId={conversation_id}
          />
        </div>
      </div>
    </>
  );
}


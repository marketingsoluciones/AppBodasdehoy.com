'use client';

import { InboxSidebar } from './components/InboxSidebar';
import { ConversationList } from './components/ConversationList';

export default function MessagesPage() {
  return (
    <>
      <InboxSidebar />

      {/* Lista de conversaciones — todas */}
      <div className="w-72 shrink-0 overflow-auto border-r border-gray-200 bg-white">
        <ConversationList channel={null} />
      </div>

      {/* Empty state */}
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">💬</div>
          <h3 className="mb-2 text-xl font-semibold text-gray-700">
            Selecciona una conversación
          </h3>
          <p className="text-gray-400">
            Elige una conversación de la izquierda para empezar a chatear
          </p>
        </div>
      </div>
    </>
  );
}

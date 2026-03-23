'use client';

import { ChannelSidebar } from './components/ChannelSidebar';

export default function MessagesPage() {
  return (
    <>
      {/* Mobile: ChannelSidebar ocupa todo el ancho (el layout lo oculta en desktop) */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <ChannelSidebar />
      </div>

      {/* Desktop: estado vacío — el panel izquierdo está en el layout */}
      <div className="hidden flex-1 items-center justify-center bg-gray-50 md:flex">
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

/**
 * ChatToggleButton - Boton para abrir/cerrar el sidebar de chat
 *
 * Se usa en el header de la app
 */

import { FC, memo } from 'react';
import { useChatSidebar } from '../../context/ChatSidebarContext';
import { IoChatbubbleEllipsesOutline, IoChatbubbleEllipses } from 'react-icons/io5';

interface ChatToggleButtonProps {
  className?: string;
}

const ChatToggleButton: FC<ChatToggleButtonProps> = ({ className = '' }) => {
  const { isOpen, toggleSidebar } = useChatSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className={`
        relative flex items-center gap-2 px-3 py-2 rounded-lg
        transition-all duration-200
        ${isOpen
          ? 'bg-primary text-white shadow-md'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        ${className}
      `}
      title={isOpen ? 'Cerrar Copilot (⌘⇧C)' : 'Abrir Copilot (⌘⇧C)'}
    >
      {isOpen ? (
        <IoChatbubbleEllipses className="w-5 h-5" />
      ) : (
        <IoChatbubbleEllipsesOutline className="w-5 h-5" />
      )}
      <span className="hidden md:inline text-sm font-medium">Copilot</span>

      {/* Indicador de nuevo/activo */}
      {!isOpen && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      )}
    </button>
  );
};

export default memo(ChatToggleButton);

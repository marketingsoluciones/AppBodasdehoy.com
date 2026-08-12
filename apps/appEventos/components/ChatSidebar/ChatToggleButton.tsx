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
  studio?: boolean;
}

const ChatToggleButton: FC<ChatToggleButtonProps> = ({ className = '', studio = false }) => {
  const { isOpen, toggleSidebar } = useChatSidebar();

  // Variante "studio" — píldora rosa fiel al HTML (Mis eventos.dc.html). Misma lógica (toggle).
  if (studio) {
    return (
      <button
        type="button"
        data-testid="copilot-toggle"
        aria-label={isOpen ? 'Cerrar Copilot' : 'Abrir Copilot'}
        onClick={toggleSidebar}
        title={isOpen ? 'Cerrar Copilot (⌘⇧C)' : 'Abrir Copilot (⌘⇧C)'}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FDF1F6', borderRadius: 22, padding: '10px 18px', border: 'none', cursor: 'pointer' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#EF5B94"><path d="M12 3l1.7 4.6L18 9l-4.3 1.4L12 15l-1.7-4.6L6 9l4.3-1.4L12 3z" /><path d="M18.5 14l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3z" opacity=".6" /></svg>
        <span style={{ font: '600 13px Poppins', color: '#EF5B94' }}>Copilot</span>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: isOpen ? '#EF5B94' : '#2FB37E' }} />
      </button>
    );
  }

  return (
    <button
      type="button"
      data-testid="copilot-toggle"
      aria-label={isOpen ? 'Cerrar Copilot' : 'Abrir Copilot'}
      onClick={toggleSidebar}
      className={`
        relative flex items-center gap-2 px-3 py-2 rounded-lg
        transition-all duration-200
        ${isOpen
          ? 'bg-primary text-white shadow-md'
          : 'border border-gray-200 bg-gray-50 text-gray-900 hover:bg-gray-100'
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

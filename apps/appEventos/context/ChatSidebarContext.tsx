import { createContext, useContext, useState, useCallback, useEffect, ReactNode, FC } from 'react';

interface ChatSidebarContextType {
  isOpen: boolean;
  width: number;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setWidth: (width: number) => void;
}

const ChatSidebarContext = createContext<ChatSidebarContextType | null>(null);

/** Anchos del panel Copilot (px). Default ~400 para leer el chat; se puede estrechar hasta MIN. */
export const CHAT_SIDEBAR_MIN_WIDTH = 234;
export const CHAT_SIDEBAR_MAX_WIDTH = 700;
export const CHAT_SIDEBAR_DEFAULT_WIDTH = 400;

const MIN_WIDTH = CHAT_SIDEBAR_MIN_WIDTH;
const MAX_WIDTH = CHAT_SIDEBAR_MAX_WIDTH;
const DEFAULT_WIDTH = CHAT_SIDEBAR_DEFAULT_WIDTH;

interface ChatSidebarProviderProps {
  children: ReactNode;
}

export const ChatSidebarProvider: FC<ChatSidebarProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [width, setWidthState] = useState(DEFAULT_WIDTH);

  const toggleSidebar = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setWidth = useCallback((newWidth: number) => {
    setWidthState(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + Shift + C
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        toggleSidebar();
      }
      // Escape para cerrar
      if (e.key === 'Escape' && isOpen) {
        closeSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSidebar, closeSidebar]);

  return (
    <ChatSidebarContext.Provider
      value={{
        isOpen,
        width,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        setWidth,
      }}
    >
      {children}
    </ChatSidebarContext.Provider>
  );
};

export const ChatSidebarContextProvider = (): ChatSidebarContextType | null => {
  return useContext(ChatSidebarContext);
};

export const useChatSidebar = (): ChatSidebarContextType => {
  const context = useContext(ChatSidebarContext);
  if (!context) {
    throw new Error('useChatSidebar must be used within ChatSidebarProvider');
  }
  return context;
};

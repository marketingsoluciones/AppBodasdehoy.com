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

const MIN_WIDTH = 320;
const MAX_WIDTH = 700; // Pantallas grandes: permitir panel más ancho para dividir bien la vista
const DEFAULT_WIDTH = 420;

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

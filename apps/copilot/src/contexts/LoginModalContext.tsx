'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

interface LoginModalContextType {
  closeLoginModal: () => void;
  isLoginModalOpen: boolean;
  loginReason: string | null;
  openLoginModal: (reason?: string) => void;
}

const LoginModalContext = createContext<LoginModalContextType | undefined>(undefined);

export const LoginModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<string | null>(null);

  const openLoginModal = useCallback((reason?: string) => {
    setLoginReason(reason || null);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setLoginReason(null);
  }, []);

  return (
    <LoginModalContext.Provider
      value={{
        closeLoginModal,
        isLoginModalOpen,
        loginReason,
        openLoginModal,
      }}
    >
      {children}
    </LoginModalContext.Provider>
  );
};

export const useLoginModal = (): LoginModalContextType => {
  const context = useContext(LoginModalContext);
  // Retornar funciones vacías si no hay contexto (para evitar errores durante SSR o fuera del provider)
  if (!context) {
    return {
      closeLoginModal: () => {},
      isLoginModalOpen: false,
      loginReason: null,
      openLoginModal: () => {},
    };
  }
  return context;
};

export default LoginModalContext;

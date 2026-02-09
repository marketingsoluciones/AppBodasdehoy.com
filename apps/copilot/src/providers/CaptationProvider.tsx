'use client';

import { createContext, memo, ReactNode, useCallback, useContext, useState } from 'react';

import RegisterPromptModal from '@/components/RegisterPromptModal';
import { CaptationResponse } from '@/hooks/useAuthCheck';

interface CaptationContextType {
  hideCaptationModal: () => void;
  showCaptationModal: (data: CaptationResponse) => void;
}

const CaptationContext = createContext<CaptationContextType | null>(null);

interface CaptationProviderProps {
  children: ReactNode;
}

export const CaptationProvider = memo<CaptationProviderProps>(({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [captationData, setCaptationData] = useState<CaptationResponse | null>(null);

  const showCaptationModal = useCallback((data: CaptationResponse) => {
    setCaptationData(data);
    setIsModalOpen(true);
  }, []);

  const hideCaptationModal = useCallback(() => {
    setIsModalOpen(false);
    setCaptationData(null);
  }, []);

  const handleContinueAsGuest = useCallback(() => {
    console.log('Usuario eligió continuar como guest');
    hideCaptationModal();
  }, [hideCaptationModal]);

  const handleRegister = useCallback(() => {
    console.log('Usuario eligió registrarse');
  }, []);

  return (
    <CaptationContext.Provider value={{ hideCaptationModal, showCaptationModal }}>
      {children}
      <RegisterPromptModal
        captationData={captationData}
        onClose={hideCaptationModal}
        onContinueAsGuest={handleContinueAsGuest}
        onRegister={handleRegister}
        open={isModalOpen}
      />
    </CaptationContext.Provider>
  );
});

CaptationProvider.displayName = 'CaptationProvider';

/**
 * Hook para usar el contexto de captación
 */
export const useCaptation = (): CaptationContextType => {
  const context = useContext(CaptationContext);
  if (!context) {
    throw new Error('useCaptation must be used within a CaptationProvider');
  }
  return context;
};

export default CaptationProvider;

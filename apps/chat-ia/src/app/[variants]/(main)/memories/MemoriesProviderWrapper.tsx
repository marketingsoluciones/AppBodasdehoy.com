'use client';

import { MemoriesProvider } from '@bodasdehoy/memories';
import { PropsWithChildren, useEffect, useState } from 'react';

import { useDevelopment } from '@/utils/developmentDetector';

function useDevUserId(): string {
  const [userId, setUserId] = useState('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dev-user-config');
      if (!raw?.trim().startsWith('{')) return setUserId('');
      const config = JSON.parse(raw);
      const id = config?.userId || config?.user_id || '';
      if (
        id &&
        id !== 'guest' &&
        id !== 'anonymous' &&
        id !== 'visitante@guest.local'
      ) {
        setUserId(id);
      } else {
        setUserId('');
      }
    } catch {
      setUserId('');
    }
  }, []);
  return userId;
}

/**
 * Inyecta apiBaseUrl, userId y development en el store de @bodasdehoy/memories
 * para que las páginas de Memories usen el paquete sin pasar params en cada llamada.
 */
export function MemoriesProviderWrapper({ children }: PropsWithChildren) {
  const userId = useDevUserId();
  const { development } = useDevelopment();
  const apiBaseUrl =
    typeof window !== 'undefined'
      ? ''
      : (process.env.NEXT_PUBLIC_BACKEND_URL || '');

  return (
    <MemoriesProvider
      apiBaseUrl={apiBaseUrl}
      development={development}
      userId={userId}
    >
      {children as any}
    </MemoriesProvider>
  );
}

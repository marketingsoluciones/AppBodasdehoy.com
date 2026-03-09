import React, { createContext, useContext, useEffect, type ReactNode } from 'react';

import { useMemoriesStore } from './store';

export interface MemoriesProviderProps {
  apiBaseUrl: string;
  userId: string;
  development?: string;
  children: ReactNode;
}

const MemoriesContext = createContext<Omit<MemoriesProviderProps, 'children'> | null>(null);

/**
 * Provee configuración (apiBaseUrl, userId, development) al store de Memories.
 * Envuelve la app o la ruta que use Memories y pasa los valores del host.
 */
export function MemoriesProvider({
  apiBaseUrl,
  userId,
  development = 'bodasdehoy',
  children,
}: MemoriesProviderProps) {
  useEffect(() => {
    useMemoriesStore.getState().setConfig(apiBaseUrl, userId, development);
  }, [apiBaseUrl, userId, development]);

  return (
    <MemoriesContext.Provider value={{ apiBaseUrl, userId, development: development ?? 'bodasdehoy' }}>
      {children}
    </MemoriesContext.Provider>
  );
}

export function useMemoriesConfig(): Omit<MemoriesProviderProps, 'children'> | null {
  return useContext(MemoriesContext);
}

'use client';

import { PropsWithChildren, memo, useEffect } from 'react';
import { createStoreUpdater } from 'zustand-utils';

import { useUserStore } from '@/store/user';

const NoAuthProvider = memo<PropsWithChildren>(({ children }) => {
  const useStoreUpdater = createStoreUpdater(useUserStore);

  // ✅ FIX: Establecer isLoaded inmediatamente
  useStoreUpdater('isLoaded', true);

  // ✅ FIX: También establecer directamente en el store para asegurar que se aplique
  useEffect(() => {
    useUserStore.setState({ isLoaded: true });
  }, []);

  return children;
});

export default NoAuthProvider;

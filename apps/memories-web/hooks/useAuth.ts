import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { authBridge } from '@bodasdehoy/shared';

const USER_ID_KEY = 'memories_user_id';

interface UseAuthResult {
  userId: string | null;
  hydrated: boolean;
  handleLogin: (id: string) => void;
  handleLogout: () => void;
}

export function useAuth({ redirectTo }: { redirectTo?: string } = {}): UseAuthResult {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 1. Auth via sessionBodas cross-subdomain cookie (AuthBridge)
    const authState = authBridge.getSharedAuthState();
    if (authState.isAuthenticated && authState.user) {
      const bridgeId = authState.user.email || authState.user.uid;
      setUserId(bridgeId);
      localStorage.setItem(USER_ID_KEY, bridgeId);
      setHydrated(true);
      return;
    }

    // 2. Fallback: userId from localStorage
    const stored = localStorage.getItem(USER_ID_KEY);
    setUserId(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !userId && redirectTo) {
      router.push(redirectTo);
    }
  }, [hydrated, userId, redirectTo, router]);

  const handleLogin = (id: string) => {
    localStorage.setItem(USER_ID_KEY, id);
    setUserId(id);
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_ID_KEY);
    setUserId(null);
    // Limpiar cookie compartida idTokenV0.1.0 para que el logout sea global
    // (chat-ia y appEventos también perderán la sesión al recargar)
    authBridge.clearAuth();
  };

  return { userId, hydrated, handleLogin, handleLogout };
}

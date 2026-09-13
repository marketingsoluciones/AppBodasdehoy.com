'use client';

import { useEffect } from 'react';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { useBandejaStore } from '@/store/bandeja';
import { buildHeaders } from '../utils/auth';

/** React to late token hydration and identity changes in this tab as well as other tabs. */
export function useBandejaSession() {
  const { checkAuth } = useAuthCheck();
  const init = useBandejaStore(s => s.initBandeja);
  const destroy = useBandejaStore(s => s.destroyBandeja);
  useEffect(() => {
    let scope: string | null = null;
    const sync = () => {
      const auth = checkAuth();
      const next = auth.isAuthenticated && auth.hasValidJwt && auth.userId
        ? JSON.stringify([auth.development, auth.userId]) : null;
      if (next === scope) return;
      destroy();
      scope = next;
      if (next) void init(auth.development, buildHeaders);
    };
    sync();
    // Same-tab localStorage writes do not emit a storage event.
    const timer = window.setInterval(sync, 1000);
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      destroy();
    };
  }, [checkAuth, init, destroy]);
}

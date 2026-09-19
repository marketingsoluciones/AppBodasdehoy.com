'use client';

import { useEffect, useState } from 'react';

import { getUnreadNotificationsCount } from '@/services/mcpApi/notifications';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';
import { safeLocalStorage } from '@/utils/safeLocalStorage';

const POLL_INTERVAL_MS = 60_000;

/** Returns total unread count (notifications + future: WA messages).
 *  Polls every 60s. Returns 0 when user is not logged in. */
export function useInboxUnreadCount(): number {
  const isLoggedIn = useUserStore(authSelectors.isLoginWithAuth);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const directToken = safeLocalStorage.getItem('jwt_token');
    const firebaseToken = safeLocalStorage.getItem('mcp_jwt_token');
    const hasToken =
      !!(directToken && directToken !== 'null' && directToken !== 'undefined') ||
      !!(firebaseToken && firebaseToken !== 'null' && firebaseToken !== 'undefined');

    if (!isLoggedIn || !hasToken) {
      setCount(0);
      return;
    }

    const fetch = () => {
      getUnreadNotificationsCount()
        .then(setCount)
        .catch((e) => console.warn('[useInboxUnreadCount] getUnreadNotificationsCount falló:', e?.message));
    };

    // BUG-CW-N18 + perf mobile (informe QA 23-jun 5ª ronda): pausar polling
    // cuando pestaña en background. La campana no necesita actualizarse si
    // el usuario no está mirando.
    fetch();
    if (typeof document === 'undefined') return;

    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => {
        if (!document.hidden) fetch();
      }, POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (id) {
        clearInterval(id);
        id = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else { fetch(); start(); }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [isLoggedIn]);

  return count;
}

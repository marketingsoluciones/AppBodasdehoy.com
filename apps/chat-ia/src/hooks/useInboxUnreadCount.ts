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
    const firebaseToken = safeLocalStorage.getItem('api2_jwt_token');
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
        .catch(() => {});
    };

    fetch();
    const id = setInterval(fetch, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoggedIn]);

  return count;
}

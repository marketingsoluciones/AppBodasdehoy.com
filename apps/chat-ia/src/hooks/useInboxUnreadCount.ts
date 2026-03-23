'use client';

import { useEffect, useState } from 'react';

import { getUnreadNotificationsCount } from '@/services/api2/notifications';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

const POLL_INTERVAL_MS = 60_000;

/** Returns total unread count (notifications + future: WA messages).
 *  Polls every 60s. Returns 0 when user is not logged in. */
export function useInboxUnreadCount(): number {
  const isLoggedIn = useUserStore(authSelectors.isLogin);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
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

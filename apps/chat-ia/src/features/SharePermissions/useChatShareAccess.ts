import { useEffect, useState } from 'react';
import { canManageChat } from './sharing';

export function useChatShareAccess(sessionId: string | undefined, userId: string | undefined): boolean {
  const [access, setAccess] = useState<{ sessionId: string; userId: string; allowed: boolean }>();
  useEffect(() => {
    if (!sessionId || !userId) return;
    const controller = new AbortController();
    const refresh = (): void => {
      void canManageChat(sessionId, userId, controller.signal)
        .then(allowed => { if (!controller.signal.aborted) setAccess({ sessionId, userId, allowed }); })
        .catch(() => { if (!controller.signal.aborted) setAccess({ sessionId, userId, allowed: false }); });
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.removeEventListener('focus', refresh); };
  }, [sessionId, userId]);
  return access?.sessionId === sessionId && access?.userId === userId && access?.allowed === true;
}

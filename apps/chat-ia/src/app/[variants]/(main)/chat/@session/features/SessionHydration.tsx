'use client';

import { useQueryState } from 'nuqs';
import { parseAsString } from 'nuqs/server';
import { memo, useEffect } from 'react';
import { createStoreUpdater } from 'zustand-utils';

import { useAgentStore } from '@/store/agent';
import { useChatStore } from '@/store/chat';
import { useSessionStore } from '@/store/session';

// sync outside state to useSessionStore
const SessionHydration = memo(() => {
  const useStoreUpdater = createStoreUpdater(useSessionStore);
  const useAgentStoreUpdater = createStoreUpdater(useAgentStore);
  const useChatStoreUpdater = createStoreUpdater(useChatStore);
  const [switchTopic] = useChatStore((s) => [s.switchTopic]);

  const storageKey =
    'LobeChat_LastSession_' + (process.env.NEXT_PUBLIC_DEVELOPMENT || process.env.NEXT_PUBLIC_WHITELABEL || 'default');

  // two-way bindings the url and session store
  const [session, setSession] = useQueryState(
    'session',
    parseAsString.withDefault('inbox').withOptions({ history: 'replace', throttleMs: 50 }),
  );
  useStoreUpdater('activeId', session);
  useAgentStoreUpdater('activeId', session);
  useChatStoreUpdater('activeId', session);

  useEffect(() => {
    const hasSessionParam = new URLSearchParams(window.location.search).has('session');
    if (!hasSessionParam) {
      const stored = window.localStorage.getItem(storageKey);
      if (stored && stored !== 'inbox') setSession(stored);
    }

    const unsubscribe = useSessionStore.subscribe(
      (s) => s.activeId,
      (state) => {
        switchTopic();
        setSession(state);
        if (state && state !== 'inbox') window.localStorage.setItem(storageKey, state);
      },
    );

    return () => {
      unsubscribe();
    };
  }, [setSession, storageKey, switchTopic]);

  return null;
});

export default SessionHydration;

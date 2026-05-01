'use client';

import { useSearchParams } from 'next/navigation';

import ChatHydration from './ChatHydration';
import ThreadHydration from './ThreadHydration';

export default function ConditionalHydration() {
  const searchParams = useSearchParams();
  const isExternal = searchParams.get('external') === 'true';

  if (isExternal) return null;

  return (
    <>
      <ChatHydration />
      <ThreadHydration />
    </>
  );
}


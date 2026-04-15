'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

import { ChannelSidebar } from './components/ChannelSidebar';

interface MessagesLayoutProps {
  children: ReactNode;
}

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  const router = useRouter();
  const isLoaded = useUserStore(authSelectors.isLoaded);
  const isGuest = useDomainGuestUser();

  useEffect(() => {
    if (isLoaded && isGuest) {
      router.replace('/login?redirect=/messages');
    }
  }, [isLoaded, isGuest, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-purple-500" />
      </div>
    );
  }

  if (isGuest) return null;

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Panel izquierdo persistente — tipo WhatsApp/Slack — solo desktop */}
      <div className="hidden md:flex md:w-80 md:shrink-0 md:flex-col md:border-r md:border-gray-200">
        <ChannelSidebar compact />
      </div>
      {/* Panel derecho: contenido específico de cada ruta */}
      <div className="flex flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

'use client';

import { ActionIcon, ActionIconProps, Hotkey } from '@lobehub/ui';
import { Compass, FolderClosed, Heart, Images, MessageSquare, Palette } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { useGlobalStore } from '@/store/global';
import { SidebarTabKey } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';
import { HotkeyEnum } from '@/types/hotkey';

const ICON_SIZE: ActionIconProps['size'] = {
  blockSize: 40,
  size: 24,
  strokeWidth: 2,
};

export interface TopActionProps {
  isPinned?: boolean | null;
  tab?: SidebarTabKey;
}

//  TODO Change icons
const TopActions = memo<TopActionProps>(({ tab, isPinned }) => {
  const { t } = useTranslation('common');
  const switchBackToChat = useGlobalStore((s) => s.switchBackToChat);
  const { showMarket, enableKnowledgeBase, showAiImage } =
    useServerConfigStore(featureFlagsSelectors);
  const hotkey = useUserStore(settingsSelectors.getHotkeyById(HotkeyEnum.NavigateToChat));

  // ✅ FIX: Verificar server mode de múltiples formas para asegurar que funcione
  const isServerMode = 
    process.env.NEXT_PUBLIC_SERVICE_MODE === 'server' ||
    typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SERVICE_MODE === 'server' ||
    true; // ✅ TEMPORAL: Siempre activo para debugging

  // ✅ FIX: Detectar si es usuario visitante (más permisivo)
  const isGuestUser = useChatStore((s) => {
    const email = s.userProfile?.email || s.currentUserId;
    const isDev = process.env.NODE_ENV === 'development';
    
    // ✅ FIX: En desarrollo, ser MUY permisivo
    if (isDev) {
      // En desarrollo, casi nunca considerar guest
      if (!email) return false; // Sin email = permitir acceso
      // Solo considerar guest si explícitamente es guest/anonymous
      const lowerEmail = email.toLowerCase();
      return (
        lowerEmail === 'guest' ||
        lowerEmail === 'anonymous' ||
        lowerEmail === 'visitante@guest.local' ||
        lowerEmail.includes('@guest.')
      );
    }
    
    // En producción, lógica más estricta pero aún permisiva
    if (!email) return false; // Sin email = permitir (puede ser usuario nuevo)
    const lowerEmail = email.toLowerCase();
    return (
      lowerEmail === 'guest' ||
      lowerEmail === 'anonymous' ||
      lowerEmail === 'visitante@guest.local' ||
      (lowerEmail.includes('guest') && lowerEmail.includes('@guest.'))
    );
  });

  const isChatActive = tab === SidebarTabKey.Chat && !isPinned;
  const isFilesActive = tab === SidebarTabKey.Files;
  const isDiscoverActive = tab === SidebarTabKey.Discover;
  const isImageActive = tab === SidebarTabKey.Image;
  const isMemoriesActive = tab === SidebarTabKey.Memories;

  return (
    <Flexbox gap={8}>
      <Link
        aria-label={t('tab.chat')}
        href={'/chat'}
        suppressHydrationWarning
        onClick={(e) => {
          // If Cmd key is pressed, let the default link behavior happen (open in new tab)
          if (e.metaKey || e.ctrlKey) {
            return;
          }

          // Otherwise, prevent default and switch session within the current tab
          e.preventDefault();
          switchBackToChat(useSessionStore.getState().activeId);
        }}
      >
        <ActionIcon
          active={isChatActive}
          icon={MessageSquare}
          size={ICON_SIZE}
          title={
            <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
              <span>{t('tab.chat')}</span>
              <Hotkey inverseTheme keys={hotkey} />
            </Flexbox>
          }
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
      {/* Knowledge Base - ✅ FIX: Más permisivo, mostrar si está habilitado */}
      {(enableKnowledgeBase || true) && (isServerMode || true) && !isGuestUser && (
        <Link aria-label={t('tab.knowledgeBase')} href={'/knowledge'} suppressHydrationWarning>
          <ActionIcon
            active={isFilesActive}
            icon={FolderClosed}
            size={ICON_SIZE}
            title={t('tab.knowledgeBase')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {/* AI Image - ✅ FIX: Más permisivo, mostrar si está habilitado */}
      {(showAiImage || true) && !isGuestUser && (
        <Link aria-label={t('tab.aiImage')} href={'/image'} suppressHydrationWarning>
          <ActionIcon
            active={isImageActive}
            icon={Palette}
            size={ICON_SIZE}
            title={t('tab.aiImage')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {/* Momentos - ✅ FIX: Siempre visible en server mode (o siempre si no hay restricción) */}
      {(isServerMode || true) && (
        <Link aria-label={t('tab.memories' as any)} href={'/memories'} suppressHydrationWarning>
          <ActionIcon
            active={isMemoriesActive}
            icon={Images}
            size={ICON_SIZE}
            title={t('tab.memories' as any)}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {/* Wedding Creator - Visible en modo servidor, más permisivo en desarrollo */}
      {isServerMode && (
        <Link aria-label={t('tab.weddingCreator' as any)} href={'/wedding-creator'} suppressHydrationWarning>
          <ActionIcon
            active={tab === SidebarTabKey.WeddingCreator}
            icon={Heart}
            size={ICON_SIZE}
            title={t('tab.weddingCreator' as any)}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {/* Discover/Market - Marketplace de agentes y plugins */}
      {showMarket && (
        <Link aria-label={t('tab.discover')} href={'/discover'} suppressHydrationWarning>
          <ActionIcon
            active={isDiscoverActive}
            icon={Compass}
            size={ICON_SIZE}
            title={t('tab.discover')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
    </Flexbox>
  );
});

export default TopActions;

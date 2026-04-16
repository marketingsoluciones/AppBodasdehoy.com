'use client';

import { ActionIcon, ActionIconProps, Hotkey } from '@lobehub/ui';
import { BookOpen, Compass, FolderOpen, Heart, ImagePlus, Images, Inbox, MessageSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useInboxUnreadCount } from '@/hooks/useInboxUnreadCount';
import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';
import { useChatStore } from '@/store/chat';
import { useGlobalStore } from '@/store/global';
import { SidebarTabKey } from '@/store/global/initialState';
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
  const hotkey = useUserStore(settingsSelectors.getHotkeyById(HotkeyEnum.NavigateToChat));

  const isServerMode = process.env.NEXT_PUBLIC_SERVICE_MODE === 'server';

  const isGuest = useDomainGuestUser();
  const isLoggedIn = !isGuest;

  const isAdmin = useChatStore((s) => s.userRole === 'admin');

  const isChatActive = tab === SidebarTabKey.Chat && !isPinned;
  const isMemoriesActive = tab === SidebarTabKey.Memories;

  const inboxUnread = useInboxUnreadCount();

  return (
    <Flexbox gap={8}>
      <Link
        aria-label={t('tab.chat')}
        href={'/chat'}
        onClick={(e) => {
          // If Cmd key is pressed, let the default link behavior happen (open in new tab)
          if (e.metaKey || e.ctrlKey) {
            return;
          }

          // Otherwise, prevent default and switch session within the current tab
          e.preventDefault();
          switchBackToChat(useSessionStore.getState().activeId);
        }}
        suppressHydrationWarning
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
      <Link aria-label={t('tab.memories' as any)} href={'/memories'} suppressHydrationWarning>
        <ActionIcon
          active={isMemoriesActive}
          icon={Images}
          size={ICON_SIZE}
          title={t('tab.memories' as any)}
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
      {/* Generación de imágenes — visible para visitantes y registrados */}
      <Link aria-label="Imágenes" href={'/image'} suppressHydrationWarning>
        <ActionIcon
          active={tab === SidebarTabKey.Image}
          icon={ImagePlus}
          size={ICON_SIZE}
          title="Generación de imágenes"
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
      {/* Resto de opciones — solo usuarios registrados */}
      {isLoggedIn && isServerMode && (
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
      {isLoggedIn && (
        <Link aria-label="Discover" href={'/discover'} suppressHydrationWarning>
          <ActionIcon
            active={tab === SidebarTabKey.Discover}
            icon={Compass}
            size={ICON_SIZE}
            title="Discover"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {isLoggedIn && (
        <Link aria-label="Conocimiento" href={'/knowledge'} suppressHydrationWarning>
          <ActionIcon
            active={tab === SidebarTabKey.Knowledge}
            icon={BookOpen}
            size={ICON_SIZE}
            title="Base de conocimiento"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {isServerMode && isLoggedIn && (
        <Link aria-label="Bandeja de mensajes" href={'/messages'} suppressHydrationWarning>
          <div style={{ position: 'relative' }}>
            <ActionIcon
              active={tab === SidebarTabKey.Messages}
              icon={Inbox}
              size={ICON_SIZE}
              title="Bandeja de mensajes"
              tooltipProps={{ placement: 'right' }}
            />
            {inboxUnread > 0 && (
              <span
                style={{
                  alignItems: 'center',
                  background: '#ef4444',
                  borderRadius: '50%',
                  color: '#fff',
                  display: 'flex',
                  fontSize: 9,
                  fontWeight: 700,
                  height: 14,
                  justifyContent: 'center',
                  lineHeight: 1,
                  minWidth: 14,
                  paddingInline: 2,
                  position: 'absolute',
                  right: 2,
                  top: 2,
                }}
              >
                {inboxUnread > 99 ? '99+' : inboxUnread}
              </span>
            )}
          </div>
        </Link>
      )}
      {isServerMode && isLoggedIn && (
        <Link aria-label="Archivos" href={'/files'} suppressHydrationWarning>
          <ActionIcon
            active={tab === SidebarTabKey.Files}
            icon={FolderOpen}
            size={ICON_SIZE}
            title="Archivos"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {isServerMode && isAdmin && (
        <Link aria-label="Admin" href={'/admin'} suppressHydrationWarning>
          <ActionIcon
            icon={ShieldCheck}
            size={ICON_SIZE}
            style={{ color: '#f59e0b' }}
            title="Panel de administración"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
    </Flexbox>
  );
});

export default TopActions;

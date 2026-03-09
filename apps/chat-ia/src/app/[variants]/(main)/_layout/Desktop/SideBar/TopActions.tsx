'use client';

import { ActionIcon, ActionIconProps, Hotkey } from '@lobehub/ui';
import { Heart, Images, Inbox, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { NotificationBell } from './NotificationBell';
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

  const isGuestUser = useChatStore((s) => {
    const email = s.userProfile?.email || s.currentUserId;
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    return (
      lowerEmail === 'guest' ||
      lowerEmail === 'anonymous' ||
      lowerEmail === 'visitante@guest.local' ||
      lowerEmail.includes('@guest.')
    );
  });

  const isChatActive = tab === SidebarTabKey.Chat && !isPinned;
  const isMemoriesActive = tab === SidebarTabKey.Memories;
  const isMessagesActive = tab === SidebarTabKey.Messages;

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
      {isServerMode && !isGuestUser && (
        <Link aria-label={t('tab.messages' as any)} href={'/messages'} suppressHydrationWarning>
          <ActionIcon
            active={isMessagesActive}
            icon={Inbox}
            size={ICON_SIZE}
            title={t('tab.messages' as any)}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
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
      {isServerMode && !isGuestUser && <NotificationBell />}
    </Flexbox>
  );
});

export default TopActions;

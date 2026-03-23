'use client';

import { Icon } from '@lobehub/ui';
import { TabBar, type TabBarProps } from '@lobehub/ui/mobile';
import { createStyles } from 'antd-style';
import { Compass, Inbox, MessageSquare, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { rgba } from 'polished';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { MOBILE_TABBAR_HEIGHT } from '@/const/layoutTokens';
import { useActiveTabKey } from '@/hooks/useActiveTabKey';
import { useInboxUnreadCount } from '@/hooks/useInboxUnreadCount';
import { SidebarTabKey } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

const useStyles = createStyles(({ css, token }) => ({
  active: css`
    svg {
      fill: ${rgba(token.colorPrimary, 0.33)};
    }
  `,
  container: css`
    position: fixed;
    z-index: 100;
    inset-block-end: 0;
    inset-inline: 0 0;
  `,
}));

const NavBar = memo(() => {
  const { t } = useTranslation('common');
  const { styles } = useStyles();
  const activeKey = useActiveTabKey();
  const router = useRouter();

  const { showMarket } = useServerConfigStore(featureFlagsSelectors);
  const isLoggedIn = useUserStore(authSelectors.isLogin);
  const isServerMode = process.env.NEXT_PUBLIC_SERVICE_MODE === 'server';
  const inboxUnread = useInboxUnreadCount();

  const items: TabBarProps['items'] = useMemo(
    () =>
      [
        {
          icon: (active: boolean) => (
            <Icon className={active ? styles.active : undefined} icon={MessageSquare} />
          ),
          key: SidebarTabKey.Chat,
          onClick: () => {
            router.push('/chat');
          },
          title: t('tab.chat'),
        },
        // Bandeja de mensajes — solo usuarios registrados en server mode
        isServerMode && isLoggedIn && {
          icon: (active: boolean) => (
            <div style={{ position: 'relative' }}>
              <Icon className={active ? styles.active : undefined} icon={Inbox} />
              {inboxUnread > 0 && (
                <span
                  style={{
                    alignItems: 'center',
                    background: '#ef4444',
                    borderRadius: '50%',
                    color: '#fff',
                    display: 'flex',
                    fontSize: 8,
                    fontWeight: 700,
                    height: 13,
                    justifyContent: 'center',
                    lineHeight: 1,
                    minWidth: 13,
                    paddingInline: 2,
                    position: 'absolute',
                    right: -4,
                    top: -4,
                  }}
                >
                  {inboxUnread > 99 ? '99+' : inboxUnread}
                </span>
              )}
            </div>
          ),
          key: SidebarTabKey.Messages,
          onClick: () => {
            router.push('/messages');
          },
          title: 'Mensajes',
        },
        // Discover/Market - Marketplace de agentes y plugins
        showMarket && {
          icon: (active: boolean) => (
            <Icon className={active ? styles.active : undefined} icon={Compass} />
          ),
          key: SidebarTabKey.Discover,
          onClick: () => {
            router.push('/discover');
          },
          title: t('tab.discover'),
        },
        {
          icon: (active: boolean) => (
            <Icon className={active ? styles.active : undefined} icon={User} />
          ),
          key: SidebarTabKey.Me,
          onClick: () => {
            router.push('/me');
          },
          title: t('tab.me'),
        },
      ].filter(Boolean) as TabBarProps['items'],
    [t, showMarket, isLoggedIn, isServerMode, inboxUnread, router, styles.active],
  );

  return (
    <TabBar
      activeKey={activeKey}
      className={styles.container}
      height={MOBILE_TABBAR_HEIGHT}
      items={items}
    />
  );
});

NavBar.displayName = 'NavBar';

export default NavBar;

'use client';

import { Icon } from '@lobehub/ui';
import { TabBar, type TabBarProps } from '@lobehub/ui/mobile';
import { createStyles } from 'antd-style';
import { Bot, Compass, FolderClosed, Globe, Images, Inbox, LayoutGrid, MessageSquare, Settings, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { rgba } from 'polished';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MOBILE_TABBAR_HEIGHT } from '@/const/layoutTokens';
import { useActiveTabKey } from '@/hooks/useActiveTabKey';
import { useInboxUnreadCount } from '@/hooks/useInboxUnreadCount';
import { useDomainGuestUser } from '@/hooks/useDomainGuestUser';
import { SidebarTabKey } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

const useStyles = createStyles(({ css, token }) => ({
  active: css`
    svg {
      fill: ${rgba(token.colorPrimary, 0.33)};
    }
  `,
  backdrop: css`
    position: fixed;
    z-index: 900;
    inset: 0;
    background: ${rgba('#000', 0.45)};
    animation: navFade 0.15s ease;
    @keyframes navFade {
      from { opacity: 0; }
    }
  `,
  container: css`
    position: fixed;
    z-index: 100;
    inset-block-end: 0;
    inset-inline: 0 0;
  `,
  item: css`
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 14px 18px;
    border-radius: 12px;
    color: ${token.colorText};
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    &:active {
      background: ${token.colorFillSecondary};
    }
    svg {
      color: ${token.colorPrimary};
      flex: none;
    }
  `,
  sheet: css`
    position: fixed;
    z-index: 901;
    inset-inline: 0 0;
    inset-block-end: 0;
    padding: 6px 12px calc(18px + env(safe-area-inset-bottom));
    border-start-start-radius: 20px;
    border-start-end-radius: 20px;
    background: ${token.colorBgContainer};
    box-shadow: 0 -8px 34px ${rgba('#000', 0.2)};
    animation: navSlide 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    @keyframes navSlide {
      from { transform: translateY(100%); }
    }
  `,
  sheetHandle: css`
    width: 40px;
    height: 4px;
    margin: 8px auto 12px;
    border-radius: 3px;
    background: ${token.colorBorder};
  `,
  sheetTitle: css`
    padding: 0 8px 8px;
    color: ${token.colorTextTertiary};
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  `,
}));

const NavBar = memo(() => {
  const { t } = useTranslation('common');
  const { styles } = useStyles();
  const activeKey = useActiveTabKey();
  const router = useRouter();

  const { showMarket } = useServerConfigStore(featureFlagsSelectors);
  const isGuest = useDomainGuestUser();
  const isLoggedIn = !isGuest;
  const isServerMode = process.env.NEXT_PUBLIC_SERVICE_MODE === 'server';
  const inboxUnread = useInboxUnreadCount();

  // P0 móvil (5-sep): en móvil se perdía el acceso al resto de la app (Agentes, Momentos,
  // Documentos, Editor de webs, Ajustes). La pestaña "Más" abre una hoja con esas secciones.
  // OJO: declarar DESPUÉS de isLoggedIn (si no, TDZ → ReferenceError → crash de render).
  const [moreOpen, setMoreOpen] = useState(false);
  const moreSections = useMemo(
    () =>
      [
        isLoggedIn && { href: '/agentes', icon: Bot, title: 'Agentes' },
        { href: '/memories', icon: Images, title: 'Momentos' },
        { href: '/files', icon: FolderClosed, title: 'Documentos' },
        { href: '/wedding-creator', icon: Globe, title: 'Web de boda' },
        { href: '/settings', icon: Settings, title: 'Ajustes y saldo' },
      ].filter(Boolean) as Array<{ href: string; icon: typeof Bot; title: string }>,
    [isLoggedIn],
  );

  const items: TabBarProps['items'] = useMemo(
    () =>
      [
        {
          icon: (active: boolean) => (
            <Icon className={active ? styles.active : undefined} icon={MessageSquare} />
          ),
          key: SidebarTabKey.Chat,
          onClick: () => {
            router.push('/asistente');
          },
          // R1 nomenclatura (diseño PLAN-CHAT-IA-REDISENO): "Chat IA" → "Asistente".
          title: 'Asistente',
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
            router.push('/bandeja');
          },
          // R1 nomenclatura: la mensajería unificada se llama "Bandeja".
          title: 'Bandeja',
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
        {
          icon: (active: boolean) => (
            <Icon className={active ? styles.active : undefined} icon={LayoutGrid} />
          ),
          key: 'more',
          onClick: () => setMoreOpen(true),
          title: 'Más',
        },
      ].filter(Boolean) as TabBarProps['items'],
    [t, showMarket, isGuest, isLoggedIn, isServerMode, inboxUnread, router, styles.active],
  );

  return (
    <>
      <TabBar
        activeKey={activeKey}
        className={styles.container}
        height={MOBILE_TABBAR_HEIGHT}
        items={items}
      />
      {moreOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setMoreOpen(false)} />
          <div className={styles.sheet}>
            <div className={styles.sheetHandle} />
            <div className={styles.sheetTitle}>Ir a…</div>
            {moreSections.map((s) => (
              <div
                className={styles.item}
                key={s.href}
                onClick={() => {
                  setMoreOpen(false);
                  router.push(s.href);
                }}
              >
                <Icon icon={s.icon} size={20} />
                {s.title}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
});

NavBar.displayName = 'NavBar';

export default NavBar;

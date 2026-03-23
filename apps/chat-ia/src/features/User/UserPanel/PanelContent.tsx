import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import Menu from '@/components/Menu';
import { enableAuth, enableNextAuth } from '@/const/auth';
import { isDeprecatedEdition } from '@/const/version';
import { useWallet } from '@/hooks/useWallet';
import { useChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

import DataStatistics from '../DataStatistics';
import UserInfo from '../UserInfo';
import UserLoginOrSignup from '../UserLoginOrSignup';
import LangButton from './LangButton';
import ThemeButton from './ThemeButton';
import { useMenu } from './useMenu';

const PanelContent = memo<{ closePopover: () => void }>(({ closePopover }) => {
  const router = useRouter();
  const isLoginWithAuth = useUserStore(authSelectors.isLoginWithAuth);
  const [openSignIn, signOut] = useUserStore((s) => [s.openLogin, s.logout]);

  const handleSignIn = () => {
    openSignIn();
    closePopover();
  };

  const handleSignOut = () => {
    signOut();
    closePopover();
    // NextAuth doesn't need to redirect to login page
    if (enableNextAuth) return;
    router.push('/login');
  };

  // Obtener información del usuario para mostrar saludo
  const currentUserId = useChatStore((s) => s.currentUserId);
  const userProfile = useChatStore((s) => s.userProfile);
  const development = useChatStore((s) => s.development);
  const userType = useChatStore((s) => s.userType);
  const { isDomainGuest, mainItems, loginItems, logoutItems } = useMenu();
  const showLogoutRow = isLoginWithAuth && !isDomainGuest;

  const isRegistered =
    !isDomainGuest &&
    (userType === 'registered' ||
      Boolean(
        currentUserId &&
          currentUserId !== 'visitante@guest.local' &&
          (currentUserId.includes('@') || currentUserId.startsWith('+')),
      ));

  const userName = userProfile?.displayName ||
                   userProfile?.nombre ||
                   (currentUserId && currentUserId.includes('@') ? currentUserId.split('@')[0] : null);

  const { isNegativeBalance, isCreditExhausted, balance, bonusBalance, creditLimit, totalBalance } = useWallet();

  return (
    <Flexbox gap={2} style={{ minWidth: 300 }}>
      {!enableAuth || (enableAuth && isLoginWithAuth) ? (
        <>
          {isRegistered && userName ? (
            /* Saludo visible si está registrado */
            <Flexbox
              align={'center'}
              gap={8}
              horizontal
              paddingBlock={12}
              paddingInline={16}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                color: 'white',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>👋</span>
              <Flexbox flex={1} gap={2}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  ¡Hola, {userName}!
                </div>
                <div style={{ fontSize: 11, opacity: 0.9 }}>
                  {development ? `Bienvenido a ${development}` : 'Sesión iniciada'}
                </div>
              </Flexbox>
            </Flexbox>
          ) : (
            /* CTA de login para visitantes anónimos */
            <Link href="/login" style={{ color: 'inherit', display: 'block', marginBottom: 8 }}>
              <Flexbox
                align={'center'}
                gap={10}
                horizontal
                paddingBlock={12}
                paddingInline={16}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 20 }}>🔑</span>
                <Flexbox flex={1} gap={2}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Inicia sesión para más funciones</div>
                  <div style={{ fontSize: 11, opacity: 0.9 }}>Facturación, historial y configuración</div>
                </Flexbox>
              </Flexbox>
            </Link>
          )}

          <UserInfo avatarProps={{ clickable: false }} />
          {!isDeprecatedEdition && isRegistered && (
            <Link href={'/profile/stats'} style={{ color: 'inherit' }}>
              <DataStatistics />
            </Link>
          )}
          {isRegistered && (
            <Link href="/settings/billing" style={{ color: 'inherit', display: 'block' }}>
              <Flexbox
                align={'center'}
                horizontal
                justify={'space-between'}
                paddingBlock={8}
                paddingInline={16}
                style={{
                  background: isCreditExhausted ? 'rgba(255,77,79,0.08)' : isNegativeBalance ? 'rgba(255,165,0,0.08)' : 'rgba(0,0,0,0.03)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  marginBottom: 4,
                  marginInline: 8,
                }}
              >
                <Flexbox align={'center'} gap={6} horizontal>
                  <span style={{ fontSize: 14 }}>{isCreditExhausted ? '🚫' : isNegativeBalance ? '🟠' : '💰'}</span>
                  <Flexbox gap={0}>
                    <span style={{ color: 'var(--ant-color-text-secondary,#888)', fontSize: 12 }}>
                      {isNegativeBalance ? 'Deuda' : 'Saldo'}
                    </span>
                    {creditLimit > 0 && !isNegativeBalance && (
                      <span style={{ color: 'var(--ant-color-text-secondary,#aaa)', fontSize: 10 }}>
                        Crédito: €{creditLimit.toFixed(2)}
                      </span>
                    )}
                  </Flexbox>
                </Flexbox>
                <Flexbox align="flex-end" gap={0}>
                  <span style={{
                    color: isCreditExhausted ? '#ff4d4f' : isNegativeBalance ? '#f97316' : 'var(--ant-color-text,#333)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}>
                    {typeof balance === 'number'
                      ? `€${(balance + bonusBalance).toFixed(2)}`
                      : '—'}
                  </span>
                  {creditLimit > 0 && (
                    <span style={{ color: 'var(--ant-color-text-secondary,#aaa)', fontSize: 10 }}>
                      usa: €{totalBalance.toFixed(2)}
                    </span>
                  )}
                </Flexbox>
              </Flexbox>
            </Link>
          )}
        </>
      ) : (
        <UserLoginOrSignup onClick={handleSignIn} />
      )}

      <Menu items={mainItems} onClick={closePopover} />
      <Flexbox
        align={'center'}
        horizontal
        justify={'space-between'}
        style={showLogoutRow ? { paddingRight: 6 } : { padding: '6px 6px 6px 16px' }}
      >
        {showLogoutRow ? (
          <Menu items={logoutItems} onClick={handleSignOut} />
        ) : (
          <Menu items={loginItems} onClick={closePopover} />
        )}
        <Flexbox align={'center'} flex={'none'} gap={2} horizontal>
          <LangButton />
          <ThemeButton />
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
});

export default PanelContent;

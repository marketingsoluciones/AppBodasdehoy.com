import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import Menu from '@/components/Menu';
import { enableAuth, enableNextAuth } from '@/const/auth';
import { isDeprecatedEdition } from '@/const/version';
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
  const { mainItems, loginItems, logoutItems } = useMenu();

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
  const { currentUserId, userProfile, development } = useChatStore((s) => ({
    currentUserId: s.currentUserId,
    development: s.development,
    userProfile: s.userProfile,
  }));
  
  const isRegistered = currentUserId && 
    currentUserId !== 'visitante@guest.local' && 
    (currentUserId.includes('@') || currentUserId.startsWith('+'));
  
  const userName = userProfile?.displayName || 
                   userProfile?.nombre || 
                   (currentUserId && currentUserId.includes('@') ? currentUserId.split('@')[0] : null);

  return (
    <Flexbox gap={2} style={{ minWidth: 300 }}>
      {!enableAuth || (enableAuth && isLoginWithAuth) ? (
        <>
          {/* Saludo visible si está registrado */}
          {isRegistered && userName && (
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
          )}
          
          <UserInfo avatarProps={{ clickable: false }} />
          {!isDeprecatedEdition && isRegistered && (
            <Link href={'/profile/stats'} style={{ color: 'inherit' }}>
              <DataStatistics />
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
        style={isLoginWithAuth ? { paddingRight: 6 } : { padding: '6px 6px 6px 16px' }}
      >
        {isLoginWithAuth ? (
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

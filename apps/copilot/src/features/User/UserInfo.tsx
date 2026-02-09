'use client';

import { createStyles } from 'antd-style';
import { memo } from 'react';
import { Flexbox, FlexboxProps } from 'react-layout-kit';
import { Badge, Tag } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

import PlanTag from '@/features/User/PlanTag';
import { useUserStore } from '@/store/user';
import { useChatStore } from '@/store/chat';
import { authSelectors, userProfileSelectors } from '@/store/user/selectors';

import UserAvatar, { type UserAvatarProps } from './UserAvatar';

const useStyles = createStyles(({ css, token }) => ({
  nickname: css`
    font-size: 16px;
    font-weight: bold;
    line-height: 1;
  `,
  registeredBadge: css`
    display: inline-flex;
    gap: 4px;
    align-items: center;

    padding-block: 2px;
    padding-inline: 6px;
    border-radius: 4px;

    font-size: 11px;
    color: ${token.colorSuccess};

    background: ${token.colorSuccessBg};
  `,
  username: css`
    line-height: 1;
    color: ${token.colorTextDescription};
  `,
}));

export interface UserInfoProps extends FlexboxProps {
  avatarProps?: Partial<UserAvatarProps>;
  onClick?: () => void;
}

const UserInfo = memo<UserInfoProps>(({ avatarProps, onClick, ...rest }) => {
  const { styles, theme } = useStyles();
  const isSignedIn = useUserStore(authSelectors.isLogin);
  const [nickname, username, subscriptionPlan] = useUserStore((s) => [
    userProfileSelectors.nickName(s),
    userProfileSelectors.username(s),
    s.subscriptionPlan,
  ]);

  // ✅ CORRECCIÓN CRÍTICA: Obtener información del usuario desde externalChat store
  // ESTE es el store que tiene los datos reales del usuario registrado
  const { currentUserId, userProfile, userType, userRole } = useChatStore((s) => ({
    currentUserId: s.currentUserId,
    userProfile: s.userProfile,
    userRole: s.userRole,
    userType: s.userType,
  }));

  // ✅ DEBUG: Logging para ver qué datos tiene el componente
  if (typeof window !== 'undefined') {
    console.log('🔍 UserInfo render:', {
      currentUserId,
      fromChatStore: '✅',
      fromUserStore: { nickname, username },
      hasUserProfile: !!userProfile,
      nickname,
      userProfileEmail: userProfile?.email,
      userRole,
      userType,
      username
    });
  }

  // ✅ CORRECCIÓN: Usar userType del store si está disponible, sino usar lógica de fallback
  const isRegistered =
    userType === 'registered' ||
    Boolean(
      currentUserId &&
        currentUserId !== 'visitante@guest.local' &&
        (currentUserId.includes('@') || currentUserId.startsWith('+')),
    );

  // ✅ NUEVO: Verificar si la sesión está activa (JWT válido)
  const hasActiveSession = (() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('api2_jwt_token') || localStorage.getItem('jwt_token');
    if (!token) return false;
    
    const expiresAt = localStorage.getItem('api2_jwt_expires_at');
    if (expiresAt) {
      const expiration = new Date(expiresAt);
      return expiration > new Date();
    }
    return true; // Si no hay fecha de expiración, asumir válido
  })();

  // ✅ CORRECCIÓN CRÍTICA: Si currentUserId existe y es válido, IGNORAR completamente useUserStore
  // useUserStore tiene valores por defecto que no queremos mostrar
  const hasValidUserId = currentUserId && currentUserId !== 'visitante@guest.local';

  // Determinar displayName: SIEMPRE usar chatStore si hay currentUserId válido
  const displayName = hasValidUserId
    ? (userProfile?.displayName ||
       userProfile?.nombre ||
       (currentUserId.includes('@') ? currentUserId.split('@')[0] : currentUserId))
    : (nickname || username || 'Usuario de la comunidad');

  // Determinar email: SIEMPRE usar currentUserId si es válido
  const userEmail = hasValidUserId
    ? (userProfile?.email || (currentUserId.includes('@') ? currentUserId : currentUserId))
    : null;

  return (
    <Flexbox
      align={'center'}
      gap={12}
      horizontal
      justify={'space-between'}
      paddingBlock={12}
      paddingInline={12}
      {...rest}
    >
      <Flexbox align={'center'} gap={12} horizontal onClick={onClick}>
        <Badge
          color="#52c41a"
          dot={isRegistered}
          offset={[-2, 2]}
          title={isRegistered ? 'Usuario registrado' : 'Visitante'}
        >
          <UserAvatar background={theme.colorFill} size={48} {...avatarProps} />
        </Badge>
        <Flexbox flex={1} gap={6}>
          <Flexbox align={'center'} gap={6} horizontal>
            <div className={styles.nickname}>{displayName}</div>
            {isRegistered && (
              <Tag
                color={hasActiveSession ? "success" : "warning"}
                icon={<CheckCircleOutlined />}
                style={{ fontSize: '10px', margin: 0, padding: '0 4px' }}
                title={hasActiveSession ? 'Usuario registrado con sesión activa' : 'Usuario registrado - Sesión expirada'}
              >
                {hasActiveSession ? 'Registrado' : 'Sesión expirada'}
              </Tag>
            )}
          </Flexbox>
          <div className={styles.username}>
            {/* ✅ CORRECCIÓN CRÍTICA: SIEMPRE mostrar currentUserId si existe y es válido */}
            {currentUserId && currentUserId !== 'visitante@guest.local'
              ? currentUserId  // Mostrar email del usuario registrado
              : (userEmail || 'Visitante')}  {/* Solo usar userEmail como fallback, NO username de useUserStore */}
          </div>
        </Flexbox>
      </Flexbox>
      {isSignedIn && <PlanTag type={subscriptionPlan} />}
    </Flexbox>
  );
});

export default UserInfo;

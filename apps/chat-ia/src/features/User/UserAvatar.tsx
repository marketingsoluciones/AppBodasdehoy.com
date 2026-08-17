'use client';

import { Avatar, type AvatarProps } from '@lobehub/ui';
import { createStyles, useTheme } from 'antd-style';
import { forwardRef, useEffect, useMemo, useState } from 'react';

import { DEFAULT_USER_AVATAR_URL } from '@/const/meta';
import { isDesktop } from '@/const/version';
import { useDeveloperBranding } from '@/hooks/useDeveloperBranding';
import { useElectronStore } from '@/store/electron';
import { electronSyncSelectors } from '@/store/electron/selectors';
import { useChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';
import { authSelectors, userProfileSelectors } from '@/store/user/selectors';
import { getAvatarInitials, isGenericPlaceholderAvatarUrl } from '@/utils/avatarInitials';
import {
  getDeveloperDisplayName,
  resolveActiveDeveloperForBranding,
} from '@/utils/developmentDetector';

const useStyles = createStyles(({ css, token }) => ({
  clickable: css`
    position: relative;
    transition: all 200ms ease-out 0s;

    &::before {
      content: '';

      position: absolute;
      transform: skewX(-45deg) translateX(-400%);

      overflow: hidden;

      box-sizing: border-box;
      width: 25%;
      height: 100%;

      background: rgba(255, 255, 255, 50%);

      transition: all 200ms ease-out 0s;
    }

    &:hover {
      box-shadow: 0 0 0 2px ${token.colorPrimary};

      &::before {
        transform: skewX(-45deg) translateX(400%);
      }
    }
  `,
  hydrating: css`
    opacity: 0.55;
    animation: user-avatar-hydrating-pulse 1.4s ease-in-out infinite;
    @keyframes user-avatar-hydrating-pulse {
      0%, 100% { opacity: 0.35; }
      50% { opacity: 0.75; }
    }
  `,
}));

export interface UserAvatarProps extends AvatarProps {
  clickable?: boolean;
}

// BUG QA 13-jul #24: tras refresh (cmd+R) el avatar mostraba "BB" (initials de la
// marca) durante ~1-2s antes de pintar el avatar real "UC" — el store aún no había
// hidratado desde localStorage/cookie SSO pero el componente decidía "guest" y
// pintaba el placeholder. Si detectamos cookie SSO (.bodasdehoy.com) o JWT local,
// tratamos ese lapso como "sesión probable, aún hidratando" → skeleton pulsante
// en vez del placeholder de invitado. Ventana de gracia de 3s.
const AUTH_HYDRATION_GRACE_MS = 3000;

const hasSsoSessionSignal = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    if (
      typeof document !== 'undefined' &&
      document.cookie &&
      /(?:^|;\s*)idTokenV0\.1\.0=([^;]{20,})/.test(document.cookie)
    ) {
      return true;
    }
    const t = localStorage.getItem('jwt_token') || localStorage.getItem('mcp_jwt_token');
    if (t && t.length > 20) return true;
  } catch {
    /* ignore */
  }
  return false;
};

const UserAvatar = forwardRef<HTMLDivElement, UserAvatarProps>(
  (
    { size = 40, background, clickable, className, style, onClick, onError, ...rest },
    ref,
  ) => {
    const { styles, cx } = useStyles();
    const theme = useTheme();
    const [imageLoadFailed, setImageLoadFailed] = useState(false);
    const [avatar, username, nickName] = useUserStore((s) => [
      userProfileSelectors.userAvatar(s),
      userProfileSelectors.username(s),
      userProfileSelectors.nickName(s),
    ]);
    const storeDevelopment = useChatStore((s) => s.development);
    const { branding } = useDeveloperBranding();
    const slug = resolveActiveDeveloperForBranding(storeDevelopment);
    const guestBrandName =
      (branding?.name && branding.name.trim()) || getDeveloperDisplayName(slug);

    /** Sesión real (no el “siempre logueado” cuando enableAuth=false). */
    const isRealLogin = useUserStore(authSelectors.isLoginWithAuth);

    // Gracia de hidratación: si hay SSO cookie/JWT local y aún no llegó el store,
    // marcamos "hidratando" durante AUTH_HYDRATION_GRACE_MS.
    const [ssoSignal, setSsoSignal] = useState(false);
    const [graceElapsed, setGraceElapsed] = useState(false);
    // P0 coherencia de sesión (QA 17-ago): el servidor renderiza este componente SIN
    // sesión cliente → antes pintaba "Visitante · marca" en el HTML SSR, que el Service
    // Worker cacheaba (NetworkFirst) y servía en navegación DIRECTA (Ctrl+Shift+R lo
    // bypaseaba y por eso "se arreglaba"). En SSR + primer render cliente (mounted=false)
    // NO decidimos invitado: mostramos el skeleton neutro. SSR y primer render coinciden
    // (ambos skeleton) → 0 hydration mismatch. Tras montar resolvemos identidad real.
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      setMounted(true);
      setSsoSignal(hasSsoSessionSignal());
      const t = setTimeout(() => setGraceElapsed(true), AUTH_HYDRATION_GRACE_MS);
      return () => clearTimeout(t);
    }, []);
    const hydrating = !mounted || (ssoSignal && !isRealLogin && !graceElapsed);
    const remoteServerUrl = useElectronStore(electronSyncSelectors.remoteServerUrl);

    const avatarUrl = useMemo(() => {
      if (isRealLogin && avatar) {
        if (isDesktop && avatar.startsWith('/') && remoteServerUrl) {
          return remoteServerUrl + avatar;
        }
        return avatar;
      }
      if (isRealLogin && !avatar) {
        return DEFAULT_USER_AVATAR_URL;
      }
      const fromApi = branding?.logo?.trim();
      return fromApi || DEFAULT_USER_AVATAR_URL;
    }, [isRealLogin, avatar, remoteServerUrl, branding?.logo]);

    useEffect(() => {
      setImageLoadFailed(false);
    }, [avatarUrl]);

    const altText =
      isRealLogin && username
        ? username
        : `Visitante · ${guestBrandName}`;

    const labelForInitials = (
      isRealLogin ? (nickName || username || '').trim() : ''
    ) || guestBrandName;

    const initials = useMemo(
      () => getAvatarInitials(labelForInitials),
      [labelForInitials],
    );

    const useGradientFallback =
      imageLoadFailed ||
      isGenericPlaceholderAvatarUrl(avatarUrl, DEFAULT_USER_AVATAR_URL);

    const handleAvatarImageError = () => {
      setImageLoadFailed(true);
      onError?.();
      return false;
    };

    const primary = branding?.color_primary || theme.colorPrimary;
    const secondary =
      branding?.color_secondary ||
      (typeof theme.colorInfo === 'string' ? theme.colorInfo : undefined) ||
      '#764ba2';

    if (hydrating) {
      return (
        <div
          aria-hidden="true"
          className={cx(className, styles.hydrating)}
          data-testid="user-avatar-hydrating"
          ref={ref}
          style={{
            background: theme.colorFillTertiary,
            borderRadius: '50%',
            flex: 'none',
            height: size,
            width: size,
            ...style,
          }}
        />
      );
    }

    if (useGradientFallback) {
      return (
        <div
          aria-label={altText}
          className={cx(clickable && styles.clickable, className)}
          data-testid="user-avatar"
          onClick={onClick}
          ref={ref}
          role="img"
          style={{
            alignItems: 'center',
            background: `linear-gradient(145deg, ${primary} 0%, ${secondary} 100%)`,
            borderRadius: '50%',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
            color: '#fff',
            cursor: onClick ? 'pointer' : undefined,
            display: 'flex',
            flex: 'none',
            fontSize: Math.max(12, Math.round(Number(size) * 0.36)),
            fontWeight: 600,
            height: size,
            justifyContent: 'center',
            letterSpacing: '-0.03em',
            lineHeight: 1,
            userSelect: 'none',
            width: size,
            ...style,
          }}
        >
          {initials}
        </div>
      );
    }

    return (
      <Avatar
        alt={altText}
        avatar={avatarUrl}
        background={isRealLogin && avatar ? background : 'transparent'}
        className={cx(clickable && styles.clickable, className)}
        data-testid="user-avatar"
        onClick={onClick}
        onError={handleAvatarImageError}
        ref={ref}
        size={size}
        style={{ flex: 'none', ...style }}
        unoptimized
        {...rest}
      />
    );
  },
);

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;

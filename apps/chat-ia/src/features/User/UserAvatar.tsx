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
  getDeveloperShortName,
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
}));

export interface UserAvatarProps extends AvatarProps {
  clickable?: boolean;
}

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
      (branding?.name && branding.name.trim()) || getDeveloperShortName(slug);

    /** Sesión real (no el “siempre logueado” cuando enableAuth=false). */
    const isRealLogin = useUserStore(authSelectors.isLoginWithAuth);
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

    if (useGradientFallback) {
      return (
        <div
          aria-label={altText}
          className={cx(clickable && styles.clickable, className)}
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

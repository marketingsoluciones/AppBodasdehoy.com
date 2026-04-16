import { act, fireEvent, render, screen } from '@testing-library/react';
import { forwardRef, type ImgHTMLAttributes } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';

import UserAvatar from '../UserAvatar';

/** El Avatar del design system puede no enlazar `onError` al <img>; el mock sí (tests de fallback). */
vi.mock('@lobehub/ui', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@lobehub/ui')>();
  type Props = ImgHTMLAttributes<HTMLImageElement> & { avatar?: string };
  const ImgAvatar = forwardRef<HTMLImageElement, Props>(({ alt, avatar, onError, src }, ref) => (
    // Mock de tests: <img> nativo para enlazar onError.
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} onError={onError} ref={ref} src={(avatar ?? src) as string} />
  ));
  ImgAvatar.displayName = 'ImgAvatar';
  return { ...mod, Avatar: ImgAvatar };
});

vi.mock('zustand/traditional');

vi.mock('@/hooks/useDeveloperBranding', () => ({
  useDeveloperBranding: () => ({ branding: null, error: null, loading: false, refetch: async () => {} }),
}));

// 定义一个变量来存储 enableAuth 的值
let enableAuth = true;

// 模拟 @/const/auth 模块
vi.mock('@/const/auth', () => ({
  get enableAuth() {
    return enableAuth;
  },
}));

afterEach(() => {
  enableAuth = true;
});

describe('UserAvatar', () => {
  describe('enable Auth', () => {
    it('should show the username and avatar are displayed when the user is logged in', async () => {
      const mockAvatar = 'https://example.com/avatar.png';
      const mockUsername = 'teeeeeestuser';

      act(() => {
        useUserStore.setState({
          enableAuth: () => true,
          isSignedIn: true,
          user: { avatar: mockAvatar, id: 'abc', username: mockUsername },
        });
      });

      render(<UserAvatar />);

      expect(screen.getByAltText(mockUsername)).toBeInTheDocument();
      expect(screen.getByAltText(mockUsername)).toHaveAttribute('src', mockAvatar);
    });

    it('should show initials when remote user avatar fails to load (onError)', () => {
      const mockAvatar = 'https://example.com/avatar.png';

      act(() => {
        useUserStore.setState({
          enableAuth: () => true,
          isSignedIn: true,
          user: { avatar: mockAvatar, id: 'abc', username: 'juan' },
        });
      });

      render(<UserAvatar />);

      fireEvent.error(screen.getByAltText('juan'));

      expect(screen.getByRole('img', { name: 'juan' })).toBeInTheDocument();
      expect(screen.getByText('JU')).toBeInTheDocument();
    });

    it('should show initials avatar when the user is logged in but have no custom avatar', () => {
      const mockUsername = 'testuser';

      act(() => {
        useUserStore.setState({
          enableAuth: () => true,
          isSignedIn: true,
          user: { id: 'bbb', username: mockUsername },
        });
      });

      render(<UserAvatar />);
      const img = screen.getByRole('img', { name: 'testuser' });
      expect(img).toBeInTheDocument();
      expect(screen.getByText('TE')).toBeInTheDocument();
    });

    it('should show Visitante·marca and initials when the user is not logged in and enable auth', () => {
      act(() => {
        useUserStore.setState({ enableAuth: () => true, isSignedIn: false, user: undefined });
        useChatStore.setState({ development: 'bodasdehoy' });
      });

      render(<UserAvatar />);
      expect(
        screen.getByRole('img', { name: 'Visitante · Bodas de Hoy' }),
      ).toBeInTheDocument();
      expect(screen.getByText('BH')).toBeInTheDocument();
    });
  });

  describe('disable Auth', () => {
    it('should show Visitante·marca and initials when the user is not logged in and disabled auth', () => {
      enableAuth = false;
      act(() => {
        useUserStore.setState({ enableAuth: () => false, isSignedIn: false, user: undefined });
        useChatStore.setState({ development: 'bodasdehoy' });
      });

      render(<UserAvatar />);
      expect(
        screen.getByRole('img', { name: 'Visitante · Bodas de Hoy' }),
      ).toBeInTheDocument();
      expect(screen.getByText('BH')).toBeInTheDocument();
    });
  });
});

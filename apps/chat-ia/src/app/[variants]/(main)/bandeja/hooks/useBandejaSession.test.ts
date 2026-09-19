import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({
  auth: { isAuthenticated: false, hasValidJwt: false, userId: null as string | null, development: 'qa' },
  init: vi.fn(), destroy: vi.fn(),
}));
vi.mock('@/hooks/useAuthCheck', () => {
  const checkAuth = () => m.auth;
  return { useAuthCheck: () => ({ checkAuth }) };
});
vi.mock('@/store/bandeja', () => ({ useBandejaStore: (selector: any) => selector({ initBandeja: m.init, destroyBandeja: m.destroy }) }));
vi.mock('../utils/auth', () => ({ buildHeaders: () => ({}) }));
import { useBandejaSession } from './useBandejaSession';

beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  m.auth = { isAuthenticated: false, hasValidJwt: false, userId: null, development: 'qa' };
});
afterEach(() => { vi.useRealTimers(); });
describe('late authentication lifecycle', () => {
  it('starts after same-tab token hydration without repeatedly restarting', async () => {
    const hook = renderHook(() => useBandejaSession());
    expect(m.init).not.toHaveBeenCalled();
    m.auth = { ...m.auth, isAuthenticated: true, hasValidJwt: true, userId: 'user-a' };
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(m.init).toHaveBeenCalledTimes(1);
    expect(m.init).toHaveBeenCalledWith('qa', expect.any(Function));
    hook.unmount();
  });
  it('clears the old identity on a user switch and stops after logout', async () => {
    m.auth = { ...m.auth, isAuthenticated: true, hasValidJwt: true, userId: 'user-a' };
    const hook = renderHook(() => useBandejaSession());
    m.auth = { ...m.auth, userId: 'user-b' };
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(m.init).toHaveBeenCalledTimes(2);
    m.auth = { ...m.auth, hasValidJwt: false };
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(m.destroy).toHaveBeenCalledTimes(3);
    hook.unmount();
    const calls = m.init.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(m.init).toHaveBeenCalledTimes(calls);
  });
});

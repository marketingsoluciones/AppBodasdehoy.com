import { describe, expect, it } from 'vitest';

import { externalChatSelectors } from './selectors';

const base = (over: any = {}) => ({
  currentUserId: undefined,
  userProfile: undefined,
  userRole: undefined,
  userType: undefined,
  ...over,
}) as any;

describe('isDomainGuestUser', () => {
  it('sin identidad (currentUserId undefined) → GUEST (true) [fix login fantasma]', () => {
    expect(externalChatSelectors.isDomainGuestUser(base())).toBe(true);
  });
  it('visitante@guest.local → guest', () => {
    expect(externalChatSelectors.isDomainGuestUser(base({ currentUserId: 'visitante@guest.local' }))).toBe(true);
  });
  it('userType guest → guest', () => {
    expect(externalChatSelectors.isDomainGuestUser(base({ currentUserId: 'x', userType: 'guest' }))).toBe(true);
  });
  it('usuario registrado real → NO guest', () => {
    expect(externalChatSelectors.isDomainGuestUser(base({
      currentUserId: 'real@bodasdehoy.com', userType: 'registered',
      userProfile: { email: 'real@bodasdehoy.com' },
    }))).toBe(false);
  });
});

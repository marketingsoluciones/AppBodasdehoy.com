import type { Event } from '../Interfaces';
import { normalizeEventShareForUser } from '../normalizeSharedEvent';

describe('normalizeEventShareForUser', () => {
  it('does not crash when legacy share details are missing', () => {
    const event = {
      _id: 'legacy-event',
      compartido_array: ['other-user', 'current-user'],
      detalles_compartidos_array: [{ permissions: ['read'] }],
    } as unknown as Event;

    const normalized = normalizeEventShareForUser(event, 'current-user');

    expect(normalized.permissions).toEqual([]);
    expect(normalized.compartido_array).toEqual(['other-user']);
    expect(normalized.detalles_compartidos_array).toEqual([{ permissions: ['read'] }]);
    expect(event.compartido_array).toEqual(['other-user', 'current-user']);
  });

  it('keeps aligned permissions for the current shared user', () => {
    const event = {
      _id: 'aligned-event',
      compartido_array: ['other-user', 'current-user'],
      detalles_compartidos_array: [
        { permissions: ['read'] },
        { permissions: ['read', 'write'] },
      ],
    } as unknown as Event;

    const normalized = normalizeEventShareForUser(event, 'current-user');

    expect(normalized.permissions).toEqual(['read', 'write']);
    expect(normalized.compartido_array).toEqual(['other-user']);
    expect(normalized.detalles_compartidos_array).toEqual([{ permissions: ['read'] }]);
  });
});

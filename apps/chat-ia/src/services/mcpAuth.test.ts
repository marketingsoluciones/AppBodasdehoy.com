/**
 * mcpAuth.test.ts — contrato del helper callMcpAuthMutation.
 *
 * Antes de este refactor, la llamada estaba duplicada en 2 sitios
 * (services/firebase-auth/index.ts + app/(backend)/api/auth/sso-auto/route.ts).
 * Estos tests garantizan que el contrato no drifta.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { callMcpAuthMutation } from './mcpAuth';
import { lastChatIaGraphqlError } from './lastGraphqlError';

const originalFetch = global.fetch;

describe('callMcpAuthMutation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('devuelve sessionCookie cuando backend responde OK', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: { auth: { sessionCookie: 'jwt.header.payload.sig' } },
        }),
    }) as any;

    const result = await callMcpAuthMutation('firebase-token-abc', 'bodasdehoy');
    expect(result.sessionCookie).toBe('jwt.header.payload.sig');
    expect(result.errorMessage).toBeUndefined();
    expect(result.traceId).toBeUndefined();
  });

  it('captura errorMessage + traceId cuando backend responde con errors[]', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          data: { auth: null },
          errors: [
            {
              message: 'Timeout (3000ms) en Mongo save user',
              extensions: { traceId: 'abc-123-def' },
            },
          ],
        }),
    }) as any;

    const result = await callMcpAuthMutation('firebase-token-abc', 'bodasdehoy');
    expect(result.sessionCookie).toBeNull();
    expect(result.errorMessage).toBe('Timeout (3000ms) en Mongo save user');
    expect(result.traceId).toBe('abc-123-def');
    // Registrado en lastChatIaGraphqlError para DebugFooter
    expect(lastChatIaGraphqlError?.traceId).toBe('abc-123-def');
    expect(lastChatIaGraphqlError?.source).toBe('mcpAuth.mutation Auth');
  });

  it('devuelve sessionCookie null cuando backend responde vacío', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: null }),
    }) as any;

    const result = await callMcpAuthMutation('token', 'bodasdehoy');
    expect(result.sessionCookie).toBeNull();
    expect(result.errorMessage).toBe('sin sessionCookie');
  });

  it('respeta la opción graphqlUrl si se pasa', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({ data: { auth: { sessionCookie: 'ok' } } }),
    });
    global.fetch = fetchSpy as any;

    await callMcpAuthMutation('token', 'bodasdehoy', {
      graphqlUrl: 'https://custom-endpoint.local/graphql',
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://custom-endpoint.local/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Development: 'bodasdehoy' }),
      }),
    );
  });

  it('envía el idToken como variable de la mutation', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: { auth: { sessionCookie: 'x' } } }),
    });
    global.fetch = fetchSpy as any;

    await callMcpAuthMutation('the-firebase-id-token', 'bodasdehoy');

    const [, opts] = fetchSpy.mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.query).toContain('mutation Auth');
    expect(body.variables).toEqual({ idToken: 'the-firebase-id-token' });
  });
});

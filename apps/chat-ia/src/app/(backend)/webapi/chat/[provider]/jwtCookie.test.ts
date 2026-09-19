import { describe, expect, it } from 'vitest';

import { resolveChatProxyJwt } from './jwtCookie';

const canonicalJwt = 'eyJcanonical.payload.signature';
const legacyJwt = 'eyJlegacy.payload.signature';

describe('resolveChatProxyJwt', () => {
  it('prefiere api2_jwt, que es la cookie creada por el login actual', () => {
    expect(resolveChatProxyJwt(`mcp_jwt=${legacyJwt}; api2_jwt=${canonicalJwt}`)).toBe(canonicalJwt);
  });

  it('mantiene compatibilidad con mcp_jwt', () => {
    expect(resolveChatProxyJwt(`theme=dark; mcp_jwt=${legacyJwt}`)).toBe(legacyJwt);
  });

  it('usa dev-user-config como último fallback', () => {
    const config = encodeURIComponent(JSON.stringify({ token: canonicalJwt }));
    expect(resolveChatProxyJwt(`dev-user-config=${config}`)).toBe(canonicalJwt);
  });

  it('rechaza valores que no tengan forma de JWT', () => {
    expect(resolveChatProxyJwt('api2_jwt=plain-token; mcp_jwt=also-plain')).toBeUndefined();
  });

  it('no confunde nombres de cookies que solo contienen api2_jwt', () => {
    expect(resolveChatProxyJwt(`fake_api2_jwt=${canonicalJwt}`)).toBeUndefined();
  });
});

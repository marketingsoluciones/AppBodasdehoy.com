const readCookie = (cookieHeader: string, name: string): string | undefined => {
  const prefix = `${name}=`;
  const cookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return cookie?.slice(prefix.length);
};

const decodeJwtCookie = (value?: string): string | undefined => {
  if (!value) return undefined;
  try {
    const decoded = decodeURIComponent(value);
    return decoded.startsWith('eyJ') ? decoded : undefined;
  } catch {
    return undefined;
  }
};

/** Resuelve el JWT verificado por api-ia sin usar el Firebase ID token de SSO. */
export const resolveChatProxyJwt = (cookieHeader: string): string | undefined => {
  for (const name of ['api2_jwt', 'mcp_jwt']) {
    const jwt = decodeJwtCookie(readCookie(cookieHeader, name));
    if (jwt) return jwt;
  }

  const rawConfig = readCookie(cookieHeader, 'dev-user-config');
  if (!rawConfig) return undefined;

  try {
    const config = JSON.parse(decodeURIComponent(rawConfig));
    return typeof config.token === 'string' && config.token.startsWith('eyJ')
      ? config.token
      : undefined;
  } catch {
    return undefined;
  }
};

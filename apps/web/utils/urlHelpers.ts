/**
 * Utilidades para manejo de URLs y query params
 * Compatibilidad con migración Next.js 12 → 15
 */

/**
 * Construye una URL con query params
 * @param path - Ruta base (ej: "/login")
 * @param params - Objeto con los query params
 * @returns URL completa con query string
 *
 * @example
 * buildUrl("/login", { d: "/eventos", q: "register" })
 * // Returns: "/login?d=/eventos&q=register"
 */
export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return path;

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/**
 * Extrae query params de una URL
 * @param url - URL completa o solo query string
 * @returns Objeto con los query params
 *
 * @example
 * parseQueryParams("?event=123&itinerary=456")
 * // Returns: { event: "123", itinerary: "456" }
 */
export function parseQueryParams(url: string): Record<string, string> {
  const queryString = url.includes("?") ? url.split("?")[1] : url;
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

/**
 * Actualiza query params en la URL actual sin recargar
 * Solo para uso en cliente
 * @param updates - Params a actualizar (null para eliminar)
 */
export function updateQueryParams(
  updates: Record<string, string | null>,
  options?: { replace?: boolean }
): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  const method = options?.replace ? "replaceState" : "pushState";
  window.history[method]({}, "", url.toString());
}

/**
 * Elimina query params específicos de la URL actual
 * @param keys - Array de keys a eliminar
 */
export function removeQueryParams(keys: string[]): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  keys.forEach((key) => url.searchParams.delete(key));
  window.history.replaceState({}, "", url.toString());
}

/**
 * Obtiene un query param de la URL actual
 * Solo para uso en cliente (fuera de componentes React)
 * @param key - Nombre del param
 * @returns Valor del param o null
 */
export function getQueryParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

/**
 * Verifica si un query param existe en la URL actual
 * @param key - Nombre del param
 */
export function hasQueryParam(key: string): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has(key);
}

/**
 * Limpia la URL removiendo todos los query params
 * Útil después de procesar tokens de acceso
 */
export function clearQueryParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.search = "";
  window.history.replaceState({}, "", url.toString());
}

/**
 * Extrae parámetros de un slug dinámico
 * Usado para rutas como /public-card/[...slug]
 *
 * @example
 * parseSlugParams("prefix-eventId-itineraryId-taskId", "-")
 * // Returns: ["prefix", "eventId", "itineraryId", "taskId"]
 */
export function parseSlugParams(slug: string, separator: string = "-"): string[] {
  return slug.split(separator);
}

/**
 * Construye un slug para rutas dinámicas
 *
 * @example
 * buildSlug(["prefix", "eventId", "itineraryId"], "-")
 * // Returns: "prefix-eventId-itineraryId"
 */
export function buildSlug(parts: (string | undefined)[], separator: string = "-"): string {
  return parts.filter(Boolean).join(separator);
}

/**
 * Lista de prefijos de subdominio que se consideran entornos de test
 * Incluye: test., chat-test., dev., staging., etc.
 */
const TEST_SUBDOMAIN_PATTERNS = [
  '://test.',
  '://chat-test.',
  '://app-test.',
  '://dev.',
  '://staging.',
  '://local.',
];

/**
 * Verifica si la URL actual está en un subdominio de test
 * Reconoce: test., chat-test., dev., staging., etc.
 *
 * @returns true si estamos en un subdominio de test
 *
 * @example
 * // En https://chat-test.bodasdehoy.com
 * isTestSubdomain() // Returns: true
 *
 * // En https://bodasdehoy.com
 * isTestSubdomain() // Returns: false
 */
export function isTestSubdomain(): boolean {
  if (typeof window === "undefined") return false;
  return TEST_SUBDOMAIN_PATTERNS.some(pattern => window.origin.includes(pattern));
}

/**
 * Obtiene el prefijo del subdominio de test actual
 *
 * @returns El prefijo (ej: "test", "chat-test") o null si no es test
 */
export function getTestSubdomainPrefix(): string | null {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;
  const parts = hostname.split('.');

  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (['test', 'chat-test', 'app-test', 'dev', 'staging', 'local'].includes(subdomain)) {
      return subdomain;
    }
  }

  return null;
}

/**
 * Adapta una URL de producción para funcionar en el entorno de test actual
 *
 * @param prodUrl - URL de producción (ej: "https://organizador.bodasdehoy.com")
 * @returns URL adaptada para el entorno actual
 *
 * @example
 * // En https://chat-test.bodasdehoy.com:
 * adaptUrlForTestEnv("https://organizador.bodasdehoy.com")
 * // Returns: "https://chat-test.bodasdehoy.com"
 *
 * // En producción:
 * adaptUrlForTestEnv("https://organizador.bodasdehoy.com")
 * // Returns: "https://organizador.bodasdehoy.com"
 */
export function adaptUrlForTestEnv(prodUrl: string): string {
  if (typeof window === "undefined") return prodUrl;

  // Si estamos en test, usar el origin actual
  if (isTestSubdomain()) {
    return window.origin;
  }

  return prodUrl;
}

/**
 * Normaliza la URL de redirección después del login para no enviar al usuario a otro subdominio.
 * En app-test/chat-test, si d= apunta a otro origen (ej. chat-test desde app-test), falla por subdominio;
 * por eso nos quedamos en el mismo origen.
 *
 * @param redirectPath - Valor del param d (puede ser "/", "/app", o una URL absoluta)
 * @returns Ruta segura: mismo origen o path relativo, nunca otro subdominio
 */
export function normalizeRedirectAfterLogin(redirectPath: string): string {
  if (typeof window === "undefined") return redirectPath || "/";
  const trimmed = (redirectPath || "/").trim();
  if (!trimmed || trimmed === "/") return "/";

  try {
    const currentOrigin = window.location.origin;
    const isTest = isTestSubdomain();

    if (isTest && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
      const target = new URL(trimmed);
      if (target.origin !== currentOrigin) {
        console.warn("[Auth] Redirect a otro subdominio ignorado para evitar fallo (origen actual:", currentOrigin, ", destino:", target.origin, ")");
        return "/";
      }
      return target.pathname + target.search || "/";
    }
  } catch {
    // Si no es URL válida, tratar como path
  }

  return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
}

/**
 * Adapta una URL de producción manteniendo el mismo prefijo de subdominio
 * Útil cuando necesitas ir a otro servicio pero mantener el entorno
 *
 * @param prodUrl - URL de producción
 * @param preserveSubdomain - Si true, intenta poner el prefijo test en la URL destino
 * @returns URL adaptada
 *
 * @example
 * // En https://chat-test.bodasdehoy.com:
 * adaptServiceUrl("https://organizador.bodasdehoy.com", true)
 * // Returns: "https://test.organizador.bodasdehoy.com"
 */
export function adaptServiceUrl(prodUrl: string, preserveSubdomain: boolean = false): string {
  if (typeof window === "undefined") return prodUrl;

  if (!isTestSubdomain()) {
    return prodUrl;
  }

  if (!preserveSubdomain) {
    // Mantener en el mismo origen
    return window.origin;
  }

  // Intentar adaptar la URL destino con prefijo test
  try {
    const url = new URL(prodUrl);
    const prefix = getTestSubdomainPrefix();

    if (prefix) {
      // Insertar "test" antes del hostname (ej: organizador.bodasdehoy.com -> test.organizador.bodasdehoy.com)
      url.hostname = `test.${url.hostname}`;
    }

    return url.toString();
  } catch {
    return prodUrl;
  }
}

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

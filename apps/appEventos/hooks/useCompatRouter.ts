/**
 * IMPORTANTE: Este archivo sirve como POLYFILL para next/navigation en Pages Router
 * El webpack alias redirige 'next/navigation' a este archivo
 *
 * Proporciona hooks compatibles usando next/router internamente
 */

import { useRouter as useNextRouter } from "next/router";
import { useCallback, useMemo } from "react";

export interface CompatRouterQuery {
  [key: string]: string | string[] | undefined;
}

/**
 * useRouter - Polyfill para next/navigation en Pages Router
 * Proporciona una API similar a la de App Router usando next/router
 */
export function useRouter() {
  const router = useNextRouter();

  const push = useCallback(
    (url: string, options?: { scroll?: boolean }) => {
      if (router?.push) {
        router.push(url, undefined, options);
      }
    },
    [router]
  );

  const replace = useCallback(
    (url: string, options?: { scroll?: boolean }) => {
      if (router?.replace) {
        router.replace(url, undefined, options);
      }
    },
    [router]
  );

  const back = useCallback(() => {
    if (router?.back) {
      router.back();
    }
  }, [router]);

  const forward = useCallback(() => {
    if (router?.forward) {
      router.forward();
    }
  }, [router]);

  const refresh = useCallback(() => {
    if (router?.reload) {
      router.reload();
    }
  }, [router]);

  const prefetch = useCallback(
    (url: string) => {
      if (router?.prefetch) {
        router.prefetch(url);
      }
    },
    [router]
  );

  return {
    push,
    replace,
    back,
    forward,
    refresh,
    prefetch,
  };
}

/**
 * usePathname - Polyfill para next/navigation en Pages Router
 * Retorna el pathname actual
 */
export function usePathname(): string {
  const router = useNextRouter();
  return router?.pathname || '/';
}

/**
 * useSearchParams - Polyfill para next/navigation en Pages Router
 * Retorna un objeto similar a ReadonlyURLSearchParams
 */
export function useSearchParams(): any {
  const router = useNextRouter();

  return useMemo(() => {
    const params = new URLSearchParams();

    // Guard: verificar que router y router.query existan
    if (router && router.query && typeof router.query === 'object') {
      try {
        Object.entries(router.query).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(v => {
              if (v !== undefined && v !== null) {
                params.append(key, String(v));
              }
            });
          } else if (value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        });
      } catch (error) {
        console.warn('[useSearchParams] Error procesando query params:', error);
      }
    }

    // Retornar el URLSearchParams directamente
    // Next.js lo acepta aunque espere ReadonlyURLSearchParams
    return params;
  }, [router, router?.query]);
}

/**
 * useParams - Polyfill para next/navigation en Pages Router
 * Retorna los parámetros dinámicos de la ruta
 */
export function useParams(): { [key: string]: string | string[] } {
  const router = useNextRouter();

  // Guard: verificar que router.query exista y sea un objeto
  if (!router || !router.query || typeof router.query !== 'object') {
    return {};
  }

  return router.query;
}

/**
 * Hook de compatibilidad completo (para uso directo)
 * Combina router, pathname y searchParams
 */
export function useCompatRouter() {
  const routerInstance = useNextRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Simula router.query del Pages Router
  const query = useMemo<CompatRouterQuery>(() => {
    const params: CompatRouterQuery = {};
    searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing) {
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          params[key] = [existing, value];
        }
      } else {
        params[key] = value;
      }
    });
    return params;
  }, [searchParams]);

  const getParam = useCallback(
    (key: string): string | null => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  const getParamAll = useCallback(
    (key: string): string[] => {
      return searchParams.getAll(key);
    },
    [searchParams]
  );

  const push = useCallback(
    (url: string, options?: { scroll?: boolean }) => {
      routerInstance.push(url, undefined, options);
    },
    [routerInstance]
  );

  const pushWithQuery = useCallback(
    (path: string, queryParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, value);
        }
      });
      const queryString = params.toString();
      routerInstance.push(queryString ? `${path}?${queryString}` : path);
    },
    [routerInstance]
  );

  const replace = useCallback(
    (url: string, options?: { scroll?: boolean }) => {
      routerInstance.replace(url, undefined, options);
    },
    [routerInstance]
  );

  const back = useCallback(() => {
    routerInstance.back();
  }, [routerInstance]);

  const refresh = useCallback(() => {
    routerInstance.reload();
  }, [routerInstance]);

  return {
    // Métodos de navegación
    push,
    pushWithQuery,
    replace,
    back,
    refresh,

    // Estado de la ruta
    pathname,
    query,
    searchParams,

    // Helpers para query params
    getParam,
    getParamAll,

    // Acceso directo al router de Next.js (Pages Router)
    router: routerInstance,
  };
}

/**
 * Hook simplificado solo para leer query params
 */
export function useQueryParams() {
  const searchParams = useSearchParams();

  const get = useCallback(
    (key: string): string | null => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  const getAll = useCallback(
    (key: string): string[] => {
      return searchParams.getAll(key);
    },
    [searchParams]
  );

  const has = useCallback(
    (key: string): boolean => {
      return searchParams.has(key);
    },
    [searchParams]
  );

  const toObject = useMemo((): Record<string, string> => {
    const obj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }, [searchParams]);

  return {
    get,
    getAll,
    has,
    toObject,
    searchParams,
  };
}

// Export por defecto para el alias de webpack
export default {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  useCompatRouter,
  useQueryParams,
};

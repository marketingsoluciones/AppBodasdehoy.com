"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/**
 * Hook de compatibilidad para migración de next/router a next/navigation
 * Simula la API del Pages Router para facilitar la transición al App Router
 *
 * Uso:
 * - Reemplaza: import { useRouter } from "next/router"
 * - Por: import { useCompatRouter } from "@/hooks/useCompatRouter"
 *
 * Cambios de API:
 * - router.query.param → getParam("param") o query.param
 * - router.pathname → pathname
 * - router.push() → push() (compatible)
 * - router.replace() → replace() (compatible)
 */

export interface CompatRouterQuery {
  [key: string]: string | string[] | undefined;
}

export function useCompatRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Simula router.query del Pages Router
  // Convierte URLSearchParams a objeto plano como lo hacía el Pages Router
  const query = useMemo<CompatRouterQuery>(() => {
    const params: CompatRouterQuery = {};
    searchParams.forEach((value, key) => {
      const existing = params[key];
      if (existing) {
        // Si ya existe, convertir a array (comportamiento del Pages Router)
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

  // Helper para obtener un query param específico
  const getParam = useCallback(
    (key: string): string | null => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  // Helper para obtener todos los valores de un param (para arrays)
  const getParamAll = useCallback(
    (key: string): string[] => {
      return searchParams.getAll(key);
    },
    [searchParams]
  );

  // Push con query params - mantiene compatibilidad con el patrón existente
  const push = useCallback(
    (url: string, options?: { scroll?: boolean }) => {
      router.push(url, options);
    },
    [router]
  );

  // Push construyendo URL con query params
  const pushWithQuery = useCallback(
    (path: string, queryParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, value);
        }
      });
      const queryString = params.toString();
      router.push(queryString ? `${path}?${queryString}` : path);
    },
    [router]
  );

  // Replace con query params
  const replace = useCallback(
    (url: string, options?: { scroll?: boolean }) => {
      router.replace(url, options);
    },
    [router]
  );

  // Navegar atrás
  const back = useCallback(() => {
    router.back();
  }, [router]);

  // Refrescar la página (equivalente a router.reload en Pages Router)
  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

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

    // Acceso directo al router de Next.js 15
    router,
  };
}

/**
 * Hook simplificado solo para leer query params
 * Útil para componentes que solo necesitan leer, no navegar
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

  // Convertir a objeto plano
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

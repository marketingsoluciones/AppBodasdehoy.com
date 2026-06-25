import { useEffect, useState } from "react";
import { GlobalCurrency } from "../context/EventContext"
import { Event } from "../utils/Interfaces"

/**
 * Devuelve el array recibido o un array vacío si no es array.
 * Pensado para Cells de react-table donde data.value puede llegar como null
 * (campo ausente en BD) y los accesos a .length / .map / .find tiran toda
 * la página por TypeError. EVT-01 (informe 20-jun) viene de no usar esto.
 *
 * Uso:
 *   const arr = safeArr(data.value)
 *   return <div>{arr.length}</div>
 */
export function safeArr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

/**
 * BUG-10 cache offline (informe QA 21-jun): wrapper de localStorage con TTL.
 *
 * Uso:
 *   // Leer (devuelve null si no hay o expiró):
 *   const cached = readCache<MyType>('events_bodasdehoy', 24 * 60 * 60 * 1000)
 *
 *   // Escribir:
 *   writeCache('events_bodasdehoy', miArray)
 *
 *   // Helper de fetch con stale-while-revalidate:
 *   const data = await cachedFetch('events', () => fetchApiBodas(...), 5 * 60 * 1000)
 *
 * TTL típico:
 *   · Eventos: 5 min (cambian poco)
 *   · Tareas/Servicios: 30s (cambian más, realtime via socket)
 *   · Catálogos (developments, regiones): 24h
 *
 * Best-effort: si localStorage falla (quota, modo privado, SSR) se ignora.
 */
interface CacheEntry<T> {
  v: T          // valor
  t: number     // timestamp guardado (Date.now())
}

export function readCache<T>(key: string, maxAgeMs: number): T | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CacheEntry<T>
    if (!parsed || typeof parsed.t !== 'number') return null
    if (Date.now() - parsed.t > maxAgeMs) {
      // Expirado → limpiar para no acumular basura.
      localStorage.removeItem(key)
      return null
    }
    return parsed.v
  } catch {
    return null
  }
}

export function writeCache<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined') return
    const entry: CacheEntry<T> = { v: value, t: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // Quota exceeded / private mode → silent
  }
}

export function invalidateCache(keyOrPrefix: string, isPrefix = false): void {
  try {
    if (typeof window === 'undefined') return
    if (!isPrefix) {
      localStorage.removeItem(keyOrPrefix)
      return
    }
    // Limpiar todas las keys que empiezan por el prefix.
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (k && k.startsWith(keyOrPrefix)) toRemove.push(k)
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
  } catch {
    /* silent */
  }
}

/**
 * Stale-while-revalidate: devuelve cache inmediato si existe (incluso si va a refrescar
 * en background), y dispara el fetcher. El callback `onFresh` recibe el dato nuevo cuando
 * llegue. Útil para que la UI muestre lo cacheado al instante mientras se actualiza.
 *
 * Devuelve { fromCache, freshPromise }:
 *   · fromCache: T | null  → si existe cache válido
 *   · freshPromise: Promise<T | null> → resolverá con el dato fresco (o null si falla)
 */
export function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  maxAgeMs: number,
  onFresh?: (data: T) => void,
): { fromCache: T | null; freshPromise: Promise<T | null> } {
  const fromCache = readCache<T>(key, maxAgeMs)
  const freshPromise = fetcher()
    .then((data) => {
      writeCache(key, data)
      onFresh?.(data)
      return data
    })
    .catch((error) => {
      console.warn(`[cache:${key}] fetch falló:`, (error as Error)?.message ?? error)
      return null
    })
  return { fromCache, freshPromise }
}

export const Loading = (set) => {
  set(true)
  setTimeout(() => {
    set(false)
  }, 1000)
}

export function useDelayUnmount(isMounted: boolean, delayTime: number) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isMounted && !shouldRender) {
      setShouldRender(true);
    }
    else if (!isMounted && shouldRender) {
      timeoutId = setTimeout(
        () => setShouldRender(false),
        delayTime
      );
    }
    return () => clearTimeout(timeoutId);
  }, [isMounted, delayTime, shouldRender]);

  return shouldRender;
}

export const getCurrency = (value: number | string, currency?: string) => {
  // BUG-09 QA #13 (25-jun): si el evento no tiene currency definido el
  // negocio Bodas de Hoy es España → EUR por defecto, NO USD ni "decimal sin
  // símbolo". Para evitar US$ por defecto, fallback a 'eur'.
  const cur = currency ?? "eur"
  const v = typeof value === "string" ? parseFloat(value) : value
  if (v == null || isNaN(v)) return "0.00"
  return v.toLocaleString(navigator.language, {
    style: "currency",
    currency: cur,
    minimumFractionDigits: !["cop"].includes(GlobalCurrency) ? 2 : 0,
    maximumFractionDigits: !["cop"].includes(GlobalCurrency) ? 2 : 0,
  })
}

export const getAllFilterGuest = (event: Event) => {
  if (event) {
    return event?.planSpace?.map((planSpace) => {
      const guestsSections = planSpace?.sections?.reduce((sections, section) => {
        const guestsSection = section?.tables?.reduce((tables, table) => {
          if (table?.guests?.length > 0) {
            const asd = table.guests.map(elem => {
              return {
                guestID: elem._id,
                planSpaceID: planSpace?._id,
                sectionID: undefined,
                tableID: table._id,
                chair: elem.chair,
                order: elem.order,
              }
            })
            tables = [...tables, asd]
          }
          return tables
        }, [])
        sections.push(...(guestsSection ?? []))
        return sections
      }, []) || []
      const guestsTables = planSpace?.tables?.reduce((tables, table) => {
        if (table?.guests?.length > 0) {
          const asd = table.guests.map(elem => {
            return {
              guestID: elem._id,
              planSpaceID: planSpace._id,
              sectionID: undefined,
              tableID: table._id,
              chair: elem.chair,
              order: elem.order,
            }
          })
          tables = [...tables, ...asd]
        }
        return tables
      }, []) || []
      const guestsSentados = [...guestsSections, ...guestsTables]
      const guestsSentadosIds = guestsSentados.map(elem => elem.guestID)
      const filterGuest = event?.invitados_array?.reduce((acc, item) => {
        if (item == null) return acc
        if (guestsSentadosIds?.includes(item?._id)) {
          const guest = guestsSentados.find(elem => elem.guestID === item._id)
          acc.sentados.push({
            ...item,
            ...guest
          })
          return acc
        }
        acc.noSentados.push(item)
        return acc
      }, { sentados: [], noSentados: [] })
      return filterGuest
    })
  }

}

// Objeto de icono perfil
export const ImageProfile = {
  hombre: {
    image: "/profile_men.png",
    alt: "Hombre",
  },
  mujer: {
    image: "profile_woman.png",
    alt: "Mujer",
  },
};
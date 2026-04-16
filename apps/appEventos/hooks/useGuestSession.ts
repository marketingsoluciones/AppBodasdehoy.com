import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';

export interface GuestSession {
  guestId: string;
  guestName: string;
  /** Presente solo si fue identificado por QR personalizado */
  pGuestToken?: string;
  eventId: string;
  /**
   * Niveles de acceso:
   * 0 = anónimo (solo lectura)
   * 1 = nombre libre (puede subir fotos, identidad social)
   * 2 = identificado por QR personalizado pGuestEvent (validado)
   */
  level: 0 | 1 | 2;
}

function storageKey(eventId: string) {
  return `guest_session_${eventId}`;
}

/** Genera un ID anónimo único y persistente por navegador */
function generateAnonId(): string {
  const existing = localStorage.getItem('guest_anon_id');
  if (existing) return existing;
  const id = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem('guest_anon_id', id);
  return id;
}

/**
 * Gestiona la identidad del invitado en el portal público.
 *
 * Niveles de identificación:
 *   2 — QR personalizado (?g=token) → nombre real del invitado validado por api2
 *   1 — Nombre libre → el invitado escribe su nombre, sin validación
 *   0 — Anónimo → solo puede ver fotos
 *
 * La sesión se persiste en localStorage bajo la clave `guest_session_{eventId}`.
 */
export function useGuestSession(eventId: string) {
  const router = useRouter();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    // 1. Restaurar sesión guardada
    try {
      const stored = localStorage.getItem(storageKey(eventId));
      if (stored) {
        const parsed: GuestSession = JSON.parse(stored);
        if (parsed.guestId && parsed.eventId === eventId) {
          setSession(parsed);
          setLoading(false);
        }
      }
    } catch {
      localStorage.removeItem(storageKey(eventId));
    }

    // 2. Identificar por ?g={pGuestToken} (QR personalizado — nivel 2)
    // Usamos el endpoint server-side para no exponer el token en llamadas
    // directas al GraphQL (evita alertas antifraude por peticiones sin auth)
    const pGuestToken = router.query.g as string | undefined;
    if (!pGuestToken) {
      setLoading(false);
      return;
    }

    fetch(`/api/public/validate-guest?g=${encodeURIComponent(pGuestToken)}`)
      .then((r) => r.json())
      .then((result) => {
        if (!result?.valid) return;
        const newSession: GuestSession = {
          guestId: result.guestId,
          guestName: result.guestName,
          pGuestToken,
          eventId,
          level: 2,
        };
        localStorage.setItem(storageKey(eventId), JSON.stringify(newSession));
        setSession(newSession);
      })
      .catch(() => {
        // Fallo silencioso — el portal sigue en modo anónimo
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, router.query.g]);

  /**
   * Permite al invitado identificarse con solo su nombre.
   * No requiere QR, no requiere cuenta. Level 1.
   */
  const setAnonName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed || !eventId) return;
      const newSession: GuestSession = {
        guestId: generateAnonId(),
        guestName: trimmed,
        eventId,
        level: 1,
      };
      localStorage.setItem(storageKey(eventId), JSON.stringify(newSession));
      setSession(newSession);
    },
    [eventId]
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem(storageKey(eventId));
    setSession(null);
  }, [eventId]);

  return {
    session,
    loading,
    /** 0 = anónimo · 1 = nombre libre · 2 = QR personalizado */
    level: (session?.level ?? 0) as 0 | 1 | 2,
    /** Puede subir fotos (nivel ≥ 1) */
    canUpload: (session?.level ?? 0) >= 1,
    setAnonName,
    clearSession,
  };
}

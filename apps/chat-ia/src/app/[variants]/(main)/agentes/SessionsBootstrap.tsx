'use client';

import { Suspense } from 'react';

import { useFetchSessions } from '@/hooks/useFetchSessions';

/**
 * SessionsBootstrap — dispara el fetch de sesiones en /agentes (fix QA 15-ago).
 *
 * BUG: AgentsCoworkView se bloquea en "Cargando tus agentes…" hasta que
 * `isSessionListInit` (= isSessionsFirstFetchFinished) sea true, pero ese flag
 * SOLO lo pone `useFetchSessions`, que hasta ahora únicamente se invocaba en el
 * Asistente (DefaultMode). Al promover /agentes a entrada de primer nivel del rail
 * (Fase A), entrar DIRECTO a /agentes sin pasar antes por /asistente dejaba la
 * vista colgada para siempre (repro QA confirmado).
 *
 * Fix: replicar el MISMO trigger canónico aquí. useFetchSessions usa un SWR con
 * `suspense: true`, así que se aísla en su propio <Suspense> con un hijo que solo
 * suspende y no pinta nada (fallback null) — no afecta al render de la vista. SWR
 * deduplica por clave, así que si el Asistente ya lo pidió, aquí no hay doble fetch.
 */
const Fetcher = () => {
  useFetchSessions();
  return null;
};

const SessionsBootstrap = () => (
  <Suspense fallback={null}>
    <Fetcher />
  </Suspense>
);

export default SessionsBootstrap;

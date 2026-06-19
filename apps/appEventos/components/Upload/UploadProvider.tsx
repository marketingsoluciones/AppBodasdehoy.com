/**
 * UploadProvider — provee una UploadQueue compartida a toda la app appEventos.
 *
 * Estrategia hoy (FASE C):
 *   - Una sola UploadQueue en memoria + persistida en IndexedDB.
 *   - El uploader interno usa singleUpload (FASE A — alineado con backend).
 *   - Cuando llegue FASE B (D5 cableado), aquí cambiamos solo el uploader
 *     y los consumers no notan el cambio.
 *
 * NO se monta automáticamente — para activarlo, envolver _app.tsx con
 * <UploadProvider>...</UploadProvider>. De momento queda como infraestructura
 * lista para enchufar — los componentes legacy siguen usando su path propio
 * hasta que FASE G los migre.
 */

import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  UploadQueue,
  type UploaderFn,
  type UploadResult,
} from '@bodasdehoy/shared/upload';
import { getAuth } from 'firebase/auth';
import Cookies from 'js-cookie';
import { resolveApiBodasGraphqlUrl } from '../../utils/apiEndpoints';
import { getDevelopmentNameFromHostname } from '@bodasdehoy/shared/types';

const UploadQueueContext = createContext<UploadQueue | null>(null);

/**
 * Uploader por defecto: singleUpload GraphQL (FASE A).
 * Cuando llegue FASE B, este se sustituye por un wrapper que decide single
 * vs presign vs multipart por tamaño.
 */
async function singleUploadFn(
  file: File,
  ctx: { entityType: string; entityId: string; category?: string; development?: string },
  onProgress: (pct: number) => void,
  signal: AbortSignal,
): Promise<UploadResult> {
  const development =
    ctx.development ??
    (typeof window !== 'undefined'
      ? getDevelopmentNameFromHostname(window.location.hostname) || 'bodasdehoy'
      : 'bodasdehoy');

  let idToken = Cookies.get('idTokenV0.1.0');
  if (!idToken && getAuth().currentUser) {
    idToken = (await getAuth().currentUser?.getIdToken(true)) ?? undefined;
  }

  const formData = new FormData();
  const operations = {
    query: `mutation ($file: Upload!, $development: String!, $eventId: ID!, $category: String) {
      singleUpload(file: $file, development: $development, eventId: $eventId, category: $category) {
        success errors { field message code }
        file { _id createdAt publicUrls { original optimized800w optimized400w thumbnail } }
      }
    }`,
    variables: {
      file: null,
      development,
      eventId: ctx.entityId,
      category: ctx.category ?? 'attachment',
    },
  };
  formData.append('operations', JSON.stringify(operations));
  formData.append('map', JSON.stringify({ 0: ['variables.file'] }));
  formData.append('0', file, file.name);

  // fetch nativo NO da progreso. Por eso aquí marcamos 10% al lanzar y 100% al recibir.
  // Cuando integremos D5 con XHR/PUT a R2 sí podremos reportar progreso real.
  onProgress(10);

  const res = await fetch(resolveApiBodasGraphqlUrl(), {
    method: 'POST',
    headers: {
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      'x-apollo-operation-name': 'singleUpload',
    },
    body: formData,
    signal,
  });
  onProgress(80);

  if (!res.ok) {
    const err = new Error(`singleUpload HTTP ${res.status}`);
    (err as any).status = res.status;
    throw err;
  }
  const json = await res.json();
  const payload = json?.data?.singleUpload;
  if (!payload?.success || !payload?.file) {
    const msg =
      payload?.errors?.[0]?.message ||
      json?.errors?.[0]?.message ||
      'singleUpload failed';
    throw new Error(msg);
  }
  onProgress(100);
  const f = payload.file;
  return {
    fileId: f._id,
    url: f.publicUrls?.original ?? null,
    sizes: {
      i1024: f.publicUrls?.original ?? null,
      i800: f.publicUrls?.optimized800w ?? f.publicUrls?.original ?? null,
      i640: f.publicUrls?.optimized400w ?? f.publicUrls?.optimized800w ?? null,
      i320: f.publicUrls?.thumbnail ?? f.publicUrls?.optimized400w ?? null,
    },
    raw: f,
  };
}

interface UploadProviderProps {
  children: React.ReactNode;
  /** Override del uploader (útil para tests o cuando llegue FASE B). */
  uploader?: UploaderFn;
  /** Concurrencia (default 3). */
  concurrency?: number;
}

export function UploadProvider({
  children,
  uploader,
  concurrency = 3,
}: UploadProviderProps) {
  const queueRef = useRef<UploadQueue | null>(null);
  if (!queueRef.current) {
    queueRef.current = new UploadQueue(uploader ?? (singleUploadFn as UploaderFn), {
      concurrency,
      persist: true,
      storeName: 'appeventos-upload-queue',
      maxItemRetries: 1,
    });
  }

  useEffect(() => {
    // Restaurar items pendientes de IndexedDB tras refresh
    queueRef.current?.restore().catch(() => {
      /* silent */
    });
  }, []);

  const value = useMemo(() => queueRef.current!, []);

  return <UploadQueueContext.Provider value={value}>{children}</UploadQueueContext.Provider>;
}

/** Hook para acceder a la queue (lanza error si no está dentro del provider). */
export function useUploadQueue(): UploadQueue {
  const ctx = useContext(UploadQueueContext);
  if (!ctx) {
    throw new Error('useUploadQueue must be used inside <UploadProvider>');
  }
  return ctx;
}

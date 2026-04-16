'use client';

/**
 * TrackingCapture — Componente cliente que captura UTMs y ?ref= al montar.
 * Se renderiza una sola vez en el layout raíz de [variants]/layout.tsx.
 * No renderiza ningún elemento visual.
 */
import { useEffect } from 'react';
import { captureTrackingParams } from '@bodasdehoy/shared';

export default function TrackingCapture() {
  useEffect(() => {
    captureTrackingParams();
  }, []);

  return null;
}

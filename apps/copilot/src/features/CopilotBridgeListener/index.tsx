'use client';

/**
 * CopilotBridgeListener - Componente invisible que escucha mensajes del parent
 *
 * Cuando el copilot está en un iframe dentro de AppBodasdeHoy,
 * este componente recibe la autenticación del usuario desde el parent.
 */

import { useCopilotBridge } from '@/hooks/useCopilotBridge';

export function CopilotBridgeListener() {
  // El hook se encarga de todo: escuchar mensajes, configurar auth, etc.
  useCopilotBridge();

  return null; // Componente invisible
}

export default CopilotBridgeListener;

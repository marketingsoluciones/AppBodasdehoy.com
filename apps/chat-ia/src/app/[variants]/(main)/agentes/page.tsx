'use client';

import dynamic from 'next/dynamic';

/**
 * /agentes — wrapper de renderizado SOLO en cliente (ssr: false).
 *
 * Root cause React #418 (QA 5-ago): la vista de agentes es 100% client-data-driven
 * (sesiones Zustand, métricas api-ia, tema claro/oscuro) y hasta ahora SSR-eaba
 * completa → el HTML del servidor no coincidía con el 1er render del cliente
 * (mismatch de tema → "pantalla dividida negro/blanco" + hidratación abortada →
 * los efectos de fetch nunca disparaban → "cero requests").
 *
 * El guard `mounted` a nivel de página (#265) fue insuficiente porque el mismatch
 * proviene del árbol SSR de la ruta, no solo del cuerpo. La solución robusta y
 * idéntica al patrón ya usado en /asistente (AgentSettings, etc.) es NO renderizar
 * esta ruta en el servidor. Con ssr:false el servidor emite solo el placeholder y
 * el cliente monta toda la vista → es imposible que haya mismatch de hidratación.
 */
const AgentsCoworkView = dynamic(() => import('./AgentsCoworkView'), {
  loading: () => (
    <div className="flex h-full" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm" style={{ color: '#84848F' }}>
          Cargando tus agentes…
        </p>
      </div>
    </div>
  ),
  ssr: false,
});

export default function AgentesPage() {
  return <AgentsCoworkView />;
}

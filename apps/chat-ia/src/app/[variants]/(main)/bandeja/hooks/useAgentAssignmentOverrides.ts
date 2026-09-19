'use client';

import { create } from 'zustand';

/**
 * Asignaciones de responsable pendientes de que el backend las refleje.
 *
 * POR QUÉ EXISTE (verificado el 27-ago leyendo el código de api-ia):
 * el responsable se ESCRIBE con la mutation `setConversationAgent` de api-mcp, pero la Bandeja
 * LEE las conversaciones de api-ia, que enriquece `assignedAgentId` desde api-mcp y cachea ese
 * mapa en Redis con `ex=120` (`_enrich_names_from_mcp`). El circuito funciona, pero hasta DOS
 * MINUTOS después de asignar, la lista sigue devolviendo el valor viejo.
 *
 * Sin esto, el usuario asigna un responsable, la cabecera del detalle lo muestra al instante
 * (ya era optimista) y la LISTA no se entera: ni el chip del responsable ni el filtro `?agent=`,
 * que además solo se activa si alguna conversación trae agente. Parece que no ha pasado nada.
 *
 * NO se toca el TTL del backend: es una caché legítima y bajarla le carga api-mcp de trabajo.
 *
 * El override se borra solo en cuanto el backend devuelve el mismo valor, así que no puede
 * quedarse enganchado tapando un cambio hecho desde otro sitio (otra pestaña, otro agente).
 */

interface AgentAssignment {
  id: string | null;
  name: string | null;
}

interface AgentAssignmentOverridesState {
  /** Aplica el override si lo hay; si no, devuelve el valor del backend tal cual. */
  resolve: (
    conversationId: string,
    fromBackend: AgentAssignment,
  ) => AgentAssignment;
  /** Registra una asignación recién confirmada por api-mcp. */
  setOverride: (conversationId: string, assignment: AgentAssignment) => void;
  overrides: Record<string, AgentAssignment>;
}

export const useAgentAssignmentOverrides = create<AgentAssignmentOverridesState>((set, get) => ({
  overrides: {},

  resolve: (conversationId, fromBackend) => {
    const pending = get().overrides[conversationId];
    if (!pending) return fromBackend;

    // El backend ya se puso al día (mismo id, incluida la desasignación a null) → sobra el
    // override. Se limpia de forma diferida para no mutar el store durante un render.
    if (pending.id === (fromBackend.id ?? null)) {
      queueMicrotask(() => {
        set((state) => {
          const rest = { ...state.overrides };
          delete rest[conversationId];
          return { overrides: rest };
        });
      });
      return fromBackend;
    }

    return pending;
  },

  setOverride: (conversationId, assignment) =>
    set((state) => ({
      overrides: { ...state.overrides, [conversationId]: assignment },
    })),
}));

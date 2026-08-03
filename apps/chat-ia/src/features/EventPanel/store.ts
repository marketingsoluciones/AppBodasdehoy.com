import { create } from 'zustand';

/**
 * Store del PANEL CONTEXTUAL del chat (#7 informe integración api-ia).
 * La IA (via filter_view) o el usuario abren el panel derecho en una sección del
 * evento; el panel lee getEventoById DIRECTO de api-mcp (sin LLM, sin doble billing).
 *
 * Consumir con selectores de PRIMITIVAS (s => s.isOpen) para no romper con Zustand
 * (React #185: selectores que devuelven objetos frescos). Ver [[reference_zustand5_useshallow_bandeja_185]].
 */
export type EventSection = 'presupuesto' | 'itinerario' | 'servicios';

export const EVENT_SECTIONS: EventSection[] = ['presupuesto', 'itinerario', 'servicios'];

// Entidades que la IA manda por filter_view → sección del panel.
export const ENTITY_TO_SECTION: Record<string, EventSection> = {
  budget: 'presupuesto',
  itinerario: 'itinerario',
  itinerary: 'itinerario',
  presupuesto: 'presupuesto',
  services: 'servicios',
  servicio: 'servicios',
  servicios: 'servicios',
  timeline: 'itinerario',
};

interface EventPanelState {
  close: () => void;
  eventId: string | null;
  isOpen: boolean;
  open: (section: EventSection, eventId?: string | null) => void;
  section: EventSection;
  setSection: (section: EventSection) => void;
}

export const useEventPanelStore = create<EventPanelState>((set) => ({
  close: () => set({ isOpen: false }),
  eventId: null,
  isOpen: false,
  open: (section, eventId) =>
    set((s) => ({ eventId: eventId ?? s.eventId, isOpen: true, section })),
  section: 'presupuesto',
  setSection: (section) => set({ section }),
}));

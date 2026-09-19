'use client';

/**
 * useWeddingWeb Hook
 * Estado y acciones para la web de boda. Persistencia opcional vía API inyectable
 * o por defecto fetch a /api/wedding (host Next.js).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ScheduleData,
  ScheduleEvent,
  SectionConfig,
  SectionType,
  WeddingWebData,
  PaletteType,
} from '../types';

/** API opcional: si no se pasa y persistToAPI=true, se usa fetch a /api/wedding (Next.js). */
export interface WeddingWebAPI {
  load: (id: string) => Promise<WeddingWebData | null>;
  save: (wedding: WeddingWebData) => Promise<boolean>;
}

let weddingIdCounter = 0;

function createWeddingId(): string {
  weddingIdCounter = (weddingIdCounter + 1) % 1_000_000_000;
  return `wedding-${Date.now()}-${weddingIdCounter}`;
}

function createInitialWeddingData(): WeddingWebData {
  return {
    couple: {
      partner1: { name: 'Nombre 1' },
      partner2: { name: 'Nombre 2' },
    },
    createdAt: new Date().toISOString(),
    date: {
      date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    },
    hero: {
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920',
      showCountdown: true,
      subtitle: 'Nos casamos',
    },
    id: createWeddingId(),
    published: false,
    sections: [
      {
        data: {
          events: [
            { id: '1', location: 'Iglesia', time: '17:00', title: 'Ceremonia', type: 'ceremony' },
            { id: '2', location: 'Jardin', time: '18:30', title: 'Coctel', type: 'cocktail' },
            { id: '3', location: 'Salon', time: '20:00', title: 'Cena', type: 'dinner' },
            { id: '4', location: 'Salon', time: '22:00', title: 'Fiesta', type: 'party' },
          ],
          title: 'Programa del Dia',
        },
        enabled: true,
        order: 1,
        type: 'schedule',
      },
      {
        data: {
          showDirections: true,
          showMap: true,
          title: 'Ubicacion',
          venues: [
            { address: 'Direccion del lugar', city: 'Ciudad', id: '1', name: 'Nombre del Lugar', type: 'both' },
          ],
        },
        enabled: true,
        order: 2,
        type: 'location',
      },
      {
        data: { layout: 'grid', photos: [], title: 'Nuestra Historia' },
        enabled: false,
        order: 3,
        type: 'gallery',
      },
      {
        data: { dressCode: { description: 'Vestimenta formal', type: 'formal' }, faqs: [], title: 'Informacion' },
        enabled: true,
        order: 4,
        type: 'info',
      },
      {
        data: {
          config: {
            allowPlusOne: true,
            askDietaryRestrictions: true,
            askMessage: true,
            askSongRequest: true,
            deadline: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
          },
          title: 'Confirma tu Asistencia',
        },
        enabled: true,
        order: 5,
        type: 'rsvp',
      },
      {
        data: { links: [], message: 'Tu presencia es nuestro mejor regalo', title: 'Mesa de Regalos' },
        enabled: false,
        order: 6,
        type: 'registry',
      },
    ],
    slug: '',
    style: { palette: 'romantic' },
    updatedAt: new Date().toISOString(),
  };
}

const defaultAPI: WeddingWebAPI = {
  async load(id: string) {
    try {
      const res = await fetch(`/api/wedding/${id}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? data.wedding : null;
    } catch (e) {
      console.error('Error loading wedding from API:', e);
      return null;
    }
  },
  async save(wedding: WeddingWebData) {
    try {
      const res = await fetch(`/api/wedding/${wedding.id}`, {
        body: JSON.stringify({ wedding }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PUT',
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      return !!data.success;
    } catch (e) {
      console.error('Error saving wedding to API:', e);
      return false;
    }
  },
};

export interface UseWeddingWebOptions {
  autoSave?: boolean;
  autoSaveDelay?: number;
  initialData?: WeddingWebData;
  onUpdate?: (data: WeddingWebData) => void;
  persistToAPI?: boolean;
  weddingId?: string;
  /** API de persistencia; si no se pasa, se usa fetch a /api/wedding */
  api?: WeddingWebAPI;
}

export interface UseWeddingWebReturn {
  addScheduleEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
  applyAIChanges: (changes: Partial<WeddingWebData>) => void;
  deleteScheduleEvent: (eventId: string) => void;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  reorderSections: (newOrder: SectionType[]) => void;
  resetWedding: () => void;
  saveWedding: () => Promise<void>;
  setWedding: (data: WeddingWebData) => void;
  toggleSection: (type: SectionType, enabled: boolean) => void;
  updateCouple: (partner: 'partner1' | 'partner2', name: string) => void;
  updateCustomColors: (colors: Partial<WeddingWebData['style']['customColors']>) => void;
  updateDate: (date: string) => void;
  updateHero: (updates: Partial<WeddingWebData['hero']>) => void;
  updatePalette: (palette: PaletteType) => void;
  updateScheduleEvent: (eventId: string, updates: Partial<ScheduleEvent>) => void;
  updateSection: <T extends SectionConfig['data']>(type: SectionType, data: Partial<T>) => void;
  wedding: WeddingWebData;
}

export function useWeddingWeb(options: UseWeddingWebOptions = {}): UseWeddingWebReturn {
  const {
    weddingId,
    initialData,
    onUpdate,
    autoSave = false,
    autoSaveDelay = 2000,
    persistToAPI = true,
    api = defaultAPI,
  } = options;

  const [wedding, setWeddingState] = useState<WeddingWebData>(initialData ?? createInitialWeddingData());
  const [isLoading, setIsLoading] = useState(() => !!(weddingId && persistToAPI && !initialData));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialData) {
      setWeddingState(initialData);
      setIsLoading(false);
      return;
    }
    if (weddingId && persistToAPI) {
      setIsLoading(true);
      const t = setTimeout(() => setIsLoading(false), 5000);
      api
        .load(weddingId)
        .then((data) => {
          clearTimeout(t);
          if (data) setWeddingState(data);
        })
        .catch(() => clearTimeout(t))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [weddingId, initialData, persistToAPI, api]);

  const updateWedding = useCallback(
    (updater: (prev: WeddingWebData) => WeddingWebData) => {
      setWeddingState((prev) => {
        const next = updater(prev);
        next.updatedAt = new Date().toISOString();
        onUpdate?.(next);
        return next;
      });
      setIsDirty(true);
    },
    [onUpdate]
  );

  useEffect(() => {
    if (!autoSave || !isDirty) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        if (persistToAPI) {
          const ok = await api.save(wedding);
          if (ok) {
            setIsDirty(false);
            setLastSaved(new Date());
          }
        } else {
          await new Promise((r) => setTimeout(r, 300));
          setIsDirty(false);
          setLastSaved(new Date());
        }
      } finally {
        setIsSaving(false);
      }
    }, autoSaveDelay);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [wedding, isDirty, autoSave, autoSaveDelay, persistToAPI, api]);

  const setWedding = useCallback((data: WeddingWebData) => {
    setWeddingState(data);
    setIsDirty(false);
  }, []);

  const resetWedding = useCallback(() => {
    setWeddingState(createInitialWeddingData());
    setIsDirty(false);
  }, []);

  const saveWedding = useCallback(async () => {
    setIsSaving(true);
    try {
      if (persistToAPI) {
        const ok = await api.save(wedding);
        if (!ok) throw new Error('Failed to save wedding to API');
      } else {
        await new Promise((r) => setTimeout(r, 300));
      }
      setIsDirty(false);
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [wedding, persistToAPI, api]);

  const updateCouple = useCallback(
    (partner: 'partner1' | 'partner2', name: string) =>
      updateWedding((prev) => ({
        ...prev,
        couple: { ...prev.couple, [partner]: { ...prev.couple[partner], name } },
      })),
    [updateWedding]
  );
  const updateDate = useCallback(
    (date: string) => updateWedding((prev) => ({ ...prev, date: { ...prev.date, date } })),
    [updateWedding]
  );
  const updatePalette = useCallback(
    (palette: PaletteType) =>
      updateWedding((prev) => ({ ...prev, style: { ...prev.style, palette } })),
    [updateWedding]
  );
  const updateCustomColors = useCallback(
    (colors: Partial<WeddingWebData['style']['customColors']>) =>
      updateWedding((prev) => ({
        ...prev,
        style: { ...prev.style, customColors: { ...prev.style.customColors, ...colors } },
      })),
    [updateWedding]
  );
  const updateHero = useCallback(
    (updates: Partial<WeddingWebData['hero']>) =>
      updateWedding((prev) => ({ ...prev, hero: { ...prev.hero, ...updates } })),
    [updateWedding]
  );
  const updateSection = useCallback(
    <T extends SectionConfig['data']>(type: SectionType, data: Partial<T>) =>
      updateWedding((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.type === type ? { ...s, data: { ...s.data, ...data } as T } : s
        ),
      })),
    [updateWedding]
  );

  const addScheduleEvent = useCallback(
    (event: Omit<ScheduleEvent, 'id'>) =>
      updateWedding((prev) => {
        const section = prev.sections.find((s) => s.type === 'schedule');
        if (!section) return prev;
        const newEvent: ScheduleEvent = {
          ...event,
          id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        };
        const scheduleData = section.data as ScheduleData;
        const events = [...scheduleData.events, newEvent].sort((a, b) => a.time.localeCompare(b.time));
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.type === 'schedule' ? { ...s, data: { ...scheduleData, events } } : s
          ),
        };
      }),
    [updateWedding]
  );

  const updateScheduleEvent = useCallback(
    (eventId: string, updates: Partial<ScheduleEvent>) =>
      updateWedding((prev) => {
        const section = prev.sections.find((s) => s.type === 'schedule');
        if (!section) return prev;
        const scheduleData = section.data as ScheduleData;
        const events = scheduleData.events
          .map((e) => (e.id === eventId ? { ...e, ...updates } : e))
          .sort((a, b) => a.time.localeCompare(b.time));
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.type === 'schedule' ? { ...s, data: { ...scheduleData, events } } : s
          ),
        };
      }),
    [updateWedding]
  );

  const deleteScheduleEvent = useCallback(
    (eventId: string) =>
      updateWedding((prev) => {
        const section = prev.sections.find((s) => s.type === 'schedule');
        if (!section) return prev;
        const scheduleData = section.data as ScheduleData;
        const events = scheduleData.events.filter((e) => e.id !== eventId);
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.type === 'schedule' ? { ...s, data: { ...scheduleData, events } } : s
          ),
        };
      }),
    [updateWedding]
  );

  const toggleSection = useCallback(
    (type: SectionType, enabled: boolean) =>
      updateWedding((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => (s.type === type ? { ...s, enabled } : s)),
      })),
    [updateWedding]
  );

  const reorderSections = useCallback(
    (newOrder: SectionType[]) =>
      updateWedding((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => ({ ...s, order: newOrder.indexOf(s.type) })),
      })),
    [updateWedding]
  );

  const applyAIChanges = useCallback(
    (changes: Partial<WeddingWebData>) =>
      updateWedding((prev) => ({
        ...prev,
        ...changes,
        couple: changes.couple ? { ...prev.couple, ...changes.couple } : prev.couple,
        date: changes.date ? { ...prev.date, ...changes.date } : prev.date,
        hero: changes.hero ? { ...prev.hero, ...changes.hero } : prev.hero,
        style: changes.style ? { ...prev.style, ...changes.style } : prev.style,
      })),
    [updateWedding]
  );

  return {
    addScheduleEvent,
    applyAIChanges,
    deleteScheduleEvent,
    isDirty,
    isLoading,
    isSaving,
    lastSaved,
    reorderSections,
    resetWedding,
    saveWedding,
    setWedding,
    toggleSection,
    updateCouple,
    updateCustomColors,
    updateDate,
    updateHero,
    updatePalette,
    updateScheduleEvent,
    updateSection,
    wedding,
  };
}

export default useWeddingWeb;

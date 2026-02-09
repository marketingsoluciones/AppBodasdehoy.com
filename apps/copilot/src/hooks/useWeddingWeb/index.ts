'use client';

/**
 * useWeddingWeb Hook
 * ==================
 * Hook para manejar el estado de la web de boda en el Wedding Creator
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { WeddingWebData, PaletteType, SectionType, SectionConfig } from '@/components/wedding-site/types';

// Estado inicial de una web de boda
const createInitialWeddingData = (): WeddingWebData => ({
  couple: {
    partner1: { name: 'Nombre 1' },
    partner2: { name: 'Nombre 2' },
  },
  createdAt: new Date().toISOString(),
  date: {
    date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 meses
  },
  hero: {
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920',
    showCountdown: true,
    subtitle: 'Nos casamos',
  },
  id: `wedding-${Date.now()}`,
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
          {
            address: 'Direccion del lugar',
            city: 'Ciudad',
            id: '1',
            name: 'Nombre del Lugar',
            type: 'both',
          },
        ],
      },
      enabled: true,
      order: 2,
      type: 'location',
    },
    {
      data: {
        layout: 'grid',
        photos: [],
        title: 'Nuestra Historia',
      },
      enabled: false,
      order: 3,
      type: 'gallery',
    },
    {
      data: {
        dressCode: {
          description: 'Vestimenta formal',
          type: 'formal',
        },
        faqs: [],
        title: 'Informacion',
      },
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
      data: {
        links: [],
        message: 'Tu presencia es nuestro mejor regalo',
        title: 'Mesa de Regalos',
      },
      enabled: false,
      order: 6,
      type: 'registry',
    },
  ],
  slug: '',
  style: {
    palette: 'romantic',
  },
  updatedAt: new Date().toISOString(),
});

export interface UseWeddingWebOptions {
  /** Enable auto-save */
  autoSave?: boolean;
  /** Delay before auto-save in ms */
  autoSaveDelay?: number;
  /** Initial data to use (overrides weddingId) */
  initialData?: WeddingWebData;
  /** Callback when data changes */
  onUpdate?: (data: WeddingWebData) => void;
  /** Enable API persistence */
  persistToAPI?: boolean;
  /** ID of existing wedding to load */
  weddingId?: string;
}

// API functions for wedding persistence
async function loadWeddingFromAPI(id: string): Promise<WeddingWebData | null> {
  try {
    const response = await fetch(`/api/wedding/${id}`, {
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.wedding : null;
  } catch (error) {
    console.error('Error loading wedding from API:', error);
    return null;
  }
}

async function saveWeddingToAPI(wedding: WeddingWebData): Promise<boolean> {
  try {
    const response = await fetch(`/api/wedding/${wedding.id}`, {
      body: JSON.stringify({ wedding }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error saving wedding to API:', error);
    return false;
  }
}

export interface UseWeddingWebReturn {
  // Actions - Schedule Events
  addScheduleEvent: (event: Omit<import('@/components/wedding-site/types').ScheduleEvent, 'id'>) => void;
  // Actions - From AI/Chat
  applyAIChanges: (changes: Partial<WeddingWebData>) => void;
  deleteScheduleEvent: (eventId: string) => void;
  isDirty: boolean;
  isLoading: boolean;

  isSaving: boolean;
  lastSaved: Date | null;
  reorderSections: (newOrder: SectionType[]) => void;

  resetWedding: () => void;

  saveWedding: () => Promise<void>;

  // Actions - General
  setWedding: (data: WeddingWebData) => void;
  toggleSection: (type: SectionType, enabled: boolean) => void;

  // Actions - Couple
  updateCouple: (partner: 'partner1' | 'partner2', name: string) => void;

  updateCustomColors: (colors: Partial<WeddingWebData['style']['customColors']>) => void;
  // Actions - Date
  updateDate: (date: string) => void;
  // Actions - Hero
  updateHero: (updates: Partial<WeddingWebData['hero']>) => void;

  // Actions - Style
  updatePalette: (palette: PaletteType) => void;
  updateScheduleEvent: (eventId: string, updates: Partial<import('@/components/wedding-site/types').ScheduleEvent>) => void;
  // Actions - Sections
  updateSection: <T extends SectionConfig['data']>(type: SectionType, data: Partial<T>) => void;

  // State
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
  } = options;

  const [wedding, setWeddingState] = useState<WeddingWebData>(
    initialData || createInitialWeddingData()
  );
  // ✅ OPTIMIZACIÓN: Empezar con isLoading=false para mostrar UI inmediatamente
  // Solo marcar como loading si realmente necesitamos cargar datos
  const [isLoading, setIsLoading] = useState(() => {
    // Solo mostrar loading si tenemos weddingId y necesitamos cargar
    return !!(weddingId && persistToAPI && !initialData);
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load wedding from API on mount (if weddingId provided)
  useEffect(() => {
    if (initialData) {
      // If initialData is provided, use it directly
      setWeddingState(initialData);
      setIsLoading(false);
      return;
    }

    if (weddingId && persistToAPI) {
      // Load existing wedding from API
      setIsLoading(true);
      // ✅ OPTIMIZACIÓN: Timeout para evitar bloqueos indefinidos
      const timeoutId = setTimeout(() => {
        console.warn('⏱️ Timeout cargando wedding, usando datos por defecto');
        setIsLoading(false);
      }, 5000); // 5 segundos máximo

      loadWeddingFromAPI(weddingId)
        .then((data) => {
          clearTimeout(timeoutId);
          if (data) {
            setWeddingState(data);
          }
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          console.error('Error cargando wedding:', error);
        })
        .finally(() => setIsLoading(false));
    } else {
      // No hay weddingId, no necesitamos cargar - ya está en false
      setIsLoading(false);
    }
  }, [weddingId, initialData, persistToAPI]);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update with dirty tracking
  const updateWedding = useCallback(
    (updater: (prev: WeddingWebData) => WeddingWebData) => {
      setWeddingState((prev) => {
        const newData = updater(prev);
        newData.updatedAt = new Date().toISOString();
        onUpdate?.(newData);
        return newData;
      });
      setIsDirty(true);
    },
    [onUpdate]
  );

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !isDirty) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);

      try {
        if (persistToAPI) {
          // Save to API
          const success = await saveWeddingToAPI(wedding);
          if (success) {
            setIsDirty(false);
            setLastSaved(new Date());
          } else {
            console.error('Auto-save to API failed');
          }
        } else {
          // Local save simulation
          await new Promise((resolve) => setTimeout(resolve, 300));
          setIsDirty(false);
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Auto-save error:', error);
      } finally {
        setIsSaving(false);
      }
    }, autoSaveDelay);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [wedding, isDirty, autoSave, autoSaveDelay, persistToAPI]);

  // Actions
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
        const success = await saveWeddingToAPI(wedding);
        if (!success) {
          throw new Error('Failed to save wedding to API');
        }
      } else {
        // Local save simulation
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setIsDirty(false);
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  }, [wedding, persistToAPI]);

  const updateCouple = useCallback(
    (partner: 'partner1' | 'partner2', name: string) => {
      updateWedding((prev) => ({
        ...prev,
        couple: {
          ...prev.couple,
          [partner]: { ...prev.couple[partner], name },
        },
      }));
    },
    [updateWedding]
  );

  const updateDate = useCallback(
    (date: string) => {
      updateWedding((prev) => ({
        ...prev,
        date: { ...prev.date, date },
      }));
    },
    [updateWedding]
  );

  const updatePalette = useCallback(
    (palette: PaletteType) => {
      updateWedding((prev) => ({
        ...prev,
        style: { ...prev.style, palette },
      }));
    },
    [updateWedding]
  );

  const updateCustomColors = useCallback(
    (colors: Partial<WeddingWebData['style']['customColors']>) => {
      updateWedding((prev) => ({
        ...prev,
        style: {
          ...prev.style,
          customColors: { ...prev.style.customColors, ...colors },
        },
      }));
    },
    [updateWedding]
  );

  const updateHero = useCallback(
    (updates: Partial<WeddingWebData['hero']>) => {
      updateWedding((prev) => ({
        ...prev,
        hero: { ...prev.hero, ...updates },
      }));
    },
    [updateWedding]
  );

  const updateSection = useCallback(
    <T extends SectionConfig['data']>(type: SectionType, data: Partial<T>) => {
      updateWedding((prev) => ({
        ...prev,
        sections: prev.sections.map((section) =>
          section.type === type
            ? { ...section, data: { ...section.data, ...data } as T }
            : section
        ),
      }));
    },
    [updateWedding]
  );

  // Schedule events management
  const addScheduleEvent = useCallback(
    (event: Omit<import('@/components/wedding-site/types').ScheduleEvent, 'id'>) => {
      updateWedding((prev) => {
        const scheduleSection = prev.sections.find((s) => s.type === 'schedule');
        if (!scheduleSection) return prev;

        const newEvent: import('@/components/wedding-site/types').ScheduleEvent = {
          ...event,
          id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        };

        const scheduleData = scheduleSection.data as import('@/components/wedding-site/types').ScheduleData;
        const updatedEvents = [...scheduleData.events, newEvent].sort((a, b) => 
          a.time.localeCompare(b.time)
        );

        return {
          ...prev,
          sections: prev.sections.map((section) =>
            section.type === 'schedule'
              ? { ...section, data: { ...scheduleData, events: updatedEvents } }
              : section
          ),
        };
      });
    },
    [updateWedding]
  );

  const updateScheduleEvent = useCallback(
    (eventId: string, updates: Partial<import('@/components/wedding-site/types').ScheduleEvent>) => {
      updateWedding((prev) => {
        const scheduleSection = prev.sections.find((s) => s.type === 'schedule');
        if (!scheduleSection) return prev;

        const scheduleData = scheduleSection.data as import('@/components/wedding-site/types').ScheduleData;
        const updatedEvents = scheduleData.events.map((event) =>
          event.id === eventId ? { ...event, ...updates } : event
        ).sort((a, b) => a.time.localeCompare(b.time));

        return {
          ...prev,
          sections: prev.sections.map((section) =>
            section.type === 'schedule'
              ? { ...section, data: { ...scheduleData, events: updatedEvents } }
              : section
          ),
        };
      });
    },
    [updateWedding]
  );

  const deleteScheduleEvent = useCallback(
    (eventId: string) => {
      updateWedding((prev) => {
        const scheduleSection = prev.sections.find((s) => s.type === 'schedule');
        if (!scheduleSection) return prev;

        const scheduleData = scheduleSection.data as import('@/components/wedding-site/types').ScheduleData;
        const updatedEvents = scheduleData.events.filter((event) => event.id !== eventId);

        return {
          ...prev,
          sections: prev.sections.map((section) =>
            section.type === 'schedule'
              ? { ...section, data: { ...scheduleData, events: updatedEvents } }
              : section
          ),
        };
      });
    },
    [updateWedding]
  );

  const toggleSection = useCallback(
    (type: SectionType, enabled: boolean) => {
      updateWedding((prev) => ({
        ...prev,
        sections: prev.sections.map((section) =>
          section.type === type ? { ...section, enabled } : section
        ),
      }));
    },
    [updateWedding]
  );

  const reorderSections = useCallback(
    (newOrder: SectionType[]) => {
      updateWedding((prev) => ({
        ...prev,
        sections: prev.sections.map((section) => ({
          ...section,
          order: newOrder.indexOf(section.type),
        })),
      }));
    },
    [updateWedding]
  );

  const applyAIChanges = useCallback(
    (changes: Partial<WeddingWebData>) => {
      updateWedding((prev) => ({
        ...prev,
        ...changes,
        couple: changes.couple ? { ...prev.couple, ...changes.couple } : prev.couple,
        date: changes.date ? { ...prev.date, ...changes.date } : prev.date,
        hero: changes.hero ? { ...prev.hero, ...changes.hero } : prev.hero,
        style: changes.style ? { ...prev.style, ...changes.style } : prev.style,
      }));
    },
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

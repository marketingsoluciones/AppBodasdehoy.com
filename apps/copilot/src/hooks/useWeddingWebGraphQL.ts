'use client';

/**
 * useWeddingWebGraphQL Hook
 * ==========================
 * Hook refactorizado para usar GraphQL con Apollo Client
 * Alineado con la documentación oficial de API2
 */

import { useMutation, useQuery } from '@apollo/client/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GET_WEDDING_WEB,
  CREATE_WEDDING_WEB,
  UPDATE_WEDDING_COUPLE,
  UPDATE_WEDDING_STYLE,
  UPDATE_WEDDING_COLORS,
  SET_WEDDING_HERO_IMAGE,
  UPDATE_WEDDING_RSVP,
  UPDATE_WEDDING_SECTION,
  TOGGLE_WEDDING_SECTION,
  REORDER_WEDDING_SECTIONS,
  UPDATE_WEDDING_VENUE,
  UPDATE_WEDDING_OUR_STORY,
  PUBLISH_WEDDING_WEB,
  UNPUBLISH_WEDDING_WEB,
  UPDATE_WEDDING_WEB,
} from '@/libs/graphql/wedding';
import type {
  WeddingWeb,
  CreateWeddingWebInput,
  UpdatePartnerInput,
  WeddingStyleInput,
  RSVPConfigInput,
  UpdateSectionInput,
  ReorderSectionsInput,
  VenueInfoInput,
  OurStoryInput,
  GetWeddingWebResponse,
  WeddingSectionName,
} from '@/types/wedding-web';
import type { WeddingWebData, PaletteType, SectionType } from '@/components/wedding-site/types';
import { mapTemplateToPalette, mapPaletteToTemplate  } from '@/types/wedding-web';
import { getCurrentDevelopment } from '@/utils/developmentDetector';

/**
 * Helper: Convierte array de secciones a objeto indexado por nombre
 * API2 devuelve: [{ name: 'HERO', enabled: true }, ...]
 * Frontend espera: { hero: { enabled: true, order: 0 }, ... }
 */
interface SectionArrayItem {
  enabled: boolean;
  name: string;
  order?: number;
  title?: string;
}

interface SectionsMap {
  [key: string]: { enabled: boolean; order: number; title?: string } | undefined;
  countdown?: { enabled: boolean; order: number; title?: string };
  faq?: { enabled: boolean; order: number; title?: string };
  gallery?: { enabled: boolean; order: number; title?: string };
  gifts?: { enabled: boolean; order: number; title?: string };
  hero?: { enabled: boolean; order: number; title?: string };
  rsvp?: { enabled: boolean; order: number; title?: string };
  timeline?: { enabled: boolean; order: number; title?: string };
  venue?: { enabled: boolean; order: number; title?: string };
}

function sectionsArrayToMap(sectionsArray: SectionArrayItem[] | SectionsMap | null | undefined): SectionsMap {
  // Si ya es un objeto (estructura antigua), devolverlo
  if (sectionsArray && !Array.isArray(sectionsArray)) {
    return sectionsArray as SectionsMap;
  }

  // Si es array (estructura nueva de API2), convertir a objeto
  if (!sectionsArray || !Array.isArray(sectionsArray)) {
    return {};
  }

  const map: SectionsMap = {};
  sectionsArray.forEach((section, index) => {
    const key = section.name.toLowerCase().replace('_', '');
    map[key] = {
      enabled: section.enabled,
      order: section.order ?? index,
      title: section.title,
    };
  });
  return map;
}

/**
 * Mapea WeddingWeb (GraphQL) a WeddingWebData (Frontend)
 */
function mapGraphQLToFrontend(graphQL: WeddingWeb | null | undefined): WeddingWebData | null {
  if (!graphQL) return null;

  // ✅ Convertir sections array a objeto indexado
  const sectionsMap = sectionsArrayToMap(graphQL.sections as unknown as SectionArrayItem[]);

  // ✅ Usar heroImageUrl (nombre correcto de API2)
  const heroImageUrl = (graphQL.style as any).heroImageUrl || graphQL.style.heroImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920';

  // Mapear secciones GraphQL a formato frontend
  const sections: WeddingWebData['sections'] = [];

  if (sectionsMap.hero) {
    sections.push({
      data: {
        image: heroImageUrl,
        showCountdown: sectionsMap.countdown?.enabled || false,
        subtitle: sectionsMap.hero.title || 'Nos casamos',
      },
      enabled: sectionsMap.hero.enabled,
      order: sectionsMap.hero.order,
      type: 'hero',
    });
  }

  if (sectionsMap.timeline) {
    sections.push({
      data: {
        events: [],
        title: 'Programa del Día',
      },
      enabled: sectionsMap.timeline.enabled,
      order: sectionsMap.timeline.order,
      type: 'schedule',
    });
  }

  if (sectionsMap.venue) {
    sections.push({
      data: {
        showDirections: true,
        showMap: true,
        title: 'Ubicación',
        venues: [
          ...(graphQL.venue?.ceremony ? [{
            address: graphQL.venue.ceremony.address || '',
            city: graphQL.venue.ceremony.city || '',
            id: 'ceremony',
            name: graphQL.venue.ceremony.name || '',
            type: 'ceremony' as const,
          }] : []),
          ...(graphQL.venue?.reception && !graphQL.venue?.sameVenue ? [{
            address: graphQL.venue.reception.address || '',
            city: graphQL.venue.reception.city || '',
            id: 'reception',
            name: graphQL.venue.reception.name || '',
            type: 'reception' as const,
          }] : []),
        ],
      },
      enabled: sectionsMap.venue.enabled,
      order: sectionsMap.venue.order,
      type: 'location',
    });
  }

  if (sectionsMap.gallery) {
    sections.push({
      data: {
        layout: 'grid',
        photos: [],
        title: 'Nuestra Historia',
      },
      enabled: sectionsMap.gallery.enabled,
      order: sectionsMap.gallery.order,
      type: 'gallery',
    });
  }

  if (sectionsMap.faq) {
    sections.push({
      data: {
        faqs: [],
        title: 'Información',
      },
      enabled: sectionsMap.faq.enabled,
      order: sectionsMap.faq.order,
      type: 'info',
    });
  }

  if (sectionsMap.rsvp) {
    sections.push({
      data: {
        config: {
          allowPlusOne: (graphQL.rsvpConfig?.maxPlusOnes || 0) > 0,
          askDietaryRestrictions: true,
          askMessage: true,
          askSongRequest: true,
          deadline: graphQL.rsvpConfig?.deadline || new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString(),
        },
        title: 'Confirma tu Asistencia',
      },
      enabled: sectionsMap.rsvp.enabled,
      order: sectionsMap.rsvp.order,
      type: 'rsvp',
    });
  }

  if (sectionsMap.gifts) {
    sections.push({
      data: {
        links: [],
        message: 'Tu presencia es nuestro mejor regalo',
        title: 'Mesa de Regalos',
      },
      enabled: sectionsMap.gifts.enabled,
      order: sectionsMap.gifts.order,
      type: 'registry',
    });
  }

  return {
    couple: {
      partner1: {
        name: graphQL.couple.partner1.name,
        photo: graphQL.couple.partner1.photoUrl,
      },
      partner2: {
        name: graphQL.couple.partner2.name,
        photo: graphQL.couple.partner2.photoUrl,
      },
    },
    createdAt: graphQL.createdAt || new Date().toISOString(),
    date: {
      date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // TODO: obtener de evento
    },
    hero: {
      image: heroImageUrl,
      showCountdown: sectionsMap.countdown?.enabled || false,
      subtitle: sectionsMap.hero?.title || 'Nos casamos',
    },
    id: graphQL.weddingWebId,
    published: graphQL.status === 'PUBLISHED',
    sections,
    slug: graphQL.subdomain,
    style: {
      customColors: graphQL.style.primaryColor || graphQL.style.secondaryColor ? {
        primary: graphQL.style.primaryColor,
        secondary: graphQL.style.secondaryColor,
      } : undefined,
      palette: mapTemplateToPalette(graphQL.style.template) as PaletteType,
    },
    updatedAt: graphQL.updatedAt || new Date().toISOString(),
  };
}

export interface UseWeddingWebGraphQLOptions {
  /** Enable auto-save */
  autoSave?: boolean;
  /** Delay before auto-save in ms */
  autoSaveDelay?: number;
  /** Development (whitelabel) */
  development?: string;
  /** Event ID requerido para obtener/crear wedding web */
  eventId: string;
  /** Callback when data changes */
  onUpdate?: (data: WeddingWebData) => void;
}

export interface UseWeddingWebGraphQLReturn {
  applyAIChanges: (changes: Partial<WeddingWebData>) => void;
  // Actions - Mutations CRUD
  createWedding: (input: CreateWeddingWebInput) => Promise<boolean>;
  error: Error | null;
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;

  // UpdateWeddingWebInput
  publish: (subdomain?: string) => Promise<{ publicUrl?: string, success: boolean; }>;

  // Actions - Queries
  refetch: () => Promise<void>;
  reorderSections: (input: ReorderSectionsInput) => Promise<boolean>; 
  setHeroImage: (imageUrl: string, overlayOpacity?: number) => Promise<boolean>;
  toggleSection: (type: SectionType, enabled: boolean) => void;

  toggleSectionGraphQL: (section: WeddingSectionName, enabled: boolean) => Promise<boolean>;
  unpublish: () => Promise<boolean>;
  updateColors: (primaryColor?: string, secondaryColor?: string, accentColor?: string, backgroundColor?: string, textColor?: string) => Promise<boolean>;
  // Actions - Mutations Granulares
  updateCouple: (partner1?: UpdatePartnerInput, partner2?: UpdatePartnerInput, hashtag?: string) => Promise<boolean>;
  // Actions - Local state (para compatibilidad con código existente)
  updateCoupleLocal: (partner: 'partner1' | 'partner2', name: string) => void;
  updateHero: (updates: Partial<WeddingWebData['hero']>) => void;
  updateOurStory: (input: OurStoryInput) => Promise<boolean>;
  updatePalette: (palette: PaletteType) => void;
  updateRSVP: (input: RSVPConfigInput) => Promise<boolean>;
  updateSection: (input: UpdateSectionInput) => Promise<boolean>;

  updateStyle: (input: WeddingStyleInput) => Promise<boolean>;
  updateVenue: (input: VenueInfoInput) => Promise<boolean>;
  updateWedding: (input: any) => Promise<boolean>;
  // State
  wedding: WeddingWebData | null;
  weddingWeb: WeddingWeb | null;
}

export function useWeddingWebGraphQL(
  options: UseWeddingWebGraphQLOptions
): UseWeddingWebGraphQLReturn {
  const {
    eventId,
    autoSave = false,
    autoSaveDelay = 2000,
    onUpdate,
    development,
  } = options;

  const dev = development || getCurrentDevelopment() || 'bodasdehoy';

  // Query para obtener wedding web
  const { data, loading, error, refetch: refetchQuery } = useQuery<{ getWeddingWeb: GetWeddingWebResponse }>(
    GET_WEDDING_WEB,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network',
      skip: !eventId,
      variables: { eventId },
    }
  );

  // Mutations
  const [createMutation] = useMutation(CREATE_WEDDING_WEB);
  const [updateWeddingMutation] = useMutation(UPDATE_WEDDING_WEB);
  const [updateCoupleMutation] = useMutation(UPDATE_WEDDING_COUPLE);
  const [updateOurStoryMutation] = useMutation(UPDATE_WEDDING_OUR_STORY);
  const [updateStyleMutation] = useMutation(UPDATE_WEDDING_STYLE);
  const [updateColorsMutation] = useMutation(UPDATE_WEDDING_COLORS);
  const [setHeroImageMutation] = useMutation(SET_WEDDING_HERO_IMAGE);
  const [updateRSVPMutation] = useMutation(UPDATE_WEDDING_RSVP);
  const [updateSectionMutation] = useMutation(UPDATE_WEDDING_SECTION);
  const [toggleSectionMutation] = useMutation(TOGGLE_WEDDING_SECTION);
  const [reorderSectionsMutation] = useMutation(REORDER_WEDDING_SECTIONS);
  const [updateVenueMutation] = useMutation(UPDATE_WEDDING_VENUE);
  const [publishMutation] = useMutation(PUBLISH_WEDDING_WEB);
  const [unpublishMutation] = useMutation(UNPUBLISH_WEDDING_WEB);

  // Estado local para cambios pendientes
  const [localWedding, setLocalWedding] = useState<WeddingWebData | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mapear datos GraphQL a formato frontend
  const weddingWeb = data?.getWeddingWeb?.weddingWeb || null;
  const wedding = localWedding || mapGraphQLToFrontend(weddingWeb);

  // Actualizar estado local cuando cambian los datos de GraphQL
  useEffect(() => {
    if (weddingWeb && !localWedding) {
      const mapped = mapGraphQLToFrontend(weddingWeb);
      if (mapped) {
        setLocalWedding(mapped);
        setIsDirty(false);
      }
    }
  }, [weddingWeb, localWedding]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !isDirty || !localWedding || !weddingWeb) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        // Auto-save solo actualiza cambios locales pendientes
        // Las mutations específicas se llaman manualmente
        setIsDirty(false);
        setLastSaved(new Date());
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
  }, [localWedding, isDirty, autoSave, autoSaveDelay, weddingWeb]);

  // Refetch function
  const refetch = useCallback(async () => {
    try {
      await refetchQuery();
    } catch (error) {
      console.error('Error refetching wedding web:', error);
    }
  }, [refetchQuery]);

  // Create wedding
  const createWedding = useCallback(async (input: CreateWeddingWebInput): Promise<boolean> => {
    try {
      setIsSaving(true);
      // El eventId debe ir dentro del input según la guía
      const inputWithEventId = { ...input, eventId: input.eventId || eventId };
      const result = await createMutation({
        variables: {
          input: inputWithEventId,
        },
      });

      if (result.data?.createWeddingWeb?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating wedding:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [eventId, createMutation, refetch]);

  // Update couple
  const updateCouple = useCallback(async (
    partner1?: UpdatePartnerInput,
    partner2?: UpdatePartnerInput,
    hashtag?: string
  ): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await updateCoupleMutation({
        variables: {
          hashtag,
          partner1,
          partner2,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.updateWeddingCouple?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating couple:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, updateCoupleMutation, refetch]);

  // Update style
  const updateStyle = useCallback(async (input: WeddingStyleInput): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await updateStyleMutation({
        variables: {
          input,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.updateWeddingStyle?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating style:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, updateStyleMutation, refetch]);

  // Update colors only
  const updateColors = useCallback(async (
    primaryColor?: string,
    secondaryColor?: string,
    accentColor?: string,
    backgroundColor?: string,
    textColor?: string
  ): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await updateColorsMutation({
        variables: {
          accentColor,
          backgroundColor,
          primaryColor,
          secondaryColor,
          textColor,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.updateWeddingColors?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating colors:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, updateColorsMutation, refetch]);

  // Set hero image
  const setHeroImage = useCallback(async (
    imageUrl: string,
    overlayOpacity?: number
  ): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await setHeroImageMutation({
        variables: {
          imageUrl,
          overlayOpacity,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.setWeddingHeroImage?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting hero image:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, setHeroImageMutation, refetch]);

  // Update RSVP
  const updateRSVP = useCallback(async (input: RSVPConfigInput): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await updateRSVPMutation({
        variables: {
          input,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.updateWeddingRSVP?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating RSVP:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, updateRSVPMutation, refetch]);

  // Update section
  const updateSection = useCallback(async (input: UpdateSectionInput): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await updateSectionMutation({
        variables: {
          input,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.updateWeddingSection?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating section:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, updateSectionMutation, refetch]);

  // Toggle section
  const toggleSectionGraphQL = useCallback(async (
    section: WeddingSectionName,
    enabled: boolean
  ): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await toggleSectionMutation({
        variables: {
          enabled,
          section,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.toggleWeddingSection?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error toggling section:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, toggleSectionMutation, refetch]);

  // Reorder sections
  const reorderSectionsGraphQL = useCallback(async (
    input: ReorderSectionsInput
  ): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await reorderSectionsMutation({
        variables: {
          input,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.reorderWeddingSections?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error reordering sections:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, reorderSectionsMutation, refetch]);

  // Update venue
  const updateVenue = useCallback(async (input: VenueInfoInput): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await updateVenueMutation({
        variables: {
          input,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.updateWeddingVenue?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating venue:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, updateVenueMutation, refetch]);

  // Update our story
  const updateOurStory = useCallback(async (input: OurStoryInput): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await updateOurStoryMutation({
        variables: {
          input,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.updateWeddingOurStory?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating our story:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, updateOurStoryMutation, refetch]);

  // Publish
  const publish = useCallback(async (
    subdomain?: string
  ): Promise<{ publicUrl?: string, success: boolean; }> => {
    if (!weddingWeb) return { success: false };

    try {
      setIsSaving(true);
      const result = await publishMutation({
        variables: {
          subdomain,
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.publishWeddingWeb?.success) {
        await refetch();
        return {
          publicUrl: result.data.publishWeddingWeb.publicUrl || result.data.publishWeddingWeb.weddingWeb?.publicUrl,
          success: true,
        };
      }
      return { success: false };
    } catch (error) {
      console.error('Error publishing wedding:', error);
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, publishMutation, refetch]);

  // Unpublish
  const unpublish = useCallback(async (): Promise<boolean> => {
    if (!weddingWeb) return false;

    try {
      setIsSaving(true);
      const result = await unpublishMutation({
        variables: {
          weddingWebId: weddingWeb.weddingWebId,
        },
      });

      if (result.data?.unpublishWeddingWeb?.success) {
        await refetch();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unpublishing wedding:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [weddingWeb, unpublishMutation, refetch]);

  // Local updates (para compatibilidad con código existente)
  const updateCoupleLocal = useCallback((partner: 'partner1' | 'partner2', name: string) => {
    if (!localWedding) return;
    
    setLocalWedding((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        couple: {
          ...prev.couple,
          [partner]: { ...prev.couple[partner], name },
        },
      };
    });
    setIsDirty(true);
    onUpdate?.(localWedding);
  }, [localWedding, onUpdate]);

  const updatePalette = useCallback((palette: PaletteType) => {
    if (!localWedding || !weddingWeb) return;

    const template = mapPaletteToTemplate(palette);
    updateStyle({ template });
    
    setLocalWedding((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        style: { ...prev.style, palette },
      };
    });
    setIsDirty(true);
  }, [localWedding, weddingWeb, updateStyle]);

  const updateHero = useCallback((updates: Partial<WeddingWebData['hero']>) => {
    if (!localWedding) return;
    
    setLocalWedding((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hero: { ...prev.hero, ...updates },
      };
    });
    setIsDirty(true);
    onUpdate?.(localWedding);
  }, [localWedding, onUpdate]);

  const toggleSection = useCallback((type: SectionType, enabled: boolean) => {
    if (!localWedding || !weddingWeb) return;

    // Mapear SectionType a WeddingSectionName
    const sectionMap: Record<SectionType, WeddingSectionName> = {
      gallery: WeddingSectionName.GALLERY,
      hero: WeddingSectionName.HERO,
      info: WeddingSectionName.FAQ,
      location: WeddingSectionName.VENUE,
      registry: WeddingSectionName.GIFTS,
      rsvp: WeddingSectionName.RSVP,
      schedule: WeddingSectionName.TIMELINE,
    };

    const sectionName = sectionMap[type];
    if (sectionName) {
      toggleSectionGraphQL(sectionName, enabled);
    }

    setLocalWedding((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) =>
          section.type === type ? { ...section, enabled } : section
        ),
      };
    });
    setIsDirty(true);
  }, [localWedding, weddingWeb, toggleSectionGraphQL]);

  const applyAIChanges = useCallback((changes: Partial<WeddingWebData>) => {
    if (!localWedding) return;
    
    setLocalWedding((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...changes,
        couple: changes.couple ? { ...prev.couple, ...changes.couple } : prev.couple,
        date: changes.date ? { ...prev.date, ...changes.date } : prev.date,
        hero: changes.hero ? { ...prev.hero, ...changes.hero } : prev.hero,
        style: changes.style ? { ...prev.style, ...changes.style } : prev.style,
      };
    });
    setIsDirty(true);
    onUpdate?.(localWedding);
  }, [localWedding, onUpdate]);

  return {
    applyAIChanges,
    createWedding,
    error: error as Error | null,
    isDirty,
    isLoading: loading,
    isSaving,
    lastSaved,
    publish,
    refetch,
    reorderSections: reorderSectionsGraphQL,
    setHeroImage,
    toggleSection,
    toggleSectionGraphQL,
    unpublish,
    updateColors,
    updateCouple,
    updateCoupleLocal,
    updateHero,
    updateOurStory,
    updatePalette,
    updateRSVP,
    updateSection,
    updateStyle,
    updateVenue,
    updateWedding: async (input: any) => {
      if (!weddingWeb) return false;
      try {
        setIsSaving(true);
        const result = await updateWeddingMutation({
          variables: {
            input,
            weddingWebId: weddingWeb.weddingWebId,
          },
        });
        if (result.data?.updateWeddingWeb?.success) {
          await refetch();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error updating wedding:', error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    wedding,
    weddingWeb,
  };
}






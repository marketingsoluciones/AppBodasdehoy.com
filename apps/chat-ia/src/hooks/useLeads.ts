'use client';

import { useCallback } from 'react';
import { useChatStore } from '@/store/chat';

/**
 * Tipos para Leads API
 */
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface LeadContact {
  email?: string;
  name?: string;
  phone?: string;
}

export interface LeadQualifyingData {
  budget?: string;
  event_date?: string;
  event_type?: string;
  guest_count?: number;
  location?: string;
  services_needed?: string[];
}

export interface LeadNote {
  author: 'ai' | 'admin';
  created_at: string;
  text: string;
}

export interface Lead {
  contact: LeadContact;
  created_at: string;
  development: string;
  id: string;
  notes: LeadNote[];
  qualifying_data: LeadQualifyingData;
  session_id: string;
  source: string;
  status: LeadStatus;
  updated_at: string;
}

export interface SaveLeadRequest {
  contact?: LeadContact;
  development?: string;
  qualifying_data?: LeadQualifyingData;
  session_id: string;
  source?: string;
}

export interface LeadListResponse {
  leads: Lead[];
  page: number;
  success: boolean;
  total: number;
  total_pages: number;
}

export interface LeadListFilters {
  limit?: number;
  page?: number;
  search?: string;
  status?: LeadStatus;
}

/**
 * Hook para gestionar leads permanentes de visitantes.
 *
 * Sigue el patrón de useVisitorData.ts pero para almacenamiento permanente.
 * Los leads se guardan vía POST /api/leads/save al backend api-ia.
 */
export const useLeads = () => {
  const { development } = useChatStore((s) => ({
    development: s.development,
  }));

  const getBackendUrl = useCallback(() => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';
  }, []);

  /**
   * Guarda o actualiza un lead (upsert por session_id + development)
   */
  const saveLead = useCallback(
    async (data: SaveLeadRequest): Promise<Lead | null> => {
      try {
        const backendUrl = getBackendUrl();
        const sessionId = data.session_id || useChatStore.getState().activeExternalChatId || `guest-${Date.now()}`;
        const dev = data.development || development || 'bodasdehoy';

        const payload = {
          ...data,
          development: dev,
          session_id: sessionId,
          source: data.source || 'chatbot',
        };

        const response = await fetch(`${backendUrl}/api/leads/save`, {
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
            'X-Development': dev,
          },
          method: 'POST',
        });

        if (!response.ok) {
          console.error('[useLeads] Error guardando lead:', response.status, response.statusText);
          return null;
        }

        const result = await response.json();
        console.log('[useLeads] Lead guardado:', result);
        return result.lead || result.data || null;
      } catch (error) {
        console.error('[useLeads] Error en saveLead:', error);
        return null;
      }
    },
    [development, getBackendUrl],
  );

  /**
   * Obtiene lista paginada de leads con filtros
   */
  const getLeads = useCallback(
    async (filters?: LeadListFilters): Promise<LeadListResponse | null> => {
      try {
        const backendUrl = getBackendUrl();
        const dev = development || 'bodasdehoy';
        const params = new URLSearchParams({ development: dev });

        if (filters?.status) params.set('status', filters.status);
        if (filters?.search) params.set('search', filters.search);
        if (filters?.page) params.set('page', String(filters.page));
        if (filters?.limit) params.set('limit', String(filters.limit));

        const response = await fetch(`${backendUrl}/api/leads/list?${params}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Development': dev,
          },
          method: 'GET',
        });

        if (!response.ok) {
          console.error('[useLeads] Error obteniendo leads:', response.status);
          return null;
        }

        return await response.json();
      } catch (error) {
        console.error('[useLeads] Error en getLeads:', error);
        return null;
      }
    },
    [development, getBackendUrl],
  );

  /**
   * Obtiene detalle de un lead
   */
  const getLead = useCallback(
    async (leadId: string): Promise<Lead | null> => {
      try {
        const backendUrl = getBackendUrl();
        const dev = development || 'bodasdehoy';

        const response = await fetch(`${backendUrl}/api/leads/${leadId}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Development': dev,
          },
          method: 'GET',
        });

        if (!response.ok) {
          console.error('[useLeads] Error obteniendo lead:', response.status);
          return null;
        }

        const result = await response.json();
        return result.lead || result.data || null;
      } catch (error) {
        console.error('[useLeads] Error en getLead:', error);
        return null;
      }
    },
    [development, getBackendUrl],
  );

  /**
   * Cambia el status de un lead
   */
  const updateLeadStatus = useCallback(
    async (leadId: string, status: LeadStatus): Promise<boolean> => {
      try {
        const backendUrl = getBackendUrl();
        const dev = development || 'bodasdehoy';

        const response = await fetch(`${backendUrl}/api/leads/${leadId}/status`, {
          body: JSON.stringify({ status }),
          headers: {
            'Content-Type': 'application/json',
            'X-Development': dev,
          },
          method: 'PUT',
        });

        if (!response.ok) {
          console.error('[useLeads] Error actualizando status:', response.status);
          return false;
        }

        return true;
      } catch (error) {
        console.error('[useLeads] Error en updateLeadStatus:', error);
        return false;
      }
    },
    [development, getBackendUrl],
  );

  /**
   * Agrega una nota a un lead
   */
  const addLeadNote = useCallback(
    async (leadId: string, text: string, author: 'ai' | 'admin' = 'admin'): Promise<boolean> => {
      try {
        const backendUrl = getBackendUrl();
        const dev = development || 'bodasdehoy';

        const response = await fetch(`${backendUrl}/api/leads/${leadId}/notes`, {
          body: JSON.stringify({ author, text }),
          headers: {
            'Content-Type': 'application/json',
            'X-Development': dev,
          },
          method: 'PUT',
        });

        if (!response.ok) {
          console.error('[useLeads] Error agregando nota:', response.status);
          return false;
        }

        return true;
      } catch (error) {
        console.error('[useLeads] Error en addLeadNote:', error);
        return false;
      }
    },
    [development, getBackendUrl],
  );

  /**
   * Elimina un lead
   */
  const deleteLead = useCallback(
    async (leadId: string): Promise<boolean> => {
      try {
        const backendUrl = getBackendUrl();
        const dev = development || 'bodasdehoy';

        const response = await fetch(`${backendUrl}/api/leads/${leadId}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Development': dev,
          },
          method: 'DELETE',
        });

        if (!response.ok) {
          console.error('[useLeads] Error eliminando lead:', response.status);
          return false;
        }

        return true;
      } catch (error) {
        console.error('[useLeads] Error en deleteLead:', error);
        return false;
      }
    },
    [development, getBackendUrl],
  );

  return {
    addLeadNote,
    deleteLead,
    getLead,
    getLeads,
    saveLead,
    updateLeadStatus,
  };
};

export default useLeads;

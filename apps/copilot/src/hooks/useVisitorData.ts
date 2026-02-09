'use client';

import { useCallback } from 'react';
import { useChatStore } from '@/store/chat';

/**
 * Tipos para Visitor Data API
 */
export interface VisitorDataRequest {
  development?: string;
  intent?: string;
  metadata?: Record<string, any>;
  partial_event_data?: {
    descripcion?: string;
    fecha?: string;
    nombre?: string;
    pais?: string;
    poblacion?: string;
    tipo?: string;
  };
  session_id: string;
  user_info?: {
    email?: string;
    nombre?: string;
    phone?: string;
  };
}

export interface VisitorDataResponse {
  data_saved?: any;
  message: string;
  session_id: string;
  success: boolean;
}

export interface VisitorData {
  created_at?: string;
  development?: string;
  expires_at?: string;
  intent?: string;
  metadata?: Record<string, any>;
  partial_event_data?: Record<string, any>;
  session_id: string;
  updated_at?: string;
  user_info?: Record<string, any>;
}

/**
 * Hook para gestionar datos de visitantes no registrados
 * 
 * Permite:
 * - Guardar datos parciales cuando un visitante intenta crear un evento
 * - Recuperar datos guardados
 * - Migrar datos a usuario registrado después del registro
 */
export const useVisitorData = () => {
  const { development } = useChatStore((s) => ({
    development: s.development,
  }));

  const getBackendUrl = useCallback(() => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';
  }, []);

  /**
   * Guarda datos de visitante en el backend
   */
  const saveVisitorData = useCallback(
    async (data: VisitorDataRequest): Promise<VisitorDataResponse | null> => {
      try {
        const backendUrl = getBackendUrl();
        const sessionId = data.session_id || useChatStore.getState().activeExternalChatId || `guest-${Date.now()}`;

        const payload: VisitorDataRequest = {
          ...data,
          development: data.development || development || 'bodasdehoy',
          session_id: sessionId,
        };

        const response = await fetch(`${backendUrl}/api/visitor-data/save`, {
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
            'X-Development': payload.development || 'bodasdehoy',
          },
          method: 'POST',
        });

        if (!response.ok) {
          console.error('Error guardando datos de visitante:', response.status, response.statusText);
          return null;
        }

        const result: VisitorDataResponse = await response.json();
        console.log('✅ Datos de visitante guardados:', result);

        // Guardar session_id en localStorage para recuperación posterior
        if (typeof window !== 'undefined' && result.success) {
          localStorage.setItem('guest-session-id', sessionId);
        }

        return result;
      } catch (error) {
        console.error('Error en saveVisitorData:', error);
        return null;
      }
    },
    [development, getBackendUrl],
  );

  /**
   * Obtiene datos guardados de un visitante
   */
  const getVisitorData = useCallback(
    async (sessionId?: string): Promise<VisitorData | null> => {
      try {
        const backendUrl = getBackendUrl();
        const sid = sessionId || localStorage.getItem('guest-session-id') || useChatStore.getState().activeExternalChatId;

        if (!sid) {
          console.warn('⚠️ No hay session_id para obtener datos de visitante');
          return null;
        }

        const response = await fetch(`${backendUrl}/api/visitor-data/get/${sid}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Development': development || 'bodasdehoy',
          },
          method: 'GET',
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log('ℹ️ No se encontraron datos de visitante para esta sesión');
            return null;
          }
          console.error('Error obteniendo datos de visitante:', response.status);
          return null;
        }

        const result = await response.json();
        if (result.success && result.data) {
          return result.data as VisitorData;
        }

        return null;
      } catch (error) {
        console.error('Error en getVisitorData:', error);
        return null;
      }
    },
    [development, getBackendUrl],
  );

  /**
   * Migra datos de visitante a usuario registrado
   * Se llama después del registro para recuperar datos guardados
   */
  const migrateVisitorData = useCallback(
    async (userId: string, sessionId?: string): Promise<VisitorData | null> => {
      try {
        const backendUrl = getBackendUrl();
        const sid = sessionId || localStorage.getItem('guest-session-id');

        if (!sid) {
          console.log('ℹ️ No hay session_id para migrar datos de visitante');
          return null;
        }

        const response = await fetch(`${backendUrl}/api/visitor-data/migrate/${sid}/${userId}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Development': development || 'bodasdehoy',
          },
          method: 'GET',
        });

        if (!response.ok) {
          console.error('Error migrando datos de visitante:', response.status);
          return null;
        }

        const result = await response.json();
        if (result.success && result.data) {
          // Limpiar session_id de localStorage después de migrar
          if (typeof window !== 'undefined') {
            localStorage.removeItem('guest-session-id');
          }

          console.log('✅ Datos de visitante migrados a usuario:', result.data);
          return result.data as VisitorData;
        }

        return null;
      } catch (error) {
        console.error('Error en migrateVisitorData:', error);
        return null;
      }
    },
    [development, getBackendUrl],
  );

  /**
   * Elimina datos de visitante (después de migrar o si ya no son necesarios)
   */
  const deleteVisitorData = useCallback(
    async (sessionId?: string): Promise<boolean> => {
      try {
        const backendUrl = getBackendUrl();
        const sid = sessionId || localStorage.getItem('guest-session-id');

        if (!sid) {
          return false;
        }

        const response = await fetch(`${backendUrl}/api/visitor-data/delete/${sid}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Development': development || 'bodasdehoy',
          },
          method: 'DELETE',
        });

        if (!response.ok) {
          console.error('Error eliminando datos de visitante:', response.status);
          return false;
        }

        // Limpiar session_id de localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('guest-session-id');
        }

        return true;
      } catch (error) {
        console.error('Error en deleteVisitorData:', error);
        return false;
      }
    },
    [development, getBackendUrl],
  );

  /**
   * Obtiene el session_id guardado en localStorage
   */
  const getStoredSessionId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('guest-session-id');
  }, []);

  return {
    deleteVisitorData,
    getStoredSessionId,
    getVisitorData,
    migrateVisitorData,
    saveVisitorData,
  };
};

export default useVisitorData;







































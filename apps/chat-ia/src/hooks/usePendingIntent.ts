'use client';

import { useCallback, useEffect, useState } from 'react';
import { useChatStore } from '@/store/chat';

/**
 * Estructura de una intención pendiente
 * Guarda el mensaje que el usuario intentó enviar antes de iniciar sesión
 */
export interface PendingIntent {
  development?: string;
  message: string;
  metadata?: Record<string, any>;
  sessionId?: string;
  timestamp: number;
}

const STORAGE_KEY = 'pending_intent';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutos máximo

/**
 * Hook para manejar intenciones pendientes antes del login
 * Permite guardar un mensaje y recuperarlo después del login
 */
export function usePendingIntent() {
  const [pendingIntent, setPendingIntent] = useState<PendingIntent | null>(null);
  const [hasJwtToken, setHasJwtToken] = useState(false);
  const { currentUserId, userType, development } = useChatStore((s) => ({
    currentUserId: s.currentUserId,
    development: s.development,
    userType: s.userType,
  }));

  // ✅ MEJORADO: Verificar JWT token en localStorage (más confiable que solo el store)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkToken = () => {
      const jwtToken = localStorage.getItem('jwt_token') || localStorage.getItem('api2_jwt_token');
      const devConfig = localStorage.getItem('dev-user-config');

      let hasToken = !!(jwtToken && jwtToken !== 'null' && jwtToken !== 'undefined');

      // También verificar token en dev-user-config
      if (!hasToken && devConfig) {
        try {
          const parsed = JSON.parse(devConfig);
          hasToken = !!(parsed.token && parsed.token !== 'null');
        } catch {
          // Ignorar errores de parsing
        }
      }

      setHasJwtToken(hasToken);
    };

    // Verificar inmediatamente
    checkToken();

    // También verificar cuando cambie el storage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jwt_token' || e.key === 'api2_jwt_token' || e.key === 'dev-user-config') {
        checkToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Verificar periódicamente (para detectar cambios dentro de la misma pestaña)
    const interval = setInterval(checkToken, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // ✅ MEJORADO: Verificar autenticación usando múltiples fuentes
  // El usuario está autenticado si:
  // 1. Tiene un currentUserId válido (no guest/visitante), O
  // 2. Tiene un JWT token válido en localStorage
  const isAuthenticated = hasJwtToken || (
    currentUserId &&
    currentUserId !== 'visitante@guest.local' &&
    currentUserId !== 'guest' &&
    currentUserId !== 'anonymous' &&
    userType !== 'guest'
  );

  /**
   * Guardar intención pendiente antes del login
   */
  const savePendingIntent = useCallback((message: string, metadata?: Record<string, any>) => {
    const intent: PendingIntent = {
      development: development || 'bodasdehoy',
      message,
      metadata,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
      setPendingIntent(intent);
      console.log('💾 Intención pendiente guardada:', message.slice(0, 50) + '...');
    } catch (e) {
      console.warn('⚠️ Error guardando intención pendiente:', e);
    }
  }, [development]);

  /**
   * Recuperar intención pendiente
   */
  const loadPendingIntent = useCallback((): PendingIntent | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const intent: PendingIntent = JSON.parse(stored);

      // Verificar que no haya expirado (30 minutos máximo)
      if (Date.now() - intent.timestamp > MAX_AGE_MS) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return intent;
    } catch (e) {
      console.warn('⚠️ Error cargando intención pendiente:', e);
      return null;
    }
  }, []);

  /**
   * Limpiar intención pendiente
   */
  const clearPendingIntent = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setPendingIntent(null);
      console.log('🗑️ Intención pendiente limpiada');
    } catch (e) {
      console.warn('⚠️ Error limpiando intención pendiente:', e);
    }
  }, []);

  /**
   * Verificar si hay intención pendiente después del login
   */
  useEffect(() => {
    console.log('🔍 [usePendingIntent] Verificando estado:', {
      currentUserId: currentUserId?.slice(0, 20),
      hasJwtToken,
      hasPendingIntentInStorage: !!localStorage.getItem(STORAGE_KEY),
      isAuthenticated,
      userType,
    });

    if (isAuthenticated) {
      const intent = loadPendingIntent();
      if (intent) {
        setPendingIntent(intent);
        console.log('📋 [usePendingIntent] Intención pendiente detectada después del login:', intent.message.slice(0, 50) + '...');
      } else {
        console.log('ℹ️ [usePendingIntent] Usuario autenticado pero sin intención pendiente');
      }
    }
  }, [isAuthenticated, hasJwtToken, currentUserId, userType, loadPendingIntent]);

  return {
    clearPendingIntent,
    hasPendingIntent: !!pendingIntent,
    isAuthenticated,
    loadPendingIntent,
    pendingIntent,
    savePendingIntent,
  };
}

/**
 * Generar un título de conversación basado en el primer mensaje
 * Extrae las palabras clave principales del mensaje
 */
export function generateConversationTitle(message: string): string {
  // Limpiar el mensaje
  const cleanMessage = message
    .replaceAll(/[!,.:;?¡¿]/g, '')
    .trim()
    .toLowerCase();

  // Si el mensaje es muy corto, usarlo directamente
  if (cleanMessage.length <= 30) {
    return capitalize(cleanMessage);
  }

  // Palabras clave para detectar intención
  const intents: Record<string, string[]> = {
    'Boda de': ['boda', 'casamiento', 'matrimonio', 'novia', 'novio'],
    'Consulta sobre': ['consultar', 'preguntar', 'información', 'ayuda', 'cómo'],
    'Crear evento': ['crear', 'nuevo', 'organizar', 'planear', 'planificar'],
    'Cumpleaños de': ['cumpleaños', 'cumple', 'aniversario'],
    'Evento corporativo': ['corporativo', 'empresa', 'reunión', 'conferencia', 'seminario'],
    'Invitados de': ['invitados', 'invitado', 'lista', 'confirmación', 'rsvp'],
    'Presupuesto de': ['presupuesto', 'costo', 'precio', 'gasto'],
    'Proveedor de': ['proveedor', 'catering', 'música', 'decoración', 'flores'],
  };

  // Buscar coincidencias
  for (const [title, keywords] of Object.entries(intents)) {
    if (keywords.some(kw => cleanMessage.includes(kw))) {
      // Extraer nombre si hay patrones como "de X y Y" o "de X"
      const nameMatch = cleanMessage.match(/(?:de|para)\s+([a-záéíñóú]+)(?:\s+y\s+([a-záéíñóú]+))?/i);
      if (nameMatch) {
        const name1 = capitalize(nameMatch[1]);
        const name2 = nameMatch[2] ? ' y ' + capitalize(nameMatch[2]) : '';
        return `${title} ${name1}${name2}`;
      }
      return title;
    }
  }

  // Si no hay coincidencias, usar las primeras palabras significativas
  const words = cleanMessage.split(' ').filter(w => w.length > 3);
  const titleWords = words.slice(0, 4).join(' ');
  return capitalize(titleWords || cleanMessage.slice(0, 30)) + '...';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

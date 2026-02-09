'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, useRef } from 'react';

import { message } from '@/components/AntdStaticMethods';
import { getDeveloperToken, setDeveloperToken } from '@/const/developerTokens';
import { consumeInviteToken } from '@/services/api2/invite';
import { processGoogleRedirectResult, processFacebookRedirectResult } from '@/services/firebase-auth';
import { useChatStore } from '@/store/chat';

// ✅ OPTIMIZACIÓN: Solo loguear en desarrollo
const isDev = process.env.NODE_ENV === 'development';
const devLog = (...args: any[]): void => {
  if (isDev) console.log(...args);
};
const devWarn = (...args: any[]): void => {
  if (isDev) console.warn(...args);
};

/**
 * Componente de extensión para auto-identificación de usuarios
 * NO modifica el core de LobeChat
 *
 * Funcionalidad:
 * - Sin parámetros: Identifica como visitante
 * - Con developer + email/phone: Valida usuario y configura
 * - Muestra notificación cuando el usuario se registra
 */

// ✅ SOLUCIÓN: Usar dynamic import con ssr: false para evitar error de useSearchParams durante static generation
// Este componente solo se ejecuta en el cliente
// eslint-disable-next-line @typescript-eslint/no-use-before-define
const EventosAutoAuthInner = dynamic(() => Promise.resolve(EventosAutoAuthComponent), {
  ssr: false,
});

// ✅ Exportar el componente dinámico (no renderiza en servidor)
export function EventosAutoAuth() {
  return <EventosAutoAuthInner />;
}

function EventosAutoAuthComponent() {
  const searchParams = useSearchParams();
  const { setExternalChatConfig, currentUserId } = useChatStore();
  const [lastIdentifiedUserId, setLastIdentifiedUserId] = useState<string | null>(null);
  const [isInParentIframe, setIsInParentIframe] = useState(false);
  const [receivedAuthFromParent, setReceivedAuthFromParent] = useState(false);

  // ✅ CORRECCIÓN: Refs para evitar llamadas duplicadas de autenticación
  const identifyInProgressRef = useRef(false);
  const hasIdentifiedRef = useRef(false);
  const lastIdentifyAttemptRef = useRef<number>(0);

  // ✅ NUEVO: Detectar si estamos en un iframe del parent (AppBodasdeHoy)
  // y escuchar AUTH_CONFIG del parent
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const inIframe = window.parent !== window;
    setIsInParentIframe(inIframe);

    if (!inIframe) return;

    devLog('[EventosAutoAuth] Detectado en iframe, esperando AUTH_CONFIG del parent...');

    const handleMessage = (event: MessageEvent) => {
      const { type, source, payload } = event.data || {};

      // Solo procesar mensajes del parent (app-bodas)
      if (source !== 'app-bodas') return;

      if (type === 'AUTH_CONFIG' && payload) {
        devLog('[EventosAutoAuth] 🔓 Recibido AUTH_CONFIG del parent:', {
          development: payload.development,
          hasToken: !!payload.token,
          userId: payload.userId,
        });

        // Usar la autenticación del parent directamente
        if (payload.userId && setExternalChatConfig) {
          setExternalChatConfig(
            payload.userId,
            payload.development || 'bodasdehoy',
            payload.token || undefined,
            'registered',
            undefined,
            payload.userData
          );

          setReceivedAuthFromParent(true);
          // Bienvenida se maneja desde ChatHydration para evitar duplicados

          // Guardar en localStorage para persistencia
          localStorage.setItem('dev-user-config', JSON.stringify({
            developer: payload.development,
            development: payload.development,
            source: 'parent_iframe',
            timestamp: Date.now(),
            token: payload.token,
            userId: payload.userId,
            user_data: payload.userData,
            user_type: 'registered',
          }));
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Solicitar autenticación al parent después de un delay
    const timer = setTimeout(() => {
      if (!receivedAuthFromParent) {
        devLog('[EventosAutoAuth] Solicitando AUTH_CONFIG al parent...');
        window.parent.postMessage({
          payload: { reason: 'eventos_auto_auth' },
          source: 'copilot-chat',
          timestamp: Date.now(),
          type: 'AUTH_REQUEST',
        }, '*');
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', handleMessage);
    };
  }, [setExternalChatConfig, receivedAuthFromParent]);

  // ✅ NUEVO: Procesar redirect result de Google/Facebook al cargar
  useEffect(() => {
    const processRedirectResult = async () => {
      try {
        // Solo procesar si no estamos en dev-login (allí se maneja manualmente)
        if (typeof window !== 'undefined' && window.location.pathname === '/dev-login') {
          return;
        }

        // Esperar un poco para asegurar que Firebase esté listo
        await new Promise(resolve => setTimeout(resolve, 500));

        // Intentar procesar redirect de Google
        const googleResult = await processGoogleRedirectResult('bodasdehoy');
        if (googleResult?.success) {
          console.log('✅ Login con Google completado (redirect)');
          message.success('¡Inicio de sesión exitoso con Google!');
          
          // Configurar usuario en el store
          if (googleResult.user) {
            await setExternalChatConfig(
              googleResult.user.email || googleResult.user_id || '',
              googleResult.development || 'bodasdehoy',
              googleResult.token,
              'registered',
              undefined,
              googleResult.user
            );
          }
          return;
        }

        // Intentar procesar redirect de Facebook
        const facebookResult = await processFacebookRedirectResult('bodasdehoy');
        if (facebookResult?.success) {
          console.log('✅ Login con Facebook completado (redirect)');
          message.success('¡Inicio de sesión exitoso con Facebook!');
          
          // Configurar usuario en el store
          if (facebookResult.user) {
            await setExternalChatConfig(
              facebookResult.user.email || facebookResult.user_id || '',
              facebookResult.development || 'bodasdehoy',
              facebookResult.token,
              'registered',
              undefined,
              facebookResult.user
            );
          }
        }
      } catch (error: any) {
        // Solo loguear errores, no mostrar notificación (puede ser que no haya redirect)
        if (error.message && !error.message.includes('No redirect result')) {
          console.warn('⚠️ Error procesando redirect result:', error.message);
        }
      }
    };

    processRedirectResult();
  }, [setExternalChatConfig]);

  // ✅ CORRECCIÓN: Leer parámetros directamente de window.location para asegurar que se detecten
  // useSearchParams puede no estar disponible inmediatamente en algunos contextos
  const developerParam = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get('developer') || searchParams?.get('developer') || null;
    // ✅ CORRECCIÓN: Reducir logging - solo loguear una vez por cambio
    // if (param) devLog(`🔍 developerParam detectado desde URL: ${param}`);
    return param;
  }, [searchParams]);

  const emailParam = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('email') || searchParams?.get('email') || null;
  }, [searchParams]);

  const phoneParam = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('phone') || searchParams?.get('phone') || null;
  }, [searchParams]);

  const inviteTokenParam = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return (
      urlParams.get('token') ||
      urlParams.get('invite_token') ||
      searchParams?.get('token') ||
      searchParams?.get('invite_token') ||
      null
    );
  }, [searchParams]);

  // ✅ NOTA: useEffect para procesar redirect de Google/Facebook ya existe arriba (líneas 131-190)
  // Se eliminó el duplicado que estaba aquí para evitar llamadas dobles

  useEffect(() => {
    // No ejecutar en la página de dev-login (dejar que el usuario configure manualmente)
    if (typeof window !== 'undefined' && window.location.pathname === '/dev-login') {
      return;
    }

    // ✅ CORRECCIÓN: Si ya se identificó exitosamente, no volver a ejecutar
    if (hasIdentifiedRef.current && currentUserId && currentUserId !== 'visitante@guest.local') {
      devLog('[EventosAutoAuth] Ya identificado, saltando ejecución');
      return;
    }

    // ✅ NUEVO: Si estamos en iframe del parent y ya recibimos auth, no ejecutar identificación
    if (isInParentIframe && receivedAuthFromParent) {
      devLog('[EventosAutoAuth] Ya autenticado via parent iframe, saltando identifyAndConfigure');
      return;
    }

    // ✅ NUEVO: Si estamos en iframe, esperar un poco más para dar tiempo a recibir AUTH_CONFIG
    if (isInParentIframe) {
      devLog('[EventosAutoAuth] En iframe, esperando posible AUTH_CONFIG del parent...');
      // ✅ CORRECCIÓN: Aumentado de 1.5s a 3s para dar más tiempo en desarrollo
      const timer = setTimeout(() => {
        if (!receivedAuthFromParent && !hasIdentifiedRef.current) {
          devLog('[EventosAutoAuth] No se recibió AUTH_CONFIG, procediendo con identificación normal...');
          identifyAndConfigure().catch((error) => {
            console.error('Error en identifyAndConfigure:', error);
          });
        }
      }, 3000); // ✅ Aumentado: Esperar 3 segundos para AUTH_CONFIG
      return () => clearTimeout(timer);
    }

    // ✅ OPTIMIZACIÓN: Diferir ejecución para no bloquear renderizado inicial
    // Usar requestIdleCallback si está disponible, sino setTimeout
    const deferExecution = (callback: () => void) => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 100 });
      } else {
        setTimeout(callback, 0);
      }
    };

    // ✅ Ejecutar en segundo plano después de que la UI se renderice
    deferExecution(() => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      identifyAndConfigure().catch((error) => {
        console.error('Error en identifyAndConfigure:', error);
      });
    });

    async function identifyAndConfigure() {
      // ✅ CORRECCIÓN: Debouncing - evitar llamadas duplicadas
      const now = Date.now();
      if (identifyInProgressRef.current) {
        devLog('[EventosAutoAuth] Identificación ya en progreso, saltando');
        return;
      }
      if (now - lastIdentifyAttemptRef.current < 2000) {
        devLog('[EventosAutoAuth] Llamada muy reciente (< 2s), saltando');
        return;
      }

      identifyInProgressRef.current = true;
      lastIdentifyAttemptRef.current = now;

      try {
      // ✅ Variables globales para el scope de la función
      let developer: string;
      let email: string | undefined;
      let phone: string | undefined;
      let savedConfig: any = null;

      // ✅ PRIORIDAD ABSOLUTA 1: Query parameter ?developer=xxx (tiene máxima prioridad)
      if (developerParam) {
        devLog(`🎯 Query parameter detectado: developer=${developerParam} (máxima prioridad)`);
        developer = developerParam;

        // ✅ Leer localStorage para verificar si hay sesión guardada
        try {
          const savedConfigStr = localStorage.getItem('dev-user-config');
          if (savedConfigStr) {
            savedConfig = JSON.parse(savedConfigStr);
          }
        } catch (e) {
          devWarn('⚠️ Error leyendo localStorage:', e);
        }

        // ✅ Si hay email o phone en la URL, NO cargar desde localStorage, usar identificación
        if (emailParam || phoneParam) {
          devLog(
            `📧 Email/Phone en URL detectado, identificando usuario: ${emailParam || phoneParam}`,
          );
          email = emailParam || undefined;
          phone = phoneParam || undefined;

          // ✅ CRÍTICO: Si hay email/phone en URL, limpiar savedConfig y localStorage para forzar identificación
          // Esto asegura que no se use información guardada de otro usuario
          devLog(`🔄 Limpiando savedConfig y localStorage para forzar identificación desde URL...`);
          savedConfig = null; // ✅ Limpiar savedConfig para que no interfiera

          // Limpiar localStorage si contiene un usuario diferente
          try {
            const storedConfigStr = localStorage.getItem('dev-user-config');
            if (storedConfigStr) {
              const storedConfig = JSON.parse(storedConfigStr);
              const storedUserId = storedConfig?.userId;
              const targetUserId = emailParam || phoneParam;

              if (storedUserId && storedUserId !== targetUserId) {
                devLog(
                  `🗑️ Limpiando localStorage: usuario guardado (${storedUserId}) ≠ usuario en URL (${targetUserId})`,
                );
                localStorage.removeItem('dev-user-config');
                localStorage.removeItem('jwt_token');
              }
            }
          } catch (e) {
            devWarn('⚠️ Error limpiando localStorage:', e);
          }

          // ✅ CRÍTICO: Si hay email/phone en URL y currentUserId es diferente, limpiar primero
          // Esto fuerza a que se identifique al nuevo usuario
          if (currentUserId && currentUserId !== (emailParam || phoneParam)) {
            devLog(
              `🔄 Email/Phone en URL (${emailParam || phoneParam}) ≠ currentUserId (${currentUserId}), limpiando store...`,
            );

            // Limpiar el store temporalmente para forzar identificación
            try {
              await setExternalChatConfig(
                'visitante@guest.local', // Usuario temporal
                developer,
                undefined,
                'guest',
                undefined,
                undefined,
              );
              devLog('✅ Store limpiado temporalmente, procediendo con identificación');
            } catch (error) {
              devWarn('⚠️ Error limpiando store, continuando:', error);
            }
          }

          // Continuar con identificación (no cargar desde localStorage)
        } else {
          // ✅ Si NO hay email/phone en URL, intentar cargar desde localStorage
          const savedDeveloper = savedConfig?.developer || savedConfig?.development;

          // Si hay sesión guardada para este developer, cargarla automáticamente
          if (savedConfig?.userId && savedDeveloper === developerParam) {
            devLog(
              `✅ Sesión encontrada para developer ${developerParam}, cargando usuario: ${savedConfig.userId.slice(0, 20)}...`,
            );

            try {
              await setExternalChatConfig(
                savedConfig.userId,
                developerParam,
                savedConfig.token || undefined,
                savedConfig.user_type || 'guest',
                savedConfig.role,
                savedConfig.user_data,
              );

              devLog('✅ Sesión cargada automáticamente desde localStorage');

              if (savedConfig.token) {
                localStorage.setItem('jwt_token', savedConfig.token);
              }

              // ✅ NUEVO: Restaurar chat activo si existe
              if (savedConfig.activeExternalChatId) {
                const { selectExternalChat } = useChatStore.getState();
                selectExternalChat(savedConfig.activeExternalChatId);
                devLog('💬 Chat activo restaurado:', savedConfig.activeExternalChatId);
              }

              // Actualizar localStorage con el developer correcto
              const updatedConfig = {
                ...savedConfig,
                developer: developerParam,
                development: developerParam,
                timestamp: Date.now(),
              };
              localStorage.setItem('dev-user-config', JSON.stringify(updatedConfig));

              // ✅ NUEVO: También establecer cookie HTTP para autenticación del servidor
              const cookieValue = encodeURIComponent(JSON.stringify(updatedConfig));
              // eslint-disable-next-line unicorn/no-document-cookie
              document.cookie = `dev-user-config=${cookieValue}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
              devLog('🍪 Cookie dev-user-config restaurada');

              return; // No continuar con identificación
            } catch (error) {
              devWarn(
                '⚠️ Error cargando sesión desde localStorage, continuando con identificación:',
                error,
              );
            }
          }

          // Si no hay sesión guardada, usar email/phone de savedConfig si existe
          email =
            savedConfig?.userId && savedConfig.userId.includes('@')
              ? savedConfig.userId
              : undefined;
          phone =
            savedConfig?.userId && !savedConfig.userId.includes('@')
              ? savedConfig.userId
              : undefined;
        }
      } else {
        // ✅ Si NO hay query parameter, usar detección automática
        // ✅ OPTIMIZACIÓN: Detectar developer desde el dominio (con cache en sessionStorage)
        let detectedDeveloper: string | null = null;
        try {
          // ✅ Primero verificar cache en sessionStorage (no cambia durante la sesión)
          const cachedDeveloper = sessionStorage.getItem('detected-developer');
          if (cachedDeveloper) {
            detectedDeveloper = cachedDeveloper;
            devLog('🚀 Developer cargado desde cache:', detectedDeveloper);
          } else {
            const response = await fetch('/api/config/current-developer');
            if (response.ok) {
              const data = await response.json();
              detectedDeveloper = data.developer;
              // ✅ Guardar en sessionStorage para evitar llamadas repetidas
              sessionStorage.setItem('detected-developer', detectedDeveloper || '');
              devLog('🌐 Developer detectado desde hostname:', detectedDeveloper);
            }
          }
        } catch (e) {
          devWarn('⚠️ Error detectando developer desde hostname:', e);
        }

        // ✅ PRIORIDAD 1: Recuperar información desde localStorage (desde login previo)
        // ✅ NOTA: savedConfig ya está declarado al inicio de la función
        if (!savedConfig) {
          try {
            const savedConfigStr = localStorage.getItem('dev-user-config');
            if (savedConfigStr) {
              savedConfig = JSON.parse(savedConfigStr);
              devLog('💾 Config encontrada en localStorage:', {
                developer: savedConfig.developer,
                timestamp: savedConfig.timestamp,
                userId: savedConfig.userId?.slice(0, 20),
              });
            }
          } catch (e) {
            devWarn('⚠️ Error leyendo localStorage:', e);
          }
        }

        // ✅ SINCRONIZACIÓN: Si el developer cambió (cambio de dominio), actualizar
        if (
          detectedDeveloper &&
          savedConfig?.developer &&
          detectedDeveloper !== savedConfig.developer
        ) {
          devLog(`🔄 Developer cambió: ${savedConfig.developer} → ${detectedDeveloper}`);

          // Actualizar localStorage con el nuevo developer
          savedConfig.developer = detectedDeveloper;
          savedConfig.development = detectedDeveloper;
          savedConfig.timestamp = Date.now();

          try {
            localStorage.setItem('dev-user-config', JSON.stringify(savedConfig));
            devLog('✅ localStorage actualizado con nuevo developer');
          } catch (e) {
            devWarn('⚠️ Error actualizando localStorage:', e);
          }
        }

        // ✅ PRIORIDAD 2: Parámetros de URL, con fallback a developer detectado
        const finalDeveloper =
          detectedDeveloper || savedConfig?.developer || savedConfig?.development || 'bodasdehoy';
        developer = finalDeveloper;

        // ✅ NUEVO: Si hay sesión guardada para este developer, cargarla automáticamente
        const savedDeveloper = savedConfig?.developer || savedConfig?.development;
        if (savedConfig?.userId && savedDeveloper === developer && !emailParam && !phoneParam) {
          devLog(
            `✅ Sesión encontrada para developer ${developer}, cargando usuario: ${savedConfig.userId.slice(0, 20)}...`,
          );

          try {
            await setExternalChatConfig(
              savedConfig.userId,
              developer,
              savedConfig.token || undefined,
              savedConfig.user_type || 'guest',
              savedConfig.role,
              savedConfig.user_data,
            );

            devLog('✅ Sesión cargada automáticamente desde localStorage');

            if (savedConfig.token) {
              localStorage.setItem('jwt_token', savedConfig.token);
            }

            // ✅ NUEVO: Restaurar chat activo si existe
            if (savedConfig.activeExternalChatId) {
              const { selectExternalChat } = useChatStore.getState();
              selectExternalChat(savedConfig.activeExternalChatId);
              devLog('💬 Chat activo restaurado:', savedConfig.activeExternalChatId);
            }

            localStorage.setItem(
              'dev-user-config',
              JSON.stringify({
                ...savedConfig,
                developer: developer,
                development: developer,
                timestamp: Date.now(),
              }),
            );

            return;
          } catch (error) {
            devWarn(
              '⚠️ Error cargando sesión desde localStorage, continuando con identificación:',
              error,
            );
          }
        }

        email =
          emailParam ||
          (savedConfig?.userId && savedConfig.userId.includes('@') && savedDeveloper === developer
            ? savedConfig.userId
            : undefined);
        phone =
          phoneParam ||
          (savedConfig?.userId && !savedConfig.userId.includes('@') && savedDeveloper === developer
            ? savedConfig.userId
            : undefined);
      }

      // ✅ CARGAR TOKEN JWT AUTOMÁTICAMENTE PARA DESARROLLO
      // Esto debe ejecutarse SIEMPRE para asegurar que hay un token válido
      devLog('🔍 EventosAutoAuth: Verificando token JWT', { developer });

      if (typeof window !== 'undefined') {
        const currentToken = localStorage.getItem('jwt_token');
        const developerToken = getDeveloperToken(developer);

        devLog('🔍 Estado de tokens:', {
          developer,
          tieneTokenActual: !!currentToken,
          tieneTokenDeveloper: !!developerToken,
        });

        // Si no hay token actual O el developer token existe y es diferente, cargarlo
        if (!currentToken || (developerToken && currentToken !== developerToken)) {
          if (developerToken) {
            setDeveloperToken(developer, developerToken);
            devLog(`✅ Token JWT cargado automáticamente para ${developer}`);
            devLog(`🔑 Token guardado en localStorage.jwt_token`);
          } else {
            devWarn(`⚠️ No se encontró token predefinido para: ${developer}`);
          }
        } else if (currentToken && !developerToken) {
          devLog(`ℹ️ Token JWT personalizado detectado (no predefinido)`);
        } else {
          devLog(`ℹ️ Token JWT ya está correctamente configurado para ${developer}`);
        }
      }

      // ✅ CORRECCIÓN: Si hay email/phone en URL, SIEMPRE identificar (forzar identificación)
      // Si NO hay email/phone en URL, verificar si ya está identificado
      const uuidRegex = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
      const isUUID = currentUserId ? uuidRegex.test(currentUserId) : false;

      // ✅ PRIORIDAD: Si hay email/phone en URL, SIEMPRE identificar (ignorar currentUserId)
      const hasEmailOrPhoneInUrl = !!(emailParam || phoneParam);

      // Solo ejecutar identificación si:
      // 1. Hay email/phone en URL (forzar identificación), O
      // 2. No hay usuario actual, O
      // 3. El usuario es UUID (temporal), O
      // 4. El usuario es visitante genérico
      const needsIdentification =
        hasEmailOrPhoneInUrl ||
        !currentUserId ||
        isUUID ||
        currentUserId === 'visitante@guest.local';

      if (!needsIdentification) {
        devLog('ℹ️ Usuario ya identificado correctamente:', currentUserId);
        return;
      }

      // ✅ Si hay email/phone en URL y currentUserId es diferente, forzar identificación
      if (hasEmailOrPhoneInUrl && currentUserId && currentUserId !== (emailParam || phoneParam)) {
        devLog(
          `🔄 Forzando identificación: currentUserId (${currentUserId}) ≠ email/phone en URL (${emailParam || phoneParam})`,
        );
      }

      devLog('🔍 DESPUÉS de needsIdentification, antes de branding:', {
        currentUserId,
        developer,
        email,
        emailParam,
        phone,
        phoneParam,
      });

      // ✅ OPTIMIZACIÓN: Cargar branding y credenciales EN PARALELO
      devLog('🚀 Iniciando carga paralela de branding y credenciales para:', developer);

      const BRANDING_FETCH_TIMEOUT = 3000; // ✅ Reducido de 8s a 3s para carga más rápida
      const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';

      // Helper con timeout
      const fetchWithTimeout = async (url: string, timeout: number = BRANDING_FETCH_TIMEOUT) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          return response;
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error(`Timeout después de ${timeout}ms`);
          }
          throw error;
        }
      };

      // ✅ Función para cargar branding (con caché y fallback rápido)
      const loadBranding = async () => {
        try {
          // ✅ OPTIMIZACIÓN: Verificar caché primero (válido por 1 hora)
          const cacheKey = `whitelabel_config_${developer}`;
          const cachedConfig = sessionStorage.getItem(cacheKey);
          const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);

          if (cachedConfig && cacheTimestamp) {
            const cacheAge = Date.now() - parseInt(cacheTimestamp, 10);
            const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

            if (cacheAge < CACHE_DURATION) {
              // ✅ Usar configuración en caché
              const config = JSON.parse(cachedConfig);
              devLog('🎨 Config de whitelabel cargado desde caché:', config);

              // Aplicar branding desde caché
              if (config.logo) {
                sessionStorage.setItem('whitelabel_logo', config.logo);
              }
              if (config.favicon) {
                const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
                if (faviconLink) faviconLink.href = config.favicon;
              }
              if (config.colors) {
                const root = document.documentElement;
                root.style.setProperty('--primary-color', config.colors.primary || '#667eea');
                root.style.setProperty('--secondary-color', config.colors.secondary || '#764ba2');
                root.style.setProperty('--background-color', config.colors.background || '#ffffff');
                root.style.setProperty('--text-color', config.colors.text || '#1a202c');
                root.style.setProperty('--accent-color', config.colors.accent || '#ff69b4');
              }
              return { fromCache: true, success: true };
            } else {
              // Caché expirado, limpiar
              sessionStorage.removeItem(cacheKey);
              sessionStorage.removeItem(`${cacheKey}_timestamp`);
            }
          }

          // ✅ Si no hay caché válido, hacer fetch
          const response = await fetchWithTimeout(
            `${backendBaseUrl}/api/config/${developer}`,
            BRANDING_FETCH_TIMEOUT,
          );
          if (response.ok) {
            const config = await response.json();
            devLog('🎨 Config de whitelabel recibido del servidor:', config);

            // ✅ Guardar en caché
            sessionStorage.setItem(cacheKey, JSON.stringify(config));
            sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

            // Aplicar branding
            if (config.logo) {
              sessionStorage.setItem('whitelabel_logo', config.logo);
            }
            if (config.favicon) {
              const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
              if (faviconLink) faviconLink.href = config.favicon;
            }
            if (config.colors) {
              const root = document.documentElement;
              root.style.setProperty('--primary-color', config.colors.primary || '#667eea');
              root.style.setProperty('--secondary-color', config.colors.secondary || '#764ba2');
              root.style.setProperty('--background-color', config.colors.background || '#ffffff');
              root.style.setProperty('--text-color', config.colors.text || '#1a202c');
              root.style.setProperty('--accent-color', config.colors.accent || '#ff69b4');
            }
            return { fromCache: false, success: true };
          }
          return { status: response.status, success: false };
        } catch (error) {
          // ✅ Si falla, intentar usar caché expirado como fallback
          const cacheKey = `whitelabel_config_${developer}`;
          const cachedConfig = sessionStorage.getItem(cacheKey);
          if (cachedConfig) {
            try {
              const config = JSON.parse(cachedConfig);
              devLog('🎨 Usando configuración en caché (fallback por error):', config);
              // Aplicar branding desde caché expirado
              if (config.logo) {
                sessionStorage.setItem('whitelabel_logo', config.logo);
              }
              if (config.favicon) {
                const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
                if (faviconLink) faviconLink.href = config.favicon;
              }
              if (config.colors) {
                const root = document.documentElement;
                root.style.setProperty('--primary-color', config.colors.primary || '#667eea');
                root.style.setProperty('--secondary-color', config.colors.secondary || '#764ba2');
                root.style.setProperty('--background-color', config.colors.background || '#ffffff');
                root.style.setProperty('--text-color', config.colors.text || '#1a202c');
                root.style.setProperty('--accent-color', config.colors.accent || '#ff69b4');
              }
              return { fallback: true, fromCache: true, success: true };
            } catch (parseError) {
              devWarn('⚠️ Error parseando caché (continuando):', parseError);
            }
          }

          // ✅ Si falla, continuar sin bloquear (fallback rápido)
          devWarn('⚠️ Error cargando branding (continuando):', error);
          return {
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
          };
        }
      };

      // ✅ Función para cargar credenciales (con timeout y fallback)
      const loadCredentials = async () => {
        try {
          const { fetchAICredentials } = await import('@/services/api2/aiCredentials');
          const { useUserStore } = await import('@/store/user');

          // ✅ Timeout rápido para credenciales (2 segundos)
          const credentialsPromise = fetchAICredentials(developer);
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 2000);
          });

          const aiCredentials = await Promise.race([credentialsPromise, timeoutPromise]);

          if (aiCredentials && Object.keys(aiCredentials).length > 0) {
            const userStore = useUserStore.getState();
            const providerMap: Record<string, string> = {
              anthropic: 'anthropic',
              google: 'google',
              openai: 'openai',
            };

            for (const [backendProvider, creds] of Object.entries(aiCredentials)) {
              if (creds && creds.enabled && creds.apiKey) {
                const storeProvider = providerMap[backendProvider] || backendProvider;
                try {
                  await userStore.updateKeyVaultSettings(storeProvider, {
                    apiKey: creds.apiKey,
                    enabled: true,
                  });
                } catch (err) {
                  devWarn(`⚠️ Error configurando ${storeProvider}:`, err);
                }
              }
            }
            return { providers: Object.keys(aiCredentials), success: true };
          }
          return { providers: [], success: true };
        } catch (error) {
          // ✅ Si falla, continuar sin bloquear (el backend Python manejará las credenciales)
          devWarn(
            '⚠️ Error cargando credenciales (continuando, backend Python las manejará):',
            error,
          );
          return { providers: [], success: true };
        }
      };

      // ✅ OPTIMIZACIÓN: NO esperar branding/credenciales para mostrar UI
      // Ejecutar en segundo plano sin bloquear la carga inicial
      Promise.allSettled([loadBranding(), loadCredentials()])
        .then(([brandingResult, credentialsResult]) => {
          // Log resultados (en segundo plano)
          if (brandingResult.status === 'fulfilled') {
            devLog('✅ Branding completado');
          } else {
            devWarn(
              '⚠️ Error en branding:',
              brandingResult.reason?.message || brandingResult.reason,
            );
          }

          if (
            credentialsResult.status === 'fulfilled' &&
            credentialsResult.value.providers?.length > 0
          ) {
            devLog('✅ Credenciales configuradas:', credentialsResult.value.providers.join(', '));
          } else if (credentialsResult.status === 'rejected') {
            devWarn(
              '⚠️ Error en credenciales:',
              credentialsResult.reason?.message || credentialsResult.reason,
            );
          }

          devLog('🚀 Carga paralela completada (en segundo plano)');
        })
        .catch((error) => {
          devWarn('⚠️ Error en carga paralela (continuando):', error);
        });

      // ✅ NO esperar - continuar inmediatamente para no bloquear UI

      devLog('🔍 DESPUÉS de branding, antes de inviteToken:', {
        developer,
        email,
        inviteTokenParam: !!inviteTokenParam,
        phone,
      });

      // ✅ Flujo de invitado: consumir token de invitado y obtener sesión temporal
      if (inviteTokenParam) {
        try {
          const storedInviteToken = localStorage.getItem('invite-token');
          const storedJwt = localStorage.getItem('jwt_token');

          if (storedInviteToken === inviteTokenParam && storedJwt) {
            devLog('🔐 Token de invitado ya consumido previamente. Se reutiliza la sesión actual.');
          } else {
            devLog('🔐 Consumiento token de invitado para iniciar sesión temporal');

            const inviteResponse = await consumeInviteToken({
              developer: developer || undefined,
              email: emailParam || undefined,
              phone: phoneParam || undefined,
              token: inviteTokenParam,
            });

            if (inviteResponse.success && inviteResponse.token) {
              const resolvedUserId =
                inviteResponse.user_id ||
                inviteResponse.user_data?.email ||
                inviteResponse.user_data?.telefono ||
                'visitante@guest.local';

              await setExternalChatConfig(
                resolvedUserId,
                inviteResponse.development || developer || 'bodasdehoy',
                inviteResponse.token,
                inviteResponse.user_type ?? 'guest',
                inviteResponse.role ?? 'guest',
                inviteResponse.user_data,
              );

              localStorage.setItem('jwt_token', inviteResponse.token);
              localStorage.setItem('invite-token', inviteTokenParam);
              localStorage.setItem(
                'dev-user-config',
                JSON.stringify({
                  developer: inviteResponse.development || developer || 'bodasdehoy',
                  role: inviteResponse.role ?? 'guest',
                  timestamp: Date.now(),
                  token_source: inviteResponse.token_source ?? 'invite',
                  userId: resolvedUserId,
                  user_type: inviteResponse.user_type ?? 'guest',
                }),
              );

              if (Array.isArray(inviteResponse.eventos)) {
                try {
                  localStorage.setItem(
                    'invite-events',
                    JSON.stringify({ events: inviteResponse.eventos, timestamp: Date.now() }),
                  );
                } catch (storeError) {
                  devWarn('⚠️ No se pudieron almacenar los eventos de invitado:', storeError);
                }
              }

              const displayName =
                inviteResponse.user_data?.displayName ||
                inviteResponse.user_data?.nombre ||
                resolvedUserId;

              // ✅ MEJORA UX: Mensaje más claro para invitados
              message.success({
                content: `¡Sesión invitada activada! Bienvenido ${displayName}. Tu acceso es temporal.`,
                duration: 4,
                icon: '🎉',
              });

              setLastIdentifiedUserId(resolvedUserId);
              return;
            }

            // ✅ MEJORA UX: Mensaje de error más claro
            message.error({
              content:
                inviteResponse.message ||
                'No se pudo validar el token de invitado. Verifica que el enlace sea válido.',
              duration: 5,
              icon: '❌',
            });
          }
        } catch (inviteError) {
          console.error('❌ Error consumiendo token de invitado:', inviteError);
          // ✅ MEJORA UX: Mensaje de error más descriptivo
          message.error({
            content:
              'Ocurrió un error al activar el enlace de invitado. Por favor, intenta nuevamente o contacta al administrador.',
            duration: 5,
            icon: '⚠️',
          });
        }
      }

      devLog('🔍 DESPUÉS de inviteToken, ANTES de shouldIdentify:', {
        developer,
        email,
        emailParam,
        phone,
        phoneParam,
        savedConfig: !!savedConfig,
      });

      // ✅ CORRECCIÓN: Si hay email/phone en URL, SIEMPRE identificar (ignorar savedConfig)
      // Si NO hay email/phone en URL pero hay savedConfig, usar savedConfig
      devLog('🔍 ANTES de evaluar shouldIdentify:', {
        developer,
        email: email?.slice(0, 10),
        emailParam: emailParam?.slice(0, 10),
        hasSavedConfig: !!savedConfig,
        phone: phone?.slice(0, 10),
        phoneParam: phoneParam?.slice(0, 10),
        savedConfigUserId: savedConfig?.userId?.slice(0, 10),
      });

      const shouldIdentify =
        email || phone || (developer && !email && !phone && savedConfig?.userId);

      devLog('🔍 Evaluando shouldIdentify:', {
        condition1: !!(email || phone),
        condition2: !!(developer && !email && !phone && savedConfig?.userId),
        developer,
        email: email?.slice(0, 10),
        hasSavedConfig: !!savedConfig,
        phone: phone?.slice(0, 10),
        savedConfigUserId: savedConfig?.userId?.slice(0, 10),
        shouldIdentify,
      });

      if (shouldIdentify) {
        devLog('✅ shouldIdentify es TRUE, procediendo con identificación');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/10a0d667-c77d-44ea-a28d-e9f9b782eee2',{body:JSON.stringify({data:{developer,hasEmail:!!email,hasPhone:!!phone},hypothesisId:'A',location:'EventosAutoAuth.tsx:793',message:'shouldIdentify TRUE',runId:'run1',sessionId:'debug-session',timestamp:Date.now()}),headers:{'Content-Type':'application/json'},method:'POST'}).catch(()=>{});
        // #endregion
        try {
          const { eventosAPI } = await import('@/config/eventos-api');

          // ✅ CRÍTICO: Si hay email/phone en URL, usarlos directamente (ignorar savedConfig)
          const finalEmail = email || undefined;
          const finalPhone = phone || undefined;

          devLog('🔍 Identificando usuario desde:', {
            developer,
            email: finalEmail?.slice(0, 10),
            phone: finalPhone?.slice(0, 10),
            source: finalEmail || finalPhone ? 'URL' : savedConfig ? 'localStorage' : 'default',
          });

          // #region agent log
          const identifyStart = Date.now();
          fetch('http://127.0.0.1:7242/ingest/10a0d667-c77d-44ea-a28d-e9f9b782eee2',{body:JSON.stringify({data:{developer,hasEmail:!!finalEmail,hasPhone:!!finalPhone,timestamp:identifyStart},hypothesisId:'A',location:'EventosAutoAuth.tsx:810',message:'BEFORE identifyUser call',runId:'run1',sessionId:'debug-session',timestamp:Date.now()}),headers:{'Content-Type':'application/json'},method:'POST'}).catch(()=>{});
          // #endregion
          // Llamar al backend para identificar usuario
          let result;
          try {
            result = await eventosAPI.identifyUser(
              developer || undefined,
              finalEmail,
              finalPhone,
            );

            // #region agent log
            const identifyEnd = Date.now();
            fetch('http://127.0.0.1:7242/ingest/10a0d667-c77d-44ea-a28d-e9f9b782eee2',{body:JSON.stringify({data:{elapsed:identifyEnd-identifyStart,success:result.success},hypothesisId:'A',location:'EventosAutoAuth.tsx:816',message:'AFTER identifyUser call',runId:'run1',sessionId:'debug-session',timestamp:Date.now()}),headers:{'Content-Type':'application/json'},method:'POST'}).catch(()=>{});
            // #endregion
          } catch (error: any) {
            // ✅ CRÍTICO: Capturar errores y mostrar mensaje claro al usuario
            devLog('❌ Error en identifyUser:', error);

            // Importar sistema de notificaciones
            const { notification } = await import('@/components/AntdStaticMethods');

            // Determinar mensaje de error
            let errorMessage = 'Error al conectar con el servidor de autenticación';
            let errorDescription = 'Por favor, intente nuevamente en unos momentos.';

            if (error.message) {
              if (error.message.includes('502') || error.message.includes('Bad Gateway')) {
                errorMessage = 'Servicio de autenticación no disponible (502)';
                errorDescription = 'El servidor no respondió correctamente. Si usas VPN, prueba desactivarla y reintentar. Si el problema persiste, contacte al soporte.';
              } else if (error.message.includes('Timeout') || error.message.includes('timeout')) {
                errorMessage = 'Tiempo de espera agotado';
                errorDescription = 'El servidor de autenticación no respondió a tiempo. Por favor, intente nuevamente.';
              } else if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
                errorMessage = 'Servicio no disponible';
                errorDescription = 'El servicio de autenticación no está disponible en este momento. Por favor, intente más tarde.';
              } else {
                errorDescription = error.message;
              }
            }

            // Mostrar notificación de error
            notification.error({
              description: errorDescription,
              duration: 10,
              message: errorMessage, // Mostrar por 10 segundos
            });

            // NO continuar con el flujo - el usuario debe saber que hay un error
            return;
          }

          devLog('📥 Resultado de identificación:', {
            development: result.development,
            success: result.success,
            user_id: result.user_id?.slice(0, 20),
            user_type: result.user_type,
          });

          // ✅ CRÍTICO: Verificar que result existe y tiene success
          if (!result || !result.success) {
            // Importar sistema de notificaciones
            const { notification } = await import('@/components/AntdStaticMethods');

            const errorMessage = result?.error || 'Error al identificar usuario';
            const errorDescription = result?.error_details || result?.message || 'No se pudo identificar el usuario. Por favor, intente nuevamente.';

            notification.error({
              description: errorDescription,
              duration: 10,
              message: errorMessage,
            });

            // NO continuar con el flujo
            return;
          }

          // Backend devuelve configuración completa
          if (result.success && result.user_id && result.development) {
            devLog('✅ Identificación exitosa, actualizando store con:', {
              development: result.development,
              has_user_data: !!result.user_data,
              user_id: result.user_id,
              user_type: result.user_type,
            });

            // ✅ CORRECCIÓN: Pasar user_type, role y user_data para que se guarde en el store
            await setExternalChatConfig(
              result.user_id,
              result.development,
              undefined, // token
              result.user_type, // userType
              result.role, // userRole
              result.user_data, // userData
            );

            // ✅ Verificar que se actualizó correctamente
            const chatStoreAfter = useChatStore.getState();
            devLog('🔍 Store después de setExternalChatConfig:', {
              currentUserId: chatStoreAfter.currentUserId,
              development: chatStoreAfter.development,
              hasUserProfile: !!chatStoreAfter.userProfile,
              userType: chatStoreAfter.userType,
            });

            // ✅ OPTIMIZACIÓN CRÍTICA: Diferir completamente la carga de datos
            // NO cargar datos inmediatamente - solo configurar lo mínimo para mostrar UI
            // Los datos se cargarán después de que la UI esté renderizada
            devLog('✅ Configuración de usuario completada, UI lista para renderizar');

            // ✅ Cargar datos DESPUÉS de que la UI se renderice (no bloquear)
            if (typeof window !== 'undefined') {
              const loadDataAfterUI = () => {
                try {
                  const { fetchAllUserData, externalChatsLoading } = useChatStore.getState();

                  // ✅ SOLUCIÓN RÁPIDA: Verificar si ya está cargando para evitar duplicados
                  if (externalChatsLoading) {
                    devLog('⏭️ Datos ya cargando, saltando llamada duplicada en EventosAutoAuth');
                    return;
                  }

                  devLog('📥 Cargando datos del cliente automáticamente (en background, después de UI)...');

                  // ✅ Cargar datos en background sin bloquear
                  fetchAllUserData()
                    .then(() => {
                      const storeAfterDataLoad = useChatStore.getState();
                      devLog('✅ Datos del cliente cargados exitosamente:', {
                        chatsCount: storeAfterDataLoad.externalChats?.length || 0,
                        currentUserId: storeAfterDataLoad.currentUserId,
                        eventsCount: storeAfterDataLoad.userEvents?.length || 0,
                        hasApiConfigs: !!storeAfterDataLoad.userApiConfigs,
                        hasChats: (storeAfterDataLoad.externalChats?.length || 0) > 0,
                        hasEvents: (storeAfterDataLoad.userEvents?.length || 0) > 0,
                        hasProfile: !!storeAfterDataLoad.userProfile,
                      });
                    })
                    .catch((dataError) => {
                      devWarn('⚠️ Error cargando datos del cliente (continuando):', dataError);
                    });
                } catch (dataError) {
                  devWarn('⚠️ Error iniciando carga de datos del cliente (continuando):', dataError);
                }
              };

              // ✅ Cargar datos cuando el navegador esté inactivo (después de que la UI se renderice)
              if ('requestIdleCallback' in window) {
                requestIdleCallback(loadDataAfterUI, { timeout: 3000 });
              } else {
                // Fallback: delay para asegurar que la UI se renderice primero
                setTimeout(loadDataAfterUI, 2000);
              }
            }

            // Actualizar localStorage con la información actualizada
            try {
              localStorage.setItem(
                'dev-user-config',
                JSON.stringify({
                  developer: result.development,
                  development: result.development,
                  role: result.role,
                  timestamp: Date.now(),
                  userId: result.user_id,
                  user_data: result.user_data,
                  user_type: result.user_type,
                }),
              );
              devLog('💾 localStorage actualizado con información del usuario:', {
                developer: result.development,
                userId: result.user_id,
              });
            } catch (e) {
              devWarn('⚠️ Error actualizando localStorage:', e);
            }

            // Verificar si es un nuevo usuario identificado (diferente al anterior)
            const isNewUser = lastIdentifiedUserId !== result.user_id;
            const isRegistered = result.user_type === 'registered';

            if (isNewUser && isRegistered) {
              // Mostrar notificación de registro
              const userName =
                result.user_data?.displayName ||
                result.user_data?.nombre ||
                result.user_id.split('@')[0];

              // ✅ MEJORA UX: Mensaje más informativo
              message.success({
                content: `¡Bienvenido, ${userName}! Has sido identificado correctamente.`,
                duration: 4,
                icon: '✅',
              });

              setLastIdentifiedUserId(result.user_id);
            }

            devLog('✅ Auto-identificación completada:', {
              development: result.development,
              role: result.role,
              user_id: result.user_id,
              user_type: result.user_type,
            });

            // ✅ CORRECCIÓN: Verificar que el store se actualizó correctamente
            setTimeout(() => {
              // useChatStore ya está importado al inicio del archivo, no necesitamos await import
              const chatStore = useChatStore.getState();
              devLog('🔍 Estado del store después de auto-auth (verificación final):', {
                currentUserId: chatStore.currentUserId,
                development: chatStore.development,
                userProfile: chatStore.userProfile,
                userRole: chatStore.userRole,
                userType: chatStore.userType,
              });
            }, 300);
          } else {
            devWarn('⚠️ Identificación falló:', result);
            // ✅ CORRECCIÓN: Si hay email/phone en URL, NO usar savedConfig como fallback
            // Solo usar savedConfig si NO hay email/phone en URL
            if (!emailParam && !phoneParam && savedConfig?.userId) {
              devLog('🔄 Usando información guardada de localStorage (no hay email/phone en URL)');
              await setExternalChatConfig(
                savedConfig.userId,
                savedConfig.developer || 'bodasdehoy',
                undefined,
                savedConfig.user_type || 'guest',
                savedConfig.role,
              );
            } else if (emailParam || phoneParam) {
              // ✅ Si hay email/phone en URL pero la identificación falló, mostrar error
              console.error(
                '❌ No se pudo identificar al usuario de la URL, pero NO se usará usuario guardado',
              );
              // ✅ MEJORA UX: Mensaje de error más claro y útil
              message.error({
                content: `No se pudo identificar al usuario ${emailParam || phoneParam}. Verifica que el usuario existe en el sistema.`,
                duration: 5,
                icon: '❌',
              });
            }
          }
        } catch (error: any) {
          console.error('❌ Error en auto-autenticación:', error);

          // ✅ CORRECCIÓN: Si hay email/phone en URL, NO usar savedConfig como fallback
          // Solo usar savedConfig si NO hay email/phone en URL
          if (!emailParam && !phoneParam && savedConfig?.userId) {
            devLog('🔄 Fallback: usando información de localStorage (no hay email/phone en URL)');
            await setExternalChatConfig(
              savedConfig.userId,
              savedConfig.developer || 'bodasdehoy',
              undefined,
              savedConfig.user_type || 'guest',
              savedConfig.role,
            );
          } else if (emailParam || phoneParam) {
            // ✅ Si hay email/phone en URL pero la identificación falló, mostrar error
            console.error('❌ Error identificando usuario de la URL:', error.message || error);
            // ✅ MEJORA UX: Mensaje de error más descriptivo
            message.error({
              content: `Error al identificar al usuario: ${error.message || 'Error desconocido'}. Verifica que el backend esté funcionando en http://localhost:8030`,
              duration: 6,
              icon: '⚠️',
            });

            // ✅ NO configurar visitante@guest.local si hay email/phone en URL
            // Dejar que el usuario vea el error y pueda intentar de nuevo
          } else {
            // Fallback: modo visitante por defecto (solo si NO hay email/phone en URL)
            if (!currentUserId || currentUserId === 'visitante@guest.local' || isUUID) {
              await setExternalChatConfig('visitante@guest.local', developer || 'bodasdehoy');
            }
          }
        }
      }
      } finally {
        // ✅ CORRECCIÓN: Siempre resetear el flag de progreso
        identifyInProgressRef.current = false;
        // ✅ Marcar como identificado si el usuario actual es válido
        if (currentUserId && currentUserId !== 'visitante@guest.local') {
          hasIdentifiedRef.current = true;
        }
      }
    }
  }, [
    developerParam,
    emailParam,
    phoneParam,
    inviteTokenParam,
    setExternalChatConfig,
    currentUserId,
    lastIdentifiedUserId,
    isInParentIframe,
    receivedAuthFromParent,
  ]);

  return null; // Componente invisible
}

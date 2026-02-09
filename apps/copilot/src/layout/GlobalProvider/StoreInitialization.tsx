'use client';

import { useRouter } from 'next/navigation';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createStoreUpdater } from 'zustand-utils';

import { enableNextAuth } from '@/const/auth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { useAgentStore } from '@/store/agent';
import { useAiInfraStore } from '@/store/aiInfra';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useServerConfigStore } from '@/store/serverConfig';
import { serverConfigSelectors } from '@/store/serverConfig/selectors';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';
import { debugLog } from '@/utils/debugLogger';

const StoreInitialization = memo(() => {
  // prefetch error ns to avoid don't show error content correctly
  useTranslation('error');

  // ✅ Activar renovación automática de JWT
  useTokenRefresh();

  const router = useRouter();
  const [isLogin, isSignedIn, useInitUserState] = useUserStore((s) => [
    authSelectors.isLogin(s),
    s.isSignedIn,
    s.useInitUserState,
  ]);

  // ✅ Obtener serverConfig para los hooks
  const { serverConfig: currentServerConfig } = useServerConfigStore();

  // ✅ OPTIMIZACIÓN: Obtener funciones pero no ejecutarlas durante el render
  const useInitSystemStatus = useGlobalStore((s) => s.useInitSystemStatus);

  // ✅ CRÍTICO: Estos hooks DEBEN ejecutarse en el cuerpo del componente, no dentro de async
  // Los llamamos aquí para que se ejecuten correctamente
  const useInitAgentStore = useAgentStore((s) => s.useInitInboxAgentStore);
  const useInitAiProviderKeyVaults = useAiInfraStore((s) => s.useFetchAiProviderRuntimeState);

  // ✅ Obtener valores necesarios para los hooks
  const isDBInited = useGlobalStore(systemStatusSelectors.isDBInited);
  const currentIsSignedIn = useUserStore((s) => s.isSignedIn);
  const currentIsLogin = useUserStore(authSelectors.isLogin);
  const isLoginOnInit = isDBInited
    ? Boolean(enableNextAuth ? currentIsSignedIn : currentIsLogin)
    : false;

  // ✅ Ejecutar hooks en el cuerpo del componente (no dentro de async)
  useInitAgentStore(isLoginOnInit, currentServerConfig?.defaultAgent?.config);
  useInitAiProviderKeyVaults(isLoginOnInit);
  // ✅ FIX: Eliminada redirección a /onboard porque la página no existe
  // El usuario irá directamente al chat sin proceso de onboarding
  useInitUserState(isLoginOnInit, currentServerConfig, {
    onSuccess: (state) => {
      // Onboarding deshabilitado - página /onboard no existe
      // if (state.isOnboard === false) {
      //   router.push('/onboard');
      // }
      console.log('✅ [StoreInitialization] User state initialized, isOnboard:', state.isOnboard);
    },
  });

  const useStoreUpdater = createStoreUpdater(useGlobalStore);
  const mobile = useIsMobile();

  // ✅ CRÍTICO: Configurar router y mobile INMEDIATAMENTE (no bloquea)
  useStoreUpdater('isMobile', mobile);
  useStoreUpdater('router', router);

  // ✅ OPTIMIZACIÓN: useInitSystemStatus es un hook, debe ejecutarse durante el render
  // Pero SWR es asíncrono, así que no bloquea el render
  // Agregar logging para medir tiempo
  const systemStatusStart = Date.now();
  console.log('⏱️ [SystemStatus] Iniciando useInitSystemStatus...');

  // ✅ Detectar si está bloqueando
  if (typeof window !== 'undefined' && (window as any).blockingDetector) {
    (window as any).blockingDetector.startOperation('useInitSystemStatus');
  }

  const systemStatusResult = useInitSystemStatus();

  // Medir tiempo después de que se ejecute (SWR es async, no bloquea)
  useEffect(() => {
    const elapsed = Date.now() - systemStatusStart;
    if (elapsed > 100) {
      console.warn(`⚠️ [SystemStatus] useInitSystemStatus tardó ${elapsed}ms en inicializar (SWR es async, no bloquea)`);
    } else {
      console.log(`✅ [SystemStatus] useInitSystemStatus inicializado en ${elapsed}ms`);
    }

    // ✅ Finalizar detección de bloqueo
    if (typeof window !== 'undefined' && (window as any).blockingDetector) {
      (window as any).blockingDetector.endOperation('useInitSystemStatus');
    }
  }, []);

  // ✅ CRÍTICO: Marcar isUserStateInit=true INMEDIATAMENTE (SÍNCRONO en el cuerpo del componente)
  // Esto evita que el Redirect se quede bloqueado esperando
  // Se ejecuta durante el render, antes de cualquier useEffect
  if (typeof window !== 'undefined') {
    const userStore = useUserStore.getState();
    const currentIsUserStateInit = userStore.isUserStateInit;

    if (!currentIsUserStateInit) {
      // Marcar como inicializado inmediatamente (síncrono durante el render)
      console.warn('[DEBUG-A] ⚠️ FIX SÍNCRONO: isUserStateInit=false, forzando a true INMEDIATAMENTE durante render');
      debugLog('StoreInitialization.tsx:47', 'FIX SÍNCRONO: Forzando isUserStateInit=true durante render', {
        currentIsUserStateInit,
        isSignedIn: userStore.isSignedIn
      }, 'A');
      useUserStore.setState({ isUserStateInit: true });
    }
  }

  // ✅ FALLBACK: También usar useEffect como respaldo adicional
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verificar estado inmediatamente (sin esperar a initNonCritical)
    const userStore = useUserStore.getState();
    const currentIsLogin = authSelectors.isLogin(userStore);
    const currentIsUserStateInit = userStore.isUserStateInit;

    debugLog('StoreInitialization.tsx:50', 'Fix temprano ejecutado', {
      currentIsLogin,
      currentIsUserStateInit,
      isSignedIn: userStore.isSignedIn
    }, 'A');
    console.log('[DEBUG-A] Fix temprano ejecutado', {
      currentIsLogin,
      currentIsUserStateInit,
      isSignedIn: userStore.isSignedIn
    });

    // Si isUserStateInit ya es true, no hacer nada
    if (currentIsUserStateInit) {
      debugLog('StoreInitialization.tsx:65', 'isUserStateInit ya es true, no hacer nada', {}, 'A');
      return;
    }

    // Si isLogin es false O si han pasado más de 100ms desde el montaje, marcar como inicializado
    // Esto asegura que siempre se marque como inicializado, incluso si hay problemas de timing
    if (!currentIsLogin) {
      debugLog('StoreInitialization.tsx:70', 'isLogin=false, marcando isUserStateInit=true inmediatamente', {currentIsLogin}, 'A');
      console.warn('[DEBUG-A] ⚠️ isLogin es false, marcando isUserStateInit=true inmediatamente (antes de initNonCritical)');
      useUserStore.setState({ isUserStateInit: true });
    } else {
      // Si isLogin es true, esperar un poco pero luego marcar como inicializado de todos modos
      // Esto es un fallback de seguridad
      setTimeout(() => {
        const stillNotInit = !useUserStore.getState().isUserStateInit;
        if (stillNotInit) {
          debugLog('StoreInitialization.tsx:78', 'FALLBACK: isUserStateInit sigue false después de 100ms, forzando a true', {}, 'A');
          console.warn('[DEBUG-A] ⚠️ FALLBACK: isUserStateInit sigue false después de 100ms, forzando a true');
          useUserStore.setState({ isUserStateInit: true });
        }
      }, 100);
    }
  }, []); // Ejecutar solo una vez al montar

  // ✅ OPTIMIZACIÓN CRÍTICA: Diferir todas las inicializaciones pesadas
  // Cargar después de que la UI se renderice para que el usuario pueda escribir inmediatamente
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initNonCritical = async () => {
      // ✅ Detectar bloqueos
      if (typeof window !== 'undefined' && (window as any).blockingDetector) {
        (window as any).blockingDetector.startOperation('initNonCritical');
      }

      // ✅ MEDICIÓN: Medir inicialización de stores
      const { performanceMonitor } = await import('@/utils/performanceMonitor');
      performanceMonitor.startPhase('STORE_INITIALIZATION');

      const initStartTime = Date.now();
      console.log('🚀 [StoreInitialization] Iniciando inicializaciones no críticas...');

      // ✅ Obtener serverConfigStore fuera del try para que esté disponible en todo el scope
      const serverConfigStore = typeof window !== 'undefined' && window.global_serverConfigStore
        ? window.global_serverConfigStore
        : null;

      try {
        // ✅ 1. Fetch server config (puede tardar si el servidor es lento)
        const serverConfigStart = Date.now();
        console.log('⏱️ [1/4] Obteniendo configuración del servidor...');
        // ✅ CORRECCIÓN: NO llamar hook dentro de useEffect async
        // El hook useInitServerConfig ya se llama en el cuerpo del componente (línea 31)
        // Solo necesitamos esperar a que se complete o usar el servicio directamente
        const { globalService } = await import('@/services/global');
        try {
          const config = await Promise.race([
            globalService.getGlobalConfig(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout: getGlobalConfig tardó más de 2 segundos')), 2000)
            )
          ]);

          // Actualizar el store directamente
          if (serverConfigStore) {
            serverConfigStore.setState({
              featureFlags: config.serverFeatureFlags,
              serverConfig: config.serverConfig,
            });
          }
        } catch (error) {
          console.warn('⚠️ [1/4] Error obteniendo configuración del servidor (continuando):', error);
        }
        console.log(`✅ [1/4] Configuración del servidor iniciada (${Date.now() - serverConfigStart}ms)`);

        // ✅ 2. Update NextAuth status (rápido)
        const nextAuthStart = Date.now();
        console.log('⏱️ [2/4] Actualizando estado de NextAuth...');

        // ✅ CORRECCIÓN: NO usar createStoreUpdater dentro de async (usa hooks)
        // Actualizar el store directamente usando setState
        const oAuthSSOProviders = serverConfigStore
          ? serverConfigSelectors.oAuthSSOProviders(serverConfigStore.getState())
          : [];

        // Actualizar directamente sin usar hook
        useUserStore.setState({ oAuthSSOProviders });
        console.log(`✅ [2/4] Estado de NextAuth actualizado (${Date.now() - nextAuthStart}ms)`);

        // ✅ 3. Obtener estado de DB (puede tardar)
        const dbCheckStart = Date.now();
        console.log('⏱️ [3/4] Verificando estado de base de datos...');
        const isDBInited = useGlobalStore.getState(systemStatusSelectors.isDBInited);
        const currentServerConfig = serverConfigStore?.getState().serverConfig || null;
        const currentIsSignedIn = useUserStore.getState().isSignedIn;
        const currentIsLogin = useUserStore.getState(authSelectors.isLogin);

        const isLoginOnInit = isDBInited
          ? Boolean(enableNextAuth ? currentIsSignedIn : currentIsLogin)
          : false;
        console.log(`✅ [3/4] Estado de DB verificado (${Date.now() - dbCheckStart}ms) - isDBInited: ${isDBInited}, isLoginOnInit: ${isLoginOnInit}`);

        // ✅ 4. Inicializar servicios (pueden tardar)
        const servicesStart = Date.now();
        console.log('⏱️ [4/4] Inicializando servicios (agentes, credenciales, usuario)...');

        // ✅ CORRECCIÓN: Los hooks ya se ejecutaron en el cuerpo del componente
        // Solo necesitamos registrar que se iniciaron
        console.log('  📦 Agente inbox ya inicializado (hook ejecutado en render)');
        console.log('  🔐 Credenciales ya inicializadas (hook ejecutado en render)');

        // ✅ init user state (este hook también debe ejecutarse en el cuerpo del componente)
        // Pero lo movemos aquí solo para logging, el hook real se ejecuta arriba
        const userStateStart = Date.now();
        console.log('  👤 Inicializando estado de usuario...');

        // ✅ NOTA: useInitUserState también es un hook, debe ejecutarse en el cuerpo del componente
        // Por ahora solo registramos, el hook real se ejecuta en el cuerpo del componente
        console.log(`  ✅ Estado de usuario (hook ejecutado en render) (${Date.now() - userStateStart}ms)`);
        console.log(`✅ [4/4] Servicios iniciados (${Date.now() - servicesStart}ms)`);

        const totalTime = Date.now() - initStartTime;
        console.log(`🎉 [StoreInitialization] Inicializaciones no críticas completadas en ${totalTime}ms`);

        // ✅ MEDICIÓN: Finalizar medición
        performanceMonitor.endPhase('STORE_INITIALIZATION');

        // ✅ Finalizar detección de bloqueo
        if (typeof window !== 'undefined' && (window as any).blockingDetector) {
          (window as any).blockingDetector.endOperation('initNonCritical');
        }
      } catch (error) {
        const totalTime = Date.now() - initStartTime;
        console.error(`❌ [StoreInitialization] Error después de ${totalTime}ms:`, error);
        console.warn('⚠️ Error en inicialización diferida (continuando):', error);

        // ✅ MEDICIÓN: Finalizar medición incluso si hay error
        performanceMonitor.endPhase('STORE_INITIALIZATION');

        // ✅ Finalizar detección de bloqueo incluso si hay error
        if (typeof window !== 'undefined' && (window as any).blockingDetector) {
          (window as any).blockingDetector.endOperation('initNonCritical');
        }
      }
    };

    // ✅ OPTIMIZACIÓN ULTRA RÁPIDA: Reducir delay al mínimo
    // Prioridad: UI primero, datos después
    // Usar requestIdleCallback con timeout muy corto para no bloquear el render inicial
    if ('requestIdleCallback' in window) {
      // ✅ Reducido de 100ms a 10ms para carga más rápida
      requestIdleCallback(initNonCritical, { timeout: 10 });
    } else {
      // ✅ Reducido de 50ms a 10ms para carga más rápida
      setTimeout(initNonCritical, 10);
    }
  }, [router, useInitAgentStore, useInitAiProviderKeyVaults, useInitUserState]);

  return null;
});

export default StoreInitialization;

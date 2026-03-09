'use client';

import { useRouter } from 'next/navigation';
import { memo, useEffect } from 'react';

import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useUserStore } from '@/store/user';
import { performanceMonitor } from '@/utils/performanceMonitor';

import { AppLoadingStage } from '../stage';

interface RedirectProps {
  setActiveStage: (value: AppLoadingStage) => void;
}

const Redirect = memo<RedirectProps>(({ setActiveStage }) => {
  const router = useRouter();
  const isUserStateInit = useUserStore((s) => s.isUserStateInit);
  const isDBInited = useGlobalStore(systemStatusSelectors.isDBInited);

  const isPgliteNotEnabled = useGlobalStore(systemStatusSelectors.isPgliteNotEnabled);

  const navToChat = () => {
    // ✅ FIX: Verificar si ya estamos en una ruta que NO debe redirigir
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const routesToSkip = [
        '/wedding-creator',
        '/knowledge',
        '/discover',
        '/settings',
        '/dev-login',
        '/onboard',
      ];
      
      // Si estamos en una de estas rutas, NO redirigir
      if (routesToSkip.some(route => currentPath.includes(route))) {
        console.log('🚫 Skip redirect: Ya estamos en', currentPath);
        return;
      }
    }

    // ✅ MEDICIÓN: Medir redirección
    performanceMonitor.startPhase('REDIRECT_TO_CHAT');

    setActiveStage(AppLoadingStage.GoToChat);
    router.replace('/chat');

    // Finalizar medición después de un pequeño delay
    setTimeout(() => {
      performanceMonitor.endPhase('REDIRECT_TO_CHAT');
    }, 100);
  };

  useEffect(() => {
    // ✅ FIX CRÍTICO: Verificar ruta actual PRIMERO - si estamos en una ruta excluida, NO hacer NADA
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const routesToSkip = [
        '/wedding-creator',
        '/knowledge',
        '/discover',
        '/settings',
        '/dev-login',
        '/onboard',
      ];
      
      // Si estamos en una de estas rutas, NO hacer NADA - salir inmediatamente
      if (routesToSkip.some(route => currentPath.includes(route))) {
        console.log('🚫 [Redirect] Skip completo: Ya estamos en', currentPath, '- No redirigir');
        return; // ← SALIR INMEDIATAMENTE, no ejecutar nada más
      }
    }

    // ✅ Detectar bloqueos en redirección
    if (typeof window !== 'undefined' && (window as any).blockingDetector) {
      (window as any).blockingDetector.startOperation('Redirect_useEffect');
    }

    // ✅ OPTIMIZACIÓN ULTRA RÁPIDA: Redirigir inmediatamente sin esperar nada
    // La UI del chat se mostrará y los datos cargarán en background
    // Esto reduce el tiempo de carga de 30-180s a < 500ms

    performanceMonitor.startPhase('REDIRECT_DECISION');

    // Redirigir inmediatamente en todos los casos (excepto rutas excluidas)
    // La DB y el estado de usuario se cargarán en background
    setActiveStage(AppLoadingStage.GoToChat);

    // ✅ OPTIMIZACIÓN: Reducir delay de redirección de 50ms a 10ms para carga más rápida
    // Usar requestIdleCallback o setTimeout mínimo para no bloquear el render
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        navToChat();
        performanceMonitor.endPhase('REDIRECT_DECISION');

        // ✅ Finalizar detección de bloqueo
        if (typeof window !== 'undefined' && (window as any).blockingDetector) {
          (window as any).blockingDetector.endOperation('Redirect_useEffect');
        }
      }, { timeout: 10 }); // ✅ Reducido de 50ms a 10ms
    } else {
      setTimeout(() => {
        navToChat();
        performanceMonitor.endPhase('REDIRECT_DECISION');

        // ✅ Finalizar detección de bloqueo
        if (typeof window !== 'undefined' && (window as any).blockingDetector) {
          (window as any).blockingDetector.endOperation('Redirect_useEffect');
        }
      }, 10); // ✅ Reducido de 50ms a 10ms
    }

    // ✅ La DB y el estado de usuario se inicializarán en background
    // No bloqueamos la UI esperando estos procesos
  }, []);

  return null;
});

export default Redirect;

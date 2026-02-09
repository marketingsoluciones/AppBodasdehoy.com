'use client';

import { useRouter } from 'next/navigation';
import { memo, useEffect, useRef } from 'react';

import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

import { AppLoadingStage, SERVER_LOADING_STAGES } from '../stage';

interface RedirectProps {
  setLoadingStage: (value: AppLoadingStage) => void;
}

const Redirect = memo<RedirectProps>(({ setLoadingStage }) => {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  // ✅ FIX: Inicializar maxStageRef a 1 (Initializing) que es el estado inicial
  const maxStageRef = useRef(SERVER_LOADING_STAGES.indexOf(AppLoadingStage.Initializing));
  const [isLogin, isLoaded, isUserStateInit, isOnboard] = useUserStore((s) => [
    authSelectors.isLogin(s),
    authSelectors.isLoaded(s),
    s.isUserStateInit,
    s.isOnboard,
  ]);

  // ✅ FIX: Solo avanzar stage, nunca retroceder
  const safeSetStage = (stage: AppLoadingStage) => {
    const stageIndex = SERVER_LOADING_STAGES.indexOf(stage);
    if (stageIndex > maxStageRef.current) {
      maxStageRef.current = stageIndex;
      setLoadingStage(stage);
    }
  };

  // ✅ FIX: Función de redirección simplificada y más robusta
  const doRedirect = (target: string) => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    setLoadingStage(AppLoadingStage.GoToChat);
    router.replace(target);
  };

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
        '/chat', // ✅ También evitar redirigir si ya estamos en /chat
      ];

      // Si estamos en una de estas rutas, NO redirigir
      if (routesToSkip.some(route => currentPath.includes(route))) {
        console.log('🚫 Skip server redirect: Ya estamos en', currentPath);
        hasRedirectedRef.current = true; // Marcar como redirigido para evitar loops
        return;
      }
    }

    doRedirect('/chat');
  };

  // ✅ OPTIMIZACIÓN CRÍTICA: Timeout de emergencia MUY corto - 100ms
  // Si después de 100ms no hemos redirigido, forzar la redirección
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (!hasRedirectedRef.current) {
        console.warn('⚠️ Timeout de emergencia (100ms): redirigiendo al chat');
        navToChat();
      }
    }, 100); // ✅ Reducido a 100ms para respuesta ultra-rápida

    return () => clearTimeout(emergencyTimeout);
  }, []);

  useEffect(() => {
    // ✅ Si ya redirigimos, no hacer nada
    if (hasRedirectedRef.current) return;

    // ✅ Verificar si estamos en una ruta que NO debe mostrar loading
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const routesToSkip = [
        '/wedding-creator',
        '/knowledge',
        '/discover',
        '/settings',
        '/dev-login',
        '/onboard',
        '/chat',
      ];

      // Si ya estamos en una de estas rutas, marcar como redirigido y salir
      if (routesToSkip.some((route) => currentPath.includes(route))) {
        console.log('🚫 Skip loading redirect: Ya estamos en', currentPath);
        hasRedirectedRef.current = true;
        return;
      }
    }

    // if user auth state is not ready, wait (el timeout de 100ms nos rescatará)
    if (!isLoaded) {
      safeSetStage(AppLoadingStage.InitAuth);
      return;
    }

    // user is not logged in - ir directo al chat
    if (!isLogin) {
      doRedirect('/chat');
      return;
    }

    // if user state not init, wait (el timeout de 100ms nos rescatará)
    if (!isUserStateInit) {
      safeSetStage(AppLoadingStage.InitUser);
      return;
    }

    // ✅ FIX: Onboarding deshabilitado - página /onboard no existe
    // Ir directamente al chat sin importar el estado de onboard
    // if (!isOnboard) {
    //   doRedirect('/onboard');
    //   return;
    // }

    // finally go to chat
    doRedirect('/chat');
  }, [isUserStateInit, isLoaded, isOnboard, isLogin]);

  return null;
});

export default Redirect;

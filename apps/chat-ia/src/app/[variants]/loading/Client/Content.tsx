import dynamic from 'next/dynamic';
import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import FullscreenLoading from '@/components/Loading/FullscreenLoading';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { DatabaseLoadingState } from '@/types/clientDB';

import { AppLoadingStage, CLIENT_LOADING_STAGES } from '../stage';

const InitError = dynamic(() => import('./Error'), { ssr: false });

interface InitProps {
  setActiveStage: (value: string) => void;
}

const Init = memo<InitProps>(({ setActiveStage }) => {
  const useInitClientDB = useGlobalStore((s) => s.useInitClientDB);

  // ✅ CRÍTICO: NO permitir que la DB cambie el stage una vez que llegamos a GoToChat
  // La DB debe cargar en background sin afectar la UI
  // Usar una referencia para rastrear si ya redirigimos
  const hasRedirectedRef = useRef(false);

  useInitClientDB({
    onStateChange: (stage: string) => {
      // ✅ CRÍTICO: Si ya redirigimos, ignorar TODOS los cambios de estado de la DB
      // Esto previene que la DB haga retroceder el stage
      if (hasRedirectedRef.current) {
        console.log(`🚫 [DB] Ignorando cambio de estado a ${stage} - ya redirigimos`);
        return;
      }

      // ✅ Si el stage es GoToChat, marcar que ya redirigimos y no actualizar
      if (stage === AppLoadingStage.GoToChat) {
        hasRedirectedRef.current = true;
        console.log(`✅ [DB] Llegamos a GoToChat, marcando como redirigido`);
        return;
      }

      // ✅ Solo actualizar si no hemos redirigido
      // La DB puede cambiar el stage solo si no hemos llegado a GoToChat
      // Pero verificar que no sea un retroceso
      setActiveStage(stage);
    }
  });

  return null;
});

interface ContentProps {
  loadingStage: string;
  setActiveStage: (value: string) => void;
}

const Content = memo<ContentProps>(({ loadingStage, setActiveStage }) => {
  const { t } = useTranslation('common');
  const isPgliteNotInited = useGlobalStore(systemStatusSelectors.isPgliteNotInited);
  const isError = useGlobalStore((s) => s.initClientDBStage === DatabaseLoadingState.Error);
  const initClientDBStage = useGlobalStore((s) => s.initClientDBStage);
  const progressData = useGlobalStore((s) => s.initClientDBProcess);

  // ✅ OPTIMIZACIÓN: No mostrar loading screen si no es absolutamente necesario
  // Permitir que la UI se muestre inmediatamente mientras la DB carga en background
  const [forceContinue, setForceContinue] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);

  useEffect(() => {
    // ✅ Reducir tiempo de espera a 500ms máximo antes de mostrar UI
    // Si la DB no está lista en 500ms, continuar de todos modos
    if (isPgliteNotInited && !isError) {
      const quickTimeout = setTimeout(() => {
        console.log('⚡ Redirigiendo rápidamente, la DB se cargará en background');
        setSkipLoading(true);
        setForceContinue(true);
      }, 500); // ✅ Reducido de 3 minutos a 500ms

      // ✅ SOLUCIÓN RÁPIDA: Timeout reducido de 60s a 30 segundos
      const longTimeout = setTimeout(() => {
        console.warn('⚠️ Timeout: La base de datos no se inicializó después de 30 segundos, continuando de todos modos');
        setForceContinue(true);
        useGlobalStore.setState({ initClientDBStage: DatabaseLoadingState.Error });
      }, 30_000); // ✅ Reducido de 60s a 30s (30 segundos) como fallback

      return () => {
        clearTimeout(quickTimeout);
        clearTimeout(longTimeout);
      };
    }
  }, [isPgliteNotInited, isError]);

  // ✅ No mostrar loading screen si skipLoading es true
  // Esto permite que la UI se muestre inmediatamente
  const shouldShowInit = isPgliteNotInited && !forceContinue && !isError && !skipLoading;

  // ✅ MEJORADO: Mensajes más descriptivos para cada etapa con progreso detallado
  // ✅ Usar useMemo para recalcular cuando cambie el progreso
  const stages = useMemo(() => {
    const getStageMessage = (key: string): string => {
      // ✅ Mensajes base personalizados en español
      const baseMessages: Record<string, string> = {
        [AppLoadingStage.Idle]: 'Iniciando aplicación...',
        [AppLoadingStage.Initializing]: 'Inicializando sistema...',
        [DatabaseLoadingState.Initializing]: 'Preparando base de datos...',
        [DatabaseLoadingState.LoadingDependencies]: 'Descargando componentes necesarios...',
        [DatabaseLoadingState.LoadingWasm]: 'Cargando módulos del sistema...',
        [DatabaseLoadingState.Migrating]: 'Configurando base de datos...',
        [DatabaseLoadingState.Finished]: 'Finalizando configuración...',
        [DatabaseLoadingState.Ready]: 'Base de datos lista',
        [AppLoadingStage.InitUser]: 'Cargando tu información...',
        [AppLoadingStage.GoToChat]: 'Redirigiendo al chat...',
      };

      // ✅ Agregar progreso detallado si está disponible
      if (progressData && key === DatabaseLoadingState.LoadingDependencies && progressData.phase === 'dependencies') {
        return `Descargando componentes... (${progressData.progress || 0}%)`;
      }

      if (progressData && key === DatabaseLoadingState.LoadingWasm && progressData.phase === 'wasm') {
        return `Cargando módulos del sistema... (${progressData.progress || 0}%)`;
      }

      // Si tenemos un mensaje personalizado, usarlo
      if (baseMessages[key]) {
        return baseMessages[key];
      }

      // Fallback a traducción si no hay mensaje personalizado
      const baseMessage = t(`appLoading.${key}` as any);
      return baseMessage !== `appLoading.${key}` ? baseMessage : key;
    };

    return CLIENT_LOADING_STAGES.map((key) => getStageMessage(key));
  }, [progressData, t]);

  // ✅ FIX CRÍTICO: NO mostrar loading screen si estamos en /wedding-creator
  // Permitir que la página se cargue directamente sin mostrar loading
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const routesToSkip = [
      '/wedding-creator',
      '/knowledge',
      '/discover',
      '/settings',
      '/dev-login',
    ];
    
    // Si estamos en una de estas rutas, NO mostrar loading screen
    if (routesToSkip.some(route => currentPath.includes(route))) {
      console.log('🚫 [Loading Content] Skip loading screen: Ya estamos en', currentPath);
      return null; // No mostrar loading, permitir que la página se cargue
    }
  }

  // ✅ Mostrar indicador mínimo en GoToChat/Initializing/InitUser para evitar pantalla en blanco
  // mientras el Redirect hace router.replace('/chat')
  if (
    loadingStage === AppLoadingStage.GoToChat ||
    loadingStage === AppLoadingStage.Initializing ||
    loadingStage === AppLoadingStage.InitUser
  ) {
    return (
      <div aria-label="Cargando" className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white" role="status">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
        <p className="mt-4 text-gray-500">Cargando...</p>
        <p className="mt-1 text-sm text-gray-400">Si ves esto, la app está respondiendo</p>
      </div>
    );
  }

  // ✅ CRÍTICO: NO mostrar Init si ya estamos en GoToChat o si ya redirigimos
  // Esto previene que la DB pueda cambiar el stage después de redirigir
  const shouldShowInitComponent = shouldShowInit &&
    loadingStage !== AppLoadingStage.GoToChat &&
    !skipLoading;

  return (
    <>
      {shouldShowInitComponent && <Init setActiveStage={setActiveStage} />}
      <FullscreenLoading
        activeStage={CLIENT_LOADING_STAGES.indexOf(loadingStage)}
        contentRender={isError && <InitError />}
        stages={stages}
      />
    </>
  );
});

export default Content;

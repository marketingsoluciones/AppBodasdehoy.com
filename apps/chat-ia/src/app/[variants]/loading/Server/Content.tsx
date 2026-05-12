import React, { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import FullscreenLoading from '@/components/Loading/FullscreenLoading';

import { AppLoadingStage, SERVER_LOADING_STAGES } from '../stage';

interface ContentProps {
  loadingStage: AppLoadingStage;
}

// ✅ Rutas que NO deben mostrar el loading screen
const ROUTES_TO_SKIP = [
  '/wedding-creator',
  '/knowledge',
  '/discover',
  '/settings',
  '/login',
  '/onboard',
  '/chat',
];

const Content = memo<ContentProps>(({ loadingStage }) => {
  const { t } = useTranslation('common');
  // ✅ FIX: Usar estado para evitar hydration mismatch
  // En SSR, siempre mostramos el loading (shouldShow = true)
  // En cliente, verificamos la ruta y actualizamos el estado
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    // Solo en cliente, verificar si debemos mostrar el loading
    const currentPath = window.location.pathname;
    const shouldSkip = ROUTES_TO_SKIP.some((route) => currentPath.includes(route));

    if (shouldSkip) {
      console.log('🚫 [Loading Content Server] Skip loading screen: Ya estamos en', currentPath);
      setShouldShow(false);
    }
  }, []);

  // ✅ Si determinamos que no debemos mostrar (después de hidratación), retornar null
  if (!shouldShow) {
    return null;
  }

  // ✅ Si ya llegamos al stage GoToChat, ocultar inmediatamente
  if (loadingStage === AppLoadingStage.GoToChat) {
    return null;
  }

  const activeStage = SERVER_LOADING_STAGES.indexOf(loadingStage);

  // Fallback en español para SSR (t() devuelve la clave cruda si i18n no está listo)
  const STAGE_FALLBACKS: Record<string, string> = {
    [AppLoadingStage.Idle]: 'Iniciando aplicación...',
    [AppLoadingStage.Initializing]: 'Inicializando sistema...',
    [AppLoadingStage.InitAuth]: 'Verificando sesión...',
    [AppLoadingStage.InitUser]: 'Cargando tu información...',
    [AppLoadingStage.GoToChat]: 'Abriendo chat...',
  };

  const stages = SERVER_LOADING_STAGES.map((key) => {
    const translated = t(`appLoading.${key}`);
    return translated !== `appLoading.${key}` ? translated : (STAGE_FALLBACKS[key] ?? key);
  });

  return <FullscreenLoading activeStage={activeStage} stages={stages} />;
});

export default Content;

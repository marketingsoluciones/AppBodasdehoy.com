'use client';

import { memo, useEffect, useState, useMemo } from 'react';

import { getDebugConfig } from '@/envs/debug';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';

import DevPanel from './index';

/**
 * Lista de emails con acceso al panel de debug (hardcoded + env)
 * Se combinan con NEXT_PUBLIC_DEBUG_ADMIN_EMAILS
 */
const HARDCODED_ADMIN_EMAILS: string[] = [
  'admin@bodasdehoy.com',
  'desarrollador@bodasdehoy.com',
  'ovgr3@yahoo.com', // Email del desarrollador principal
  'bodasdehoy.com@gmail.com', // Email principal del proyecto
];

/**
 * Verifica si el usuario tiene acceso al panel de debug
 *
 * Acceso permitido si:
 * 1. Email está en NEXT_PUBLIC_DEBUG_ADMIN_EMAILS o en lista hardcoded
 * 2. Dominio del email está en NEXT_PUBLIC_DEBUG_ADMIN_DOMAINS
 * 3. Flag 'debug-panel-enabled' = 'true' en localStorage
 * 4. NEXT_PUBLIC_DEVELOPER_DEBUG = '1'
 */
const isAdminUser = (email: string | undefined): boolean => {
  const debugConfig = getDebugConfig();

  // 0. Si DEBUG_MODE está habilitado, permitir acceso
  if (debugConfig.DEBUG_MODE) {
    return true;
  }

  // 1. Verificar localStorage para desarrollo local
  try {
    const debugEnabled = localStorage.getItem('debug-panel-enabled');
    if (debugEnabled === 'true') {
      return true;
    }
  } catch {
    // Ignore localStorage errors (SSR)
  }

  if (!email) return false;

  const normalizedEmail = email.toLowerCase();

  // 2. Verificar si está en la lista de admins (env + hardcoded)
  const allAdminEmails = [...debugConfig.DEBUG_ADMIN_EMAILS, ...HARDCODED_ADMIN_EMAILS];
  if (allAdminEmails.includes(normalizedEmail)) {
    return true;
  }

  // 3. Verificar si el dominio del email está permitido
  const emailDomain = normalizedEmail.split('@')[1];
  if (emailDomain && debugConfig.DEBUG_ADMIN_DOMAINS.includes(emailDomain)) {
    return true;
  }

  return false;
};

/**
 * Wrapper del DevPanel que controla el acceso basado en:
 * - Email del usuario (lista de admins via env o hardcoded)
 * - Dominio corporativo (configurado via env)
 * - Flag en localStorage para desarrollo
 * - Variable de entorno NEXT_PUBLIC_DEVELOPER_DEBUG
 * - NODE_ENV === 'development'
 *
 * Configurar en .env:
 * - NEXT_PUBLIC_DEBUG_ADMIN_EMAILS=admin@empresa.com,dev@empresa.com
 * - NEXT_PUBLIC_DEBUG_ADMIN_DOMAINS=bodasdehoy.com,miempresa.com
 * - NEXT_PUBLIC_DEVELOPER_DEBUG=1
 */
const DevPanelWrapper = memo(() => {
  const debugConfig = getDebugConfig();
  const userEmail = useUserStore(userProfileSelectors.email);
  const [isMounted, setIsMounted] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // ✅ MEJORA: Verificar parámetros de URL de forma más robusta
  // Usar useMemo para calcular una sola vez y evitar re-renders
  const urlDebugActive = useMemo(() => {
    if (typeof window === 'undefined') return false;

    try {
      // Verificar query parameters: ?debug=true, ?dev-panel=true, ?debug=1, etc.
      const urlParams = new URLSearchParams(window.location.search);
      const debugParam = urlParams.get('debug');
      const devPanelParam = urlParams.get('dev-panel');

      // Aceptar: true, 1, yes, on, enabled
      const debugValues = new Set(['true', '1', 'yes', 'on', 'enabled']);
      const isDebugParamActive = debugParam && debugValues.has(debugParam.toLowerCase());
      const isDevPanelParamActive = devPanelParam && debugValues.has(devPanelParam.toLowerCase());

      if (isDebugParamActive || isDevPanelParamActive) {
        // Guardar en localStorage para persistir
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('debug-panel-enabled', 'true');
        }
        return true;
      }

      // También verificar hash: #debug, #dev-panel, #debug-panel
      const hash = window.location.hash.toLowerCase();
      if (hash === '#debug' || hash === '#dev-panel' || hash === '#debug-panel') {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('debug-panel-enabled', 'true');
        }
        return true;
      }
    } catch (error) {
      // Ignore errors (SSR, etc.)
      console.warn('Error verificando parámetros de URL:', error);
    }

    return false;
  }, []); // Solo calcular una vez al montar

  // ✅ Función para verificar parámetros de URL (usada en useEffect)
  const checkUrlParams = (): boolean => {
    return urlDebugActive;
  };

  // ✅ MEJORA: Calcular estado inicial de forma síncrona para evitar delay
  const getInitialShowState = (): boolean => {
    // 0. Verificar parámetros de URL primero (más prioritario - funciona en producción también)
    if (checkUrlParams()) {
      return true;
    }

    // 1. Verificar DEBUG_MODE
    if (debugConfig.DEBUG_MODE) {
      return true;
    }

    // 2. En desarrollo, siempre mostrar
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      return true;
    }

    // 3. Verificar localStorage para desarrollo local Y producción
    if (typeof window !== 'undefined') {
      try {
        const debugEnabled = localStorage.getItem('debug-panel-enabled');
        if (debugEnabled === 'true') {
          return true;
        }
      } catch {
        // Ignore localStorage errors
      }
    }

    // 4. Verificar si es admin (solo si hay email)
    if (userEmail) {
      return isAdminUser(userEmail);
    }

    return false;
  };

  useEffect(() => {
    setIsMounted(true);
    // Calcular el estado inicial solo después del mount
    setShowPanel(getInitialShowState());
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const debugConfig = getDebugConfig();

    // ✅ CRÍTICO: Verificar parámetros de URL primero (máxima prioridad - funciona en producción)
    const urlActivated = checkUrlParams();
    if (urlActivated) {
      const urlInfo = typeof window !== 'undefined'
        ? `URL: ${window.location.search || window.location.hash}`
        : 'URL params';
      console.log('✅ DevPanel habilitado: Parámetro de URL detectado', urlInfo);
      setShowPanel(true);
      return;
    }

    // Log para debugging
    const urlInfo = typeof window !== 'undefined'
      ? {
          fullUrl: window.location.href,
          hash: window.location.hash,
          search: window.location.search,
        }
      : 'N/A';

    console.log('🔍 DevPanelWrapper - Verificando acceso:', {
      DEBUG_MODE: debugConfig.DEBUG_MODE,
      NODE_ENV: process.env.NODE_ENV,
      localStorage: typeof window !== 'undefined' ? localStorage.getItem('debug-panel-enabled') : 'N/A',
      showPanel,
      urlDebugActive,
      urlInfo,
      userEmail,
    });

    // 1. Verificar DEBUG_MODE
    if (debugConfig.DEBUG_MODE) {
      console.log('✅ DevPanel habilitado: DEBUG_MODE activo');
      setShowPanel(true);
      return;
    }

    // 2. En desarrollo, siempre mostrar
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ DevPanel habilitado: Modo desarrollo');
      setShowPanel(true);
      return;
    }

    // 3. Verificar localStorage (funciona en desarrollo Y producción)
    try {
      const debugEnabled = localStorage.getItem('debug-panel-enabled');
      if (debugEnabled === 'true') {
        console.log('✅ DevPanel habilitado: localStorage flag');
        setShowPanel(true);
        return;
      }
    } catch {
      // Ignore localStorage errors (SSR)
    }

    // 4. En producción, verificar si es admin (solo si no hay parámetro de URL)
    const isAdmin = isAdminUser(userEmail);
    setShowPanel(isAdmin);

    if (isAdmin) {
      console.log('✅ DevPanel habilitado para usuario admin:', userEmail || '(localStorage)');
    } else {
      console.log('❌ DevPanel deshabilitado - Usuario no tiene acceso. Usa ?debug=true en la URL para activar.');
    }
  }, [isMounted, userEmail, showPanel, urlDebugActive]);

  // Log cuando el componente se renderiza
  useEffect(() => {
    if (showPanel) {
      console.log('🎯 DevPanel renderizado y visible');
    } else {
      console.log('🚫 DevPanel NO renderizado (showPanel=false)');
    }
  }, [showPanel]);

  // No renderizar nada durante SSR para evitar problemas de hidratación
  if (!isMounted || !showPanel) {
    return null;
  }

  return <DevPanel />;
});

DevPanelWrapper.displayName = 'DevPanelWrapper';

export default DevPanelWrapper;















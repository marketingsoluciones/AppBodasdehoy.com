'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { PropsWithChildren, memo } from 'react';

import { withSuspense } from '@/components/withSuspense';
import { useCrossAppActiveEventSync } from '@/hooks/useCrossAppActiveEventSync';
import { useShowMobileWorkspace } from '@/hooks/useShowMobileWorkspace';
import { useStickyEventPerSession } from '@/hooks/useStickyEventPerSession';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import NavBar from './NavBar';

const CloudBanner = dynamic(() => import('@/features/AlertBanner/CloudBanner'));
const MOBILE_NAV_ROUTES = new Set([
  '/asistente',
  '/discover',
  '/discover/assistant',
  '/discover/mcp',
  '/discover/plugin',
  '/discover/model',
  '/discover/provider',
  '/me',
  // BUG-MOB QA 29-jun: /pendientes y /messages estaban fuera del set
  // → sin NavBar mobile, el user se sentía "fuera de contexto" en mobile.
  '/pendientes',
  '/bandeja',
  // Rediseño Fase B: /agentes (Cowork) también necesita NavBar móvil.
  '/agentes',
]);

const Layout = memo(({ children }: PropsWithChildren) => {
  const showMobileWorkspace = useShowMobileWorkspace();
  const pathname = usePathname();
  // P0 móvil (5-sep): en /asistente la barra inferior se ocultaba dentro del chat
  // (showMobileWorkspace=true por defecto) → el usuario quedaba ATRAPADO en el chat sin poder
  // navegar. La mostramos también en el chat del asistente para que la app siempre sea
  // navegable. El resto de rutas mantiene el comportamiento previo (bandeja tiene su propia barra).
  const showNav =
    MOBILE_NAV_ROUTES.has(pathname) && (pathname === '/asistente' || !showMobileWorkspace);

  // QA 30-jun: ver Desktop/index.tsx — defensa frente a featureFlags=undefined.
  const featureFlags = useServerConfigStore(featureFlagsSelectors) || {};
  const showCloudPromotion = (featureFlags as any).showCloudPromotion === true;

  useCrossAppActiveEventSync();
  useStickyEventPerSession();

  return (
    <>
      {showCloudPromotion && <CloudBanner mobile />}
      {children}
      {showNav && <NavBar />}
    </>
  );
});

Layout.displayName = 'MobileMainLayout';

export default withSuspense(Layout);

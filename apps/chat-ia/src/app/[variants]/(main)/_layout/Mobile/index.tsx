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
// P0 fricción 3 (5-sep): nudge de registro persistente para visitantes (captar data = KPI).
const GuestRegisterBanner = dynamic(() => import('@/features/GuestRegisterBanner'), { ssr: false });
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
  // P0 fricción 2 (5-sep): las secciones del menú "Más" no tenían NavBar → al entrar te
  // quedabas SIN navegación ("no puedes volver atrás"). Añadidas para que la barra persista.
  '/memories',
  '/files',
  '/wedding-creator',
  '/settings',
]);

const Layout = memo(({ children }: PropsWithChildren) => {
  const showMobileWorkspace = useShowMobileWorkspace();
  const pathname = usePathname();
  // P0 móvil (5-sep): en /asistente la barra inferior se ocultaba dentro del chat
  // (showMobileWorkspace=true por defecto) → el usuario quedaba ATRAPADO en el chat sin poder
  // navegar al resto de la app. La mostramos también en el chat del asistente. El resto de
  // rutas mantiene el comportamiento previo (p.ej. bandeja tiene su propia barra inferior).
  const isAsistente = pathname === '/asistente';
  const showNav = MOBILE_NAV_ROUTES.has(pathname) && (isAsistente || !showMobileWorkspace);

  // QA 30-jun: ver Desktop/index.tsx — defensa frente a featureFlags=undefined.
  const featureFlags = useServerConfigStore(featureFlagsSelectors) || {};
  const showCloudPromotion = (featureFlags as any).showCloudPromotion === true;

  useCrossAppActiveEventSync();
  useStickyEventPerSession();

  return (
    <>
      {showCloudPromotion && <CloudBanner mobile />}
      <GuestRegisterBanner />
      {children}
      {showNav && <NavBar />}
    </>
  );
});

Layout.displayName = 'MobileMainLayout';

export default withSuspense(Layout);

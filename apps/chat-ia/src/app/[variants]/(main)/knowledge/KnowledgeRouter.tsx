'use client';

import { App, Spin } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Center } from 'react-layout-kit';
import dynamic from 'next/dynamic';

// ✅ OPTIMIZACIÓN: Lazy loading de páginas para reducir bundle inicial
const KnowledgeBaseDetailPage = dynamic(() => import('./routes/KnowledgeBaseDetail'), {
  loading: () => <Center style={{ height: '100%' }}><Spin size="large" /></Center>,
  ssr: false,
});

const KnowledgeBasesListPage = dynamic(() => import('./routes/KnowledgeBasesList'), {
  loading: () => <Center style={{ height: '100%' }}><Spin size="large" /></Center>,
  ssr: false,
});

const KnowledgeHomePage = dynamic(() => import('./routes/KnowledgeHome'), {
  loading: () => <Center style={{ height: '100%' }}><Spin size="large" /></Center>,
  ssr: false,
});

/**
 * Hook para verificar si el usuario está logueado
 * Funcionalidad premium - disponible para usuarios con sesión activa
 * ✅ CORREGIDO: Acepta cualquier usuario logueado (no solo "registered" de API2)
 */
function useRequireRegisteredUser() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // ✅ OPTIMIZACIÓN: Deferir verificación para no bloquear render inicial
    const checkAuth = () => {
      try {
        const rawConfig = localStorage.getItem('dev-user-config');
        console.log('🔍 KnowledgeRouter: Verificando acceso...', { hasConfig: !!rawConfig });

        if (!rawConfig) {
          console.log('❌ KnowledgeRouter: No hay config en localStorage, redirigiendo a /chat');
          router.replace('/chat');
          setIsChecking(false);
          return;
        }

        // ✅ FIX: Manejo robusto de parsing JSON
        let config;
        try {
          if (!rawConfig.trim().startsWith('{') && !rawConfig.trim().startsWith('[')) {
            throw new Error('Raw config is not valid JSON');
          }
          config = JSON.parse(rawConfig);
        } catch (parseError) {
          console.warn('⚠️ Error parseando rawConfig en knowledge:', parseError);
          config = null;
        }
        // NOTA: dev-login guarda como "userId" (camelCase), no "user_id"
        const userId = config?.userId || config?.user_id;

        console.log('🔍 KnowledgeRouter: Config encontrada', {
          developer: config?.developer,
          userId: userId?.slice(0, 20),
          userType: config?.user_type
        });

        // ✅ CORREGIDO: Aceptar cualquier userId válido (email, teléfono, etc.)
        // Excluir solo valores genéricos de invitado
        const isValidUser = !!(
          userId &&
          userId !== 'guest' &&
          userId !== 'anonymous' &&
          userId !== '' &&
          userId !== 'visitante@guest.local'
        );

        if (!isValidUser) {
          console.log('❌ KnowledgeRouter: Usuario no válido, redirigiendo a /chat');
          router.replace('/chat');
          setIsChecking(false);
          return;
        }

        console.log('✅ KnowledgeRouter: Acceso permitido para:', userId);
        setIsRegistered(true);
      } catch (error) {
        console.error('❌ KnowledgeRouter: Error verificando acceso:', error);
        router.replace('/chat');
      } finally {
        setIsChecking(false);
      }
    };

    // ✅ Deferir verificación para permitir render inicial más rápido
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(checkAuth, { timeout: 100 });
    } else {
      setTimeout(checkAuth, 0);
    }
  }, [router]);

  return { isChecking, isRegistered };
}

// Get initial path from URL
const getInitialPath = () => {
  if (typeof window === 'undefined') return '/';
  const fullPath = window.location.pathname;
  const searchParams = window.location.search;
  const knowledgeIndex = fullPath.indexOf('/knowledge');

  if (knowledgeIndex !== -1) {
    const pathAfterKnowledge = fullPath.slice(knowledgeIndex + '/knowledge'.length) || '/';
    return pathAfterKnowledge + searchParams;
  }
  return '/';
};

// Helper component to sync URL with MemoryRouter
const UrlSynchronizer = () => {
  const location = useLocation();

  // Update browser URL when location changes
  useEffect(() => {
    const newUrl = `/knowledge${location.pathname}${location.search}`;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.pathname, location.search]);

  return null;
};

/**
 * Main Knowledge Router component with MemoryRouter
 * This serves as the entry point for all knowledge-related routes
 * Uses MemoryRouter with URL synchronization to support query parameters like ?file=[id]
 *
 * NOTA: Funcionalidad premium - solo usuarios registrados
 *
 * Route structure:
 * - / → Knowledge home (file list with categories)
 * - /bases → Knowledge bases list
 * - /bases/:id → Knowledge base detail (file list for specific base)
 */
const KnowledgeRouter = memo(() => {
  const { isChecking, isRegistered } = useRequireRegisteredUser();

  // Show loading while checking auth
  if (isChecking) {
    return (
      <Center style={{ height: '100%', width: '100%' }}>
        <Spin size="large" />
      </Center>
    );
  }

  // Only render if registered (redirect happens in hook)
  if (!isRegistered) {
    return (
      <Center style={{ height: '100%', width: '100%' }}>
        <Spin size="large" />
      </Center>
    );
  }

  return (
    <App style={{ display: 'flex', flex: 1, height: '100%' }}>
      <MemoryRouter initialEntries={[getInitialPath()]} initialIndex={0}>
        <UrlSynchronizer />
        <Routes>
          {/* Knowledge home - file list page */}
          <Route element={<KnowledgeHomePage />} path="/" />

          {/* Knowledge bases routes */}
          <Route element={<KnowledgeBasesListPage />} path="/bases" />
          <Route element={<KnowledgeBaseDetailPage />} path="/bases/:id" />

          {/* Fallback */}
          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </MemoryRouter>
    </App>
  );
});

KnowledgeRouter.displayName = 'KnowledgeRouter';

export default KnowledgeRouter;

'use client';

import { App, Spin } from 'antd';
import { memo, useEffect } from 'react';
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Center } from 'react-layout-kit';
import dynamic from 'next/dynamic';

// ISSUE-005 (informe dogfood 20-ago): /knowledge salía "shell vacío" a usuarios
// logueados. Causa: el guard propio (useRequireRegisteredUser) decidía acceso leyendo
// `dev-user-config` de localStorage — clave LEGACY de dev-login que un usuario Bodas por
// SSO/JWT NO tiene → caía a no-registrado → Spin/redirect infinito. Reusamos el gate
// CANÓNICO de la misma sección Biblioteca (/files): useDomainGuestUser + isPreferenceInit,
// sin redirect. Registrados ven Conocimiento completo (bases RAG + archivos); invitados,
// el muro claro con CTA de login. Coherente con la pestaña "Archivos".
import FileGuestGate from '../files/(content)/FileGuestGate';

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
  // Gate CANÓNICO de Biblioteca (mismo que /files): registrados ven todo; invitados, el
  // muro con CTA de login; durante el arranque de auth, un loader (sin falso-negativo).
  return (
    <FileGuestGate>
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
    </FileGuestGate>
  );
});

KnowledgeRouter.displayName = 'KnowledgeRouter';

export default KnowledgeRouter;

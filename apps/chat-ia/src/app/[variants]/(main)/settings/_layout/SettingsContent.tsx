'use client';

import dynamic from 'next/dynamic';
import { notFound, useRouter } from 'next/navigation';
import React, { CSSProperties, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import Loading from '@/components/Loading/BrandTextLoading';
import { useChatStore } from '@/store/chat';
import { SettingsTabs } from '@/store/global/initialState';

/**
 * BUG-NEW-01 QA #24 (27-jun): si accedes a /settings/llm desde URL externa,
 * el store chat aún no ha hidratado currentUserId → muestra el gate
 * "Configuración solo para usuarios registrados" pese a que el usuario SÍ
 * está autenticado vía cookie SSO Firebase. Fast-path: si hay JWT en
 * localStorage (cookie compartida .bodasdehoy.com) damos tiempo de gracia
 * para que el store se hidrate antes de mostrar el gate.
 */
function hasLocalJwtSettings(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const t = localStorage.getItem('mcp_jwt_token') || localStorage.getItem('jwt_token');
    if (t && t !== 'null' && t !== 'undefined' && t.length > 20) return true;
    const cfg = localStorage.getItem('dev-user-config');
    if (cfg) {
      const parsed = JSON.parse(cfg);
      if (parsed?.token && parsed.token !== 'null' && parsed.token.length > 20) return true;
    }
    // A3 QA #31 (28-jun): el SSO cross-app guarda `idTokenV0.1.0` en cookie
    // del dominio .bodasdehoy.com (SessionBridge). Si el usuario navega
    // directamente a /settings/llm antes de que los JWT lleguen a localStorage,
    // este helper debe detectar también la cookie para evitar el falso gate.
    if (typeof document !== 'undefined' && document.cookie) {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)idTokenV0\.1\.0=([^;]+)/);
      if (cookieMatch && cookieMatch[1] && cookieMatch[1].length > 20) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

const AUTH_GRACE_SETTINGS_MS = 5000;

const componentMap = {
  [SettingsTabs.Common]: dynamic(() => import('../common'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.Agent]: dynamic(() => import('../agent'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.Billing]: dynamic(() => import('../billing'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.LLM]: dynamic(() => import('../llm'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.Provider]: dynamic(() => import('../provider'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.Image]: dynamic(() => import('../image'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.TTS]: dynamic(() => import('../tts'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.About]: dynamic(() => import('../about'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.Hotkey]: dynamic(() => import('../hotkey'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.Proxy]: dynamic(() => import('../proxy'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.Storage]: dynamic(() => import('../storage'), {
    loading: () => <Loading />,
  }),
  [SettingsTabs.SystemAgent]: dynamic(() => import('../system-agent'), {
    loading: () => <Loading />,
  }),
};

interface SettingsContentProps {
  activeTab?: string;
  mobile?: boolean;
  showLLM?: boolean;
}

const SettingsContent = ({ mobile, activeTab, showLLM = true }: SettingsContentProps) => {
  const router = useRouter();
  const currentUserId = useChatStore((s) => s.currentUserId);
  const isAuthenticated = !!(currentUserId && currentUserId !== 'visitante@guest.local');

  // BUG-NEW-01: fast-path JWT + ventana de gracia para hidratación store.
  const [localJwtPresent, setLocalJwtPresent] = useState(false);
  const [graceElapsed, setGraceElapsed] = useState(false);
  useEffect(() => {
    setLocalJwtPresent(hasLocalJwtSettings());
    const t = setTimeout(() => setGraceElapsed(true), AUTH_GRACE_SETTINGS_MS);
    return () => clearTimeout(t);
  }, []);

  // Mientras el store no haya hidratado Y haya JWT local (o estemos dentro
  // de la gracia), mostrar spinner en lugar del gate "solo registrados".
  if (!isAuthenticated && localJwtPresent && !graceElapsed) {
    return (
      <Flexbox align="center" justify="center" style={{ minHeight: 400, width: '100%' }}>
        <Loading />
      </Flexbox>
    );
  }

  // BUG-A3 v3 QA #32 (28-jun, 5º build sin fix): el fast-path v2 solo
  // pasaba durante 5s de gracia. Tras gracia, si currentUserId seguía sin
  // hidratarse (mobile, cross-app SSO) → gate fallaba. Si tenemos cookie
  // SSO válida (.bodasdehoy.com idTokenV0.1.0) es señal DEFINITIVA de
  // user real → SIEMPRE pasar gate, no solo durante gracia.
  // Usuarios anónimos (sin cookie SSO Y sin currentUserId) sí ven gate.
  if (!isAuthenticated && !localJwtPresent) {
    return (
      <Flexbox
        align="center"
        gap={24}
        justify="center"
        style={{ minHeight: 400, padding: 48, textAlign: 'center', width: '100%' }}
      >
        <div style={{ fontSize: 48 }}>🔒</div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
            Configuración solo para usuarios registrados
          </h2>
          <p style={{ color: '#8c8c8c', fontSize: 14, margin: '0 0 24px', maxWidth: 360 }}>
            La configuración, facturación y ajustes están reservados para usuarios con cuenta.
            Vuelve al chat para continuar o inicia sesión desde la aplicación.
          </p>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              padding: '12px 24px',
            }}
          >
            Volver al chat
          </button>
        </div>
      </Flexbox>
    );
  }

  const shouldRenderLLMTabs = (tab: string) => {
    const isLLMTab =
      tab === SettingsTabs.LLM || tab === SettingsTabs.Provider || tab === SettingsTabs.Agent;
    return showLLM || !isLLMTab;
  };
  if (activeTab && !shouldRenderLLMTabs(activeTab)) {
    notFound();
  }
  const renderComponent = (tab: string) => {
    const Component = componentMap[tab as keyof typeof componentMap] || componentMap.common;
    if (!Component) return null;

    const componentProps: { mobile?: boolean } = {};
    if ([SettingsTabs.About, SettingsTabs.Agent, SettingsTabs.Provider].includes(tab as any)) {
      componentProps.mobile = mobile;
    }

    return <Component {...componentProps} />;
  };

  if (mobile) {
    return activeTab ? renderComponent(activeTab) : renderComponent(SettingsTabs.Common);
  }

  const getDisplayStyle = (tabName: string): CSSProperties => ({
    alignItems: 'center',
    display: activeTab === tabName ? 'flex' : 'none',
    flexDirection: 'column',
    gap: 64,
    height: '100%',
    paddingBlock:
      [SettingsTabs.Agent, SettingsTabs.Provider].includes(tabName as any) || mobile ? 0 : 24,
    paddingInline:
      [SettingsTabs.Agent, SettingsTabs.Provider].includes(tabName as any) || mobile ? 0 : 32,
    width: '100%',
  });

  return (
    <Flexbox height={'100%'} width={'100%'}>
      {Object.keys(componentMap).map((tabKey) => {
        if (!shouldRenderLLMTabs(tabKey)) return null;
        return (
          <div key={tabKey} style={getDisplayStyle(tabKey)}>
            {activeTab === tabKey && renderComponent(tabKey)}
          </div>
        );
      })}
    </Flexbox>
  );
};

export default SettingsContent;

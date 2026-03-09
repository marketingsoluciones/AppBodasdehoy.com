'use client';

import dynamic from 'next/dynamic';
import { notFound, useRouter } from 'next/navigation';
import React, { CSSProperties } from 'react';
import { Flexbox } from 'react-layout-kit';

import Loading from '@/components/Loading/BrandTextLoading';
import { useChatStore } from '@/store/chat';
import { SettingsTabs } from '@/store/global/initialState';

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

  // Usuarios anónimos no tienen acceso a configuración
  if (!isAuthenticated) {
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

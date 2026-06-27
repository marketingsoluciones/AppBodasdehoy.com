'use client';

import { createStyles } from 'antd-style';
import Link from 'next/link';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ConversationHistory from '../ConversationHistory';
import DefaultMode from '../DefaultMode';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    height: 100%;
  `,
  content: css`
    overflow-y: auto;
    flex: 1;
  `,
  tab: css`
    cursor: pointer;

    flex: 1;
    min-width: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 6px 4px;
    border: none;
    border-bottom: 2px solid transparent;
    border-radius: 0;

    font-size: 11px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
    text-align: center;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    background: transparent;

    transition: color 0.15s, border-color 0.15s, background 0.15s;

    &:hover {
      color: ${token.colorPrimary};
      background: ${token.colorPrimaryBg};
    }

    &.active {
      border-bottom-color: ${token.colorPrimary};
      color: ${token.colorPrimary};
      background: ${token.colorPrimaryBg};
    }
  `,
  tabsContainer: css`
    display: flex;
    align-items: stretch;
    gap: 0;

    margin-block-end: 8px;
    padding-inline: 6px;
    padding-block: 0;

    border-bottom: 1px solid ${token.colorBorderSecondary};
    min-height: 36px;
  `,
}));

// Plan rediseño chat-ia (commit 3bcec0be): tab "📥 Bandeja" eliminado del
// sidebar /chat. El sidebar de /chat ya NO duplica ChannelSidebar — para
// la bandeja completa el usuario va a /messages (link "Ver bandeja completa").
// Esto reduce instancias de ChannelSidebar simultáneas (de 3 a 1) y el
// número de SSE conexiones a /api/messages/stream.
type SubTabType = 'conversaciones' | 'historial';

const SubTabs = memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('chat');
  const [activeTab, setActiveTab] = useState<SubTabType>('conversaciones');

  return (
    <div className={styles.container}>
      {/* Sub-pestañas: Conversaciones (sesiones IA) | Historial (conversaciones backend).
          La bandeja completa (multicanal mensajería humanos) vive en /messages —
          ver link debajo de los tabs. */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'conversaciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversaciones')}
          type="button"
        >
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          💬 {(t as any)('conversations')}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
          type="button"
        >
          📋 Historial
        </button>
      </div>

      {/* Link a /messages — sustituye al antiguo tab "📥 Bandeja" inline.
          Evita duplicar ChannelSidebar dentro del sidebar de /chat. */}
      <Link
        href="/messages"
        style={{
          alignItems: 'center',
          color: '#7C3AED',
          display: 'flex',
          fontSize: 11,
          fontWeight: 600,
          gap: 6,
          justifyContent: 'center',
          padding: '6px 12px',
          textDecoration: 'none',
        }}
      >
        📥 Ver bandeja completa →
      </Link>

      {/* Contenido: solo sesiones IA o historial conversaciones backend. */}
      <div className={styles.content}>
        {activeTab === 'conversaciones' && <DefaultMode />}
        {activeTab === 'historial' && <ConversationHistory />}
      </div>
    </div>
  );
});

SubTabs.displayName = 'SubTabs';

export default SubTabs;


'use client';

import { createStyles } from 'antd-style';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BandejaView } from '@/app/[variants]/(main)/messages/components/BandejaView';
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

type SubTabType = 'conversaciones' | 'bandeja' | 'historial';

const SubTabs = memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('chat');
  const [activeTab, setActiveTab] = useState<SubTabType>('conversaciones');

  return (
    <div className={styles.container}>
      {/* Sub-pestañas: Conversaciones | Bandeja (canales + mensajes directos) | Historial */}
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
          className={`${styles.tab} ${activeTab === 'bandeja' ? 'active' : ''}`}
          onClick={() => setActiveTab('bandeja')}
          type="button"
        >
          📥 Bandeja
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
          type="button"
        >
          📋 Historial
        </button>
      </div>

      {/* Contenido: Bandeja = canales + mensajes directos; Historial = conversaciones API2 */}
      <div className={styles.content}>
        {activeTab === 'conversaciones' && <DefaultMode />}
        {activeTab === 'bandeja' && <BandejaView />}
        {activeTab === 'historial' && <ConversationHistory />}
      </div>
    </div>
  );
});

SubTabs.displayName = 'SubTabs';

export default SubTabs;


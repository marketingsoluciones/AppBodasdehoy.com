'use client';

import { createStyles } from 'antd-style';
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

    padding: 8px;
    border: 2px solid transparent;
    border-radius: 8px;

    font-size: 12px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
    text-align: center;

    background: white;

    transition: all 0.2s;

    &:hover {
      border-color: ${token.colorPrimaryBorder};
      color: ${token.colorPrimary};
    }

    &.active {
      border-color: ${token.colorPrimary};
      font-weight: 700;
      color: ${token.colorPrimary};
      box-shadow: 0 1px 3px rgba(0, 0, 0, 8%);
    }
  `,
  tabsContainer: css`
    display: flex;
    gap: 4px;

    margin-block-end: 16px;
    padding-block: 0;
    padding-inline: 8px;
  `,
}));

type SubTabType = 'conversaciones' | 'historial';

const SubTabs = memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('chat');
  const [activeTab, setActiveTab] = useState<SubTabType>('conversaciones');

  return (
    <div className={styles.container}>
      {/* Sub-pestañas */}
      <div className={styles.tabsContainer}>
        <button
            className={`${styles.tab} ${activeTab === 'conversaciones' ? 'active' : ''}`}
          onClick={() => setActiveTab('conversaciones')}
          type="button"
        >
          💬 {t('conversations')}
        </button>
        <button
            className={`${styles.tab} ${activeTab === 'historial' ? 'active' : ''}`}
          onClick={() => setActiveTab('historial')}
          type="button"
        >
          📥 {t('inboxTab')}
        </button>
      </div>

      {/* Contenido de las sub-pestañas */}
      <div className={styles.content}>
        {activeTab === 'conversaciones' ? <DefaultMode /> : <ConversationHistory />}
      </div>
    </div>
  );
});

SubTabs.displayName = 'SubTabs';

export default SubTabs;


'use client';

import { useDeveloperBranding } from '@/hooks/useDeveloperBranding';
import { FluentEmoji, Markdown } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import isEqual from 'fast-deep-equal';
import React, { memo, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';

import { useGreeting } from '@/hooks/useGreeting';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useWhitelabelMessages } from '@/hooks/useWhitelabelMessages';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { chatSelectors, topicSelectors } from '@/store/chat/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionMetaSelectors } from '@/store/session/selectors';

import AddButton from './AddButton';
import OpeningQuestions from './OpeningQuestions';

const useStyles = createStyles(({ css, responsive, token }) => ({
  container: css`
    align-items: center;
    ${responsive.mobile} {
      align-items: flex-start;
    }
  `,
  continueBtn: css`
    width: 100%;
    padding: 10px 20px;
    border-radius: 10px;
    background: ${token.colorPrimary};
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: opacity 0.15s;
    &:hover { opacity: 0.87; }
  `,
  continueModalCard: css`
    width: 100%;
    max-width: 400px;
    margin: 16px;
    border-radius: 16px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    padding: 28px 24px 20px;
    text-align: center;
  `,
  continueModalOverlay: css`
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(2px);
  `,
  desc: css`
    font-size: 14px;
    text-align: center;
    ${responsive.mobile} {
      text-align: start;
    }
  `,
  newChatBtn: css`
    width: 100%;
    padding: 10px 20px;
    border-radius: 10px;
    background: transparent;
    color: ${token.colorTextSecondary};
    font-size: 14px;
    font-weight: 500;
    border: 1px solid ${token.colorBorder};
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: ${token.colorFillTertiary}; }
  `,
  title: css`
    margin-block: 0.2em 0;
    font-size: 32px;
    font-weight: bolder;
    line-height: 1;
    ${responsive.mobile} {
      font-size: 24px;
    }
  `,
}));

const InboxWelcome = memo(() => {
  const { t } = useTranslation(['welcome', 'chat']);
  const { styles } = useStyles();
  const mobile = useIsMobile();
  const greeting = useGreeting();
  const { showCreateSession } = useServerConfigStore(featureFlagsSelectors);
  const openingQuestions = useAgentStore(agentSelectors.openingQuestions);

  // Modal "continuar última conversación"
  const [modalDismissed, setModalDismissed] = useState(false);
  const topics = useChatStore(topicSelectors.currentTopics);
  const activeTopicId = useChatStore((s) => s.activeTopicId);
  const switchTopic = useChatStore((s) => s.switchTopic);
  const currentUserId = useChatStore((s) => s.currentUserId);
  const isGuest = !currentUserId ||
    currentUserId === 'visitante@guest.local' ||
    currentUserId === 'guest' ||
    currentUserId === 'anonymous' ||
    currentUserId?.startsWith('visitor_');
  const lastTopic = topics && topics.length > 0 ? topics[0] : null;
  const showContinueModal = !modalDismissed && !isGuest && !activeTopicId && !!lastTopic;

  // Obtener mensajes personalizados por marca blanca
  const {
    welcomeTitle,
    chatInitial,
    assistantName,
    loading: whitelabelLoading,
  } = useWhitelabelMessages();

  // Obtener nombre de la marca del developer
  const { branding } = useDeveloperBranding();
  const brandName = branding?.name || 'Asistente';

  const meta = useSessionStore(sessionMetaSelectors.currentAgentMeta, isEqual);

  const agentSystemRoleMsg = t('agentDefaultMessageWithSystemRole', {
    name: meta.title || assistantName || t('defaultAgent', { ns: 'chat' }),
    ns: 'chat',
  });
  const openingMessage = useAgentStore(agentSelectors.openingMessage);

  const showInboxWelcome = useChatStore(chatSelectors.showInboxWelcome);

  // Usar mensaje de whitelabel si está disponible, sino usar el mensaje del agente
  const message = useMemo(() => {
    // Para inbox welcome, priorizar mensaje de whitelabel
    if (showInboxWelcome && chatInitial && !whitelabelLoading) {
      return chatInitial;
    }
    if (openingMessage) return openingMessage;
    return agentSystemRoleMsg;
  }, [
    openingMessage,
    agentSystemRoleMsg,
    meta.description,
    chatInitial,
    showInboxWelcome,
    whitelabelLoading,
  ]);

  // Usar título de bienvenida de whitelabel si está en inbox welcome
  const displayGreeting = useMemo(() => {
    if (showInboxWelcome && welcomeTitle && !whitelabelLoading) {
      return welcomeTitle;
    }
    return greeting;
  }, [showInboxWelcome, welcomeTitle, greeting, whitelabelLoading]);

  return (
    <Center gap={12} padding={16} width={'100%'}>
      {showContinueModal && (
        <div className={styles.continueModalOverlay}>
          <div className={styles.continueModalCard}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>
              ¿Continuar donde lo dejaste?
            </h3>
            <p style={{ color: 'var(--ant-color-text-secondary, #888)', fontSize: 13, lineHeight: 1.5, margin: '0 0 20px' }}>
              Tienes una conversación reciente:{' '}
              <strong>{lastTopic!.title || 'Sin título'}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                className={styles.continueBtn}
                onClick={() => { switchTopic(lastTopic!.id); setModalDismissed(true); }}
                type="button"
              >
                Continuar conversación
              </button>
              <button
                className={styles.newChatBtn}
                onClick={() => setModalDismissed(true)}
                type="button"
              >
                Empezar nueva
              </button>
            </div>
          </div>
        </div>
      )}
      <Flexbox className={styles.container} gap={16} style={{ maxWidth: 800 }} width={'100%'}>
        <Flexbox align={'center'} gap={8} horizontal>
          <FluentEmoji emoji={'👋'} size={40} type={'anim'} />
          <h1 className={styles.title}>{displayGreeting}</h1>
        </Flexbox>
        <Markdown
          className={styles.desc}
          customRender={(dom, context) => {
            if (context.text.includes('<plus />')) {
              return (
                <Trans
                  components={{
                    br: <br />,
                    plus: <AddButton />,
                  }}
                  i18nKey="guide.defaultMessage"
                  ns="welcome"
                  values={{ appName: brandName }}
                />
              );
            }
            return dom;
          }}
          variant={'chat'}
        >
          {showInboxWelcome
            ? t(showCreateSession ? 'guide.defaultMessage' : 'guide.defaultMessageWithoutCreate', {
                appName: brandName,
              })
            : message}
        </Markdown>
        {openingQuestions.length > 0 && (
          <OpeningQuestions mobile={mobile} questions={openingQuestions} />
        )}
      </Flexbox>
    </Center>
  );
});

export default InboxWelcome;

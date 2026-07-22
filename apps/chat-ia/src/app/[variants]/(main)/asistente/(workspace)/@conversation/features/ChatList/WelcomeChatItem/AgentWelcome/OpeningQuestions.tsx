'use client';

import { Block } from '@lobehub/ui';
import { Button } from 'antd';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { useLoginModal } from '@/contexts/LoginModalContext';
import { useAuthCheck } from '@/hooks/useAuthCheck';

import { useSend } from '../../../ChatInput/useSend';

const useStyles = createStyles(({ css, token, responsive }) => ({
  card: css`
    padding-block: 8px;
    padding-inline: 16px;
    border-radius: 48px;
    background: ${token.colorBgContainer};

    ${responsive.mobile} {
      padding-block: 8px;
      padding-inline: 16px;
    }
  `,

  container: css`
    padding-block: 0;
    padding-inline: 0;
  `,

  expiredCta: css`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 12px;
    background: ${token.colorWarningBg};
    border: 1px solid ${token.colorWarningBorder};
    color: ${token.colorWarningText};
    font-size: 13px;
  `,

  title: css`
    color: ${token.colorTextDescription};
  `,
}));

interface OpeningQuestionsProps {
  mobile?: boolean;
  questions: string[];
}

const OpeningQuestions = memo<OpeningQuestionsProps>(({ mobile, questions }) => {
  const { t } = useTranslation('welcome');
  const [updateInputMessage] = useChatStore((s) => [s.updateInputMessage]);
  const { openLoginModal } = useLoginModal();
  const { needsRelogin } = useAuthCheck();

  const { styles } = useStyles();
  const { send: sendMessage } = useSend();

  // Sesión expirada: en vez de sugerencias de datos, mostrar CTA de login
  if (needsRelogin) {
    return (
      <div className={styles.expiredCta}>
        <span>⚠️ Tu sesión ha caducado. Las consultas sobre tus eventos no funcionarán hasta que vuelvas a iniciar sesión.</span>
        <Button onClick={() => openLoginModal('session_expired')} size="small" type="primary">
          Iniciar sesión
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <p className={styles.title}>{t('guide.questions.title')}</p>
      <Flexbox gap={8} horizontal wrap={'wrap'}>
        {questions.slice(0, mobile ? 2 : 5).map((question) => {
          return (
            <Block
              className={styles.card}
              clickable
              key={question}
              onClick={() => {
                updateInputMessage(question);
                sendMessage({ isWelcomeQuestion: true });
              }}
              paddingBlock={8}
              paddingInline={12}
              variant={'outlined'}
            >
              {question}
            </Block>
          );
        })}
      </Flexbox>
    </div>
  );
});

export default OpeningQuestions;

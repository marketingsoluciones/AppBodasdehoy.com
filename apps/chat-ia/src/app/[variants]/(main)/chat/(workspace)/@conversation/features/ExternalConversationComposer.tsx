'use client';

import { createStyles } from 'antd-style';
import { memo, useCallback, useState, type KeyboardEvent } from 'react';
import { Button, Input, message as antdMessage, Tooltip } from 'antd';

import { useSendExternalMessage } from '@/hooks/useSendExternalMessage';

const { TextArea } = Input;

const useStyles = createStyles(({ css, token }) => ({
  actions: css`
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  `,
  composer: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
  `,
  container: css`
    padding-block: 12px;
    padding-inline: 16px;
    border-block-start: 1px solid ${token.colorSplit};
    background: ${token.colorBgContainer};
  `,
  hint: css`
    font-size: 12px;
    color: ${token.colorTextTertiary};
  `,
}));

interface ExternalConversationComposerProps {
  channel?: string;
  development?: string;
  isGroup?: boolean;
  sessionId?: string | null;
  sessionType?: string;
}

const ExternalConversationComposer = memo<ExternalConversationComposerProps>(
  ({ sessionId, development, sessionType, isGroup, channel }) => {
    const { styles } = useStyles();
    const [value, setValue] = useState('');
    const [messageApi, contextHolder] = antdMessage.useMessage();

    const sendMessageMutation = useSendExternalMessage(sessionId);

    const handleSend = useCallback(async () => {
      const text = value.trim();
      if (!text || !sessionId) {
        return;
      }

      try {
        await sendMessageMutation.mutateAsync({
          channel,
          development,
          isGroup,
          message: text,
          sessionType,
        });

        setValue('');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo enviar el mensaje';
        messageApi.error(message);
      }
    }, [
      value,
      sessionId,
      sendMessageMutation,
      development,
      sessionType,
      isGroup,
      channel,
      messageApi,
    ]);

    const handleKeyDown = useCallback(
      (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          void handleSend();
        }
      },
      [handleSend]
    );

    const disabled = !sessionId || sendMessageMutation.isPending;

    return (
      <div className={styles.container}>
        {contextHolder}
        <div className={styles.composer}>
          <TextArea
            autoSize={{ maxRows: 6, minRows: 2 }}
            disabled={disabled}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje para enviar al contacto..."
            value={value}
          />
          <div className={styles.actions}>
            <div className={styles.hint}>Presiona Enter para enviar • Shift + Enter para salto de línea</div>
            <Tooltip title={disabled ? 'Selecciona una conversación para enviar mensajes' : undefined}>
              <Button
                disabled={disabled || !value.trim()}
                loading={sendMessageMutation.isPending}
                onClick={() => void handleSend()}
                type="primary"
              >
                Enviar
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
);

ExternalConversationComposer.displayName = 'ExternalConversationComposer';

export default ExternalConversationComposer;




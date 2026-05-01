'use client';

import { createStyles } from 'antd-style';
import dynamic from 'next/dynamic';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatInputStore } from '@/features/ChatInput/store';

import SendArea from '../SendArea';

const FilePreview = dynamic(() => import('./FilePreview'), { ssr: false });
const ChatInput = dynamic(() => import('@lobehub/editor/react').then((m) => m.ChatInput), {
  ssr: false,
});
const ChatInputActionBar = dynamic(
  () => import('@lobehub/editor/react').then((m) => m.ChatInputActionBar),
  { ssr: false },
);
const InputEditor = dynamic(() => import('../InputEditor'), { ssr: false });
const ActionBar = dynamic(() => import('../ActionBar'), { ssr: false });

const useStyles = createStyles(({ css, token }) => ({
  container: css``,
  fullscreen: css`
    position: absolute;
    z-index: 100;
    inset: 0;

    width: 100%;
    height: 100%;
    padding: 12px;

    background: ${token.colorBgLayout};
  `,
}));

const DesktopChatInput = memo(() => {
  const [ready, setReady] = useState(false);
  const [slashMenuRef, expand] = useChatInputStore((s) => [s.slashMenuRef, s.expand]);
  const leftActions = useChatInputStore((s) => s.leftActions);

  const { styles, cx } = useStyles();

  const fileNode = leftActions.flat().includes('fileUpload') && <FilePreview />;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => setReady(true), { timeout: 1500 });
      return;
    }

    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {!expand && fileNode}
      <Flexbox
        className={cx(styles.container, expand && styles.fullscreen)}
        paddingBlock={'0 12px'}
        paddingInline={12}
      >
        {ready ? (
          <ChatInput
            footer={
              <ChatInputActionBar
                left={<div />}
                right={<SendArea />}
                style={{
                  paddingRight: 8,
                }}
              />
            }
            fullscreen={expand}
            header={<ChatInputActionBar left={<ActionBar />} />}
            slashMenuRef={slashMenuRef}
          >
            {expand && fileNode}
            <InputEditor defaultRows={1} />
          </ChatInput>
        ) : (
          <div style={{ height: 48 }} />
        )}
      </Flexbox>
    </>
  );
});

DesktopChatInput.displayName = 'DesktopChatInput';

export default DesktopChatInput;

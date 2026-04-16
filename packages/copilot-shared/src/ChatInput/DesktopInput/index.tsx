'use client';

import { ChatInput, ChatInputActionBar } from '@lobehub/editor/react';
import { createStyles } from 'antd-style';
import { memo, useEffect, useRef } from 'react';
import { Flexbox } from 'react-layout-kit';

import ActionBar from '../ActionBar';
import InputEditor from '../InputEditor';
import SendArea from '../SendArea';
import TypoBar from '../TypoBar';
import { useChatInputStore } from '../store';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    margin-block-start: -5px;

    .show-on-hover {
      opacity: 0;
    }

    &:hover {
      .show-on-hover {
        opacity: 1;
      }
    }
  `,
  fullscreen: css`
    position: absolute;
    z-index: 100;
    inset: 0;

    width: 100%;
    height: 100%;
    padding: 12px;

    background: ${(token as any).colorBgContainerSecondary ?? token.colorBgContainer};
  `,
}));

interface DesktopInputProps {
  /** Default height for the input area */
  defaultHeight?: number;
  /** Show footnote below the input */
  showFootnote?: boolean;
  /** Session key — changes cause editor to focus */
  chatKey?: string;
}

const DesktopInput = memo<DesktopInputProps>(({ defaultHeight = 32, showFootnote, chatKey }) => {
  const { styles, cx } = useStyles();
  const [slashMenuRef, expand, showTypoBar, editor, leftActions] = useChatInputStore((s) => [
    s.slashMenuRef,
    s.expand,
    s.showTypoBar,
    s.editor,
    s.leftActions,
  ]);

  // Focus editor when chat session changes
  useEffect(() => {
    if (editor) editor.focus();
  }, [chatKey, editor]);

  const hasFileUpload = leftActions.flat().includes('fileUpload');

  return (
    <>
      <Flexbox
        className={cx(styles.container, expand && styles.fullscreen)}
        gap={8}
        paddingBlock={showFootnote ? '0 8px' : '0 12px'}
        paddingInline={12}
      >
        <ChatInput
          defaultHeight={defaultHeight}
          footer={
            <ChatInputActionBar
              left={<ActionBar />}
              right={<SendArea />}
              style={{ paddingRight: 8 }}
            />
          }
          fullscreen={expand}
          header={showTypoBar && <TypoBar />}
          maxHeight={320}
          minHeight={36}
          resize={true}
          slashMenuRef={slashMenuRef}
        >
          <InputEditor />
        </ChatInput>
      </Flexbox>
    </>
  );
});

DesktopInput.displayName = 'DesktopInput';

export default DesktopInput;

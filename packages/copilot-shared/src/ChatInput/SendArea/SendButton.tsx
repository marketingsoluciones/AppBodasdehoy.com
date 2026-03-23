'use client';

import { SendButton as Send } from '@lobehub/editor/react';
import { memo } from 'react';
import { shallow } from 'zustand/shallow';

import { selectors, useChatInputStore } from '../store';

const SendButton = memo(() => {
  const sendMenu = useChatInputStore((s) => s.sendMenu);
  const shape = useChatInputStore((s) => s.sendButtonProps?.shape);
  const { generating, disabled } = useChatInputStore(selectors.sendButtonProps, shallow);
  const [send, handleStop] = useChatInputStore((s) => [s.handleSendButton, s.handleStop]);

  return (
    <Send
      disabled={disabled}
      generating={generating}
      menu={sendMenu as any}
      onClick={() => send()}
      onStop={() => handleStop()}
      placement={'topRight'}
      shape={shape}
      trigger={['hover']}
    />
  );
});

SendButton.displayName = 'SendButton';

export default SendButton;

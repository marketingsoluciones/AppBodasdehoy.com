import { SendButton as Send } from '@lobehub/editor/react';
import isEqual from 'fast-deep-equal';
import { memo } from 'react';

import { selectors, useChatInputStore } from '../store';

const SendButton = memo(() => {
  const sendMenu = useChatInputStore((s) => s.sendMenu);
  const shape = useChatInputStore((s) => s.sendButtonProps?.shape);
  const { generating, disabled } = useChatInputStore(selectors.sendButtonProps, isEqual);
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
      // QA Bug#8: 'hover' abría el menú de modo-de-envío al acercar el ratón (un clic
      // ligeramente desviado abría el menú en vez de enviar). 'click' = solo al pulsar
      // la flecha del split-button (UX estándar).
      trigger={['click']}
    />
  );
});

SendButton.displayName = 'SendButton';

export default SendButton;

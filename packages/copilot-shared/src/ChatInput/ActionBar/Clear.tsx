'use client';

import { Popconfirm } from 'antd';
import { Eraser } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCopilotInput } from '../CopilotInputContext';
import { useChatInputStore } from '../store';
import Action from './Action';

const Clear = memo(() => {
  const { t } = useTranslation('chat');
  const { onClear } = useCopilotInput();
  const editor = useChatInputStore((s) => s.editor);
  const [confirmOpened, setConfirmOpened] = useState(false);

  // BUG QA 10-jul #3: el Popconfirm de "Limpiar conversación" quedaba
  // huérfano encima de la respuesta del Copilot con Cancel/OK persistente.
  // Causa: onConfirm ejecutaba handleClear pero NO cerraba el popover
  // controlado (open={confirmOpened} sin setConfirmOpened(false) en el
  // handler). Además si se cancelaba con la tecla Esc o click fuera,
  // onOpenChange dependía de antd. Cierre explícito en confirm + cancel.
  const handleClear = async () => {
    editor?.cleanDocument();
    onClear?.();
    setConfirmOpened(false);
  };

  return (
    <Popconfirm
      arrow={false}
      okButtonProps={{ danger: true, type: 'primary' }}
      onConfirm={handleClear}
      onCancel={() => setConfirmOpened(false)}
      onOpenChange={setConfirmOpened}
      open={confirmOpened}
      placement={'topRight'}
      title={
        <div style={{ marginBottom: 8, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
          {t('confirmClearCurrentMessages', '¿Limpiar la conversación?')}
        </div>
      }
    >
      <Action
        icon={Eraser}
        title={confirmOpened ? undefined : t('clearCurrentMessages', 'Limpiar conversación')}
      />
    </Popconfirm>
  );
});

export default Clear;

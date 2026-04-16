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

  const handleClear = async () => {
    editor?.cleanDocument();
    onClear?.();
  };

  return (
    <Popconfirm
      arrow={false}
      okButtonProps={{ danger: true, type: 'primary' }}
      onConfirm={handleClear}
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

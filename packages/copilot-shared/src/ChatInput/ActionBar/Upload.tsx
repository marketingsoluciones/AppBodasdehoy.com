'use client';

import { ActionIcon } from '@lobehub/ui';
import { Upload as AntUpload } from 'antd';
import { FileUp } from 'lucide-react';
import { memo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useCopilotInput } from '../CopilotInputContext';
import Action from './Action';

const Upload = memo(() => {
  const { t } = useTranslation('chat');
  const { fileUploadEnabled, onFileUpload } = useCopilotInput();

  if (!fileUploadEnabled) return null;

  return (
    <AntUpload
      accept="image/*,.pdf,.txt,.md,.csv,.json"
      beforeUpload={(file) => {
        onFileUpload?.([file as unknown as File]);
        return false;
      }}
      multiple
      showUploadList={false}
    >
      <Action
        icon={FileUp}
        title={t('upload.clientMode.actionFiletip', 'Adjuntar archivo')}
      />
    </AntUpload>
  );
});

export default Upload;

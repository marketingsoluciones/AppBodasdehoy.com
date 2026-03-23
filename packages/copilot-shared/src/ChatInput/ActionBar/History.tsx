'use client';

import { ClockIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useCopilotInput } from '../CopilotInputContext';
import Action from './Action';

const History = memo(() => {
  const { t } = useTranslation('chat');
  const { onHistoryToggle } = useCopilotInput();

  if (!onHistoryToggle) return null;

  return (
    <Action
      icon={ClockIcon}
      onClick={onHistoryToggle}
      title={t('topic.newTopic', 'Historial')}
    />
  );
});

export default History;

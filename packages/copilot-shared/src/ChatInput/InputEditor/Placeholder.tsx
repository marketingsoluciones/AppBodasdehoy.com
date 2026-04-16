import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const Placeholder = memo(() => {
  const { t } = useTranslation('chat');
  return <span>{t('input.placeholder', 'Escribe un mensaje...')}</span>;
});

Placeholder.displayName = 'Placeholder';

export default Placeholder;

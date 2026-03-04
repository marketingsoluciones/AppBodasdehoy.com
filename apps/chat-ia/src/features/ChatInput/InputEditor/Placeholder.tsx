import { KeyEnum } from '@lobechat/types';
import { Hotkey, combineKeys } from '@lobehub/ui';
import { memo, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useWhitelabelMessages } from '@/hooks/useWhitelabelMessages';
import { useUserStore } from '@/store/user';
import { preferenceSelectors } from '@/store/user/selectors';

const Placeholder = memo(() => {
  const { t } = useTranslation(['editor', 'chat']);

  // Obtener placeholder personalizado por marca blanca
  const { inputPlaceholder, loading: whitelabelLoading } = useWhitelabelMessages();

  const useCmdEnterToSend = useUserStore(preferenceSelectors.useCmdEnterToSend);
  const wrapperShortcut = useCmdEnterToSend
    ? KeyEnum.Enter
    : combineKeys([KeyEnum.Mod, KeyEnum.Enter]);

  // Usar placeholder de whitelabel si está disponible
  const displayPlaceholder = useMemo(() => {
    if (inputPlaceholder && !whitelabelLoading) {
      return inputPlaceholder.replace('...', ', ');
    }
    return t('sendPlaceholder', { ns: 'chat' }).replace('...', ', ');
  }, [inputPlaceholder, whitelabelLoading, t]);

  return (
    <Flexbox align={'center'} as={'span'} gap={4} horizontal>
      {displayPlaceholder}
      <Trans
        as={'span'}
        components={{
          key: (
            <Hotkey
              as={'span'}
              keys={wrapperShortcut}
              style={{ color: 'inherit' }}
              styles={{ kbdStyle: { color: 'inhert' } }}
              variant={'borderless'}
            />
          ),
        }}
        i18nKey={'input.warpWithKey'}
        ns={'chat'}
      />
      {'...'}
    </Flexbox>
  );
});

export default Placeholder;

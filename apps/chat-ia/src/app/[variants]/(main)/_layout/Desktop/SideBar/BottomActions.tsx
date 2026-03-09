import { ActionIcon, ActionIconProps } from '@lobehub/ui';
import { FlaskConical, Github, LogIn } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { GITHUB } from '@/const/url';
import { useChatStore } from '@/store/chat';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

const ICON_SIZE: ActionIconProps['size'] = {
  blockSize: 36,
  size: 20,
  strokeWidth: 1.5,
};

const BottomActions = memo(() => {
  const { t } = useTranslation('common');
  const { hideGitHub } = useServerConfigStore(featureFlagsSelectors);
  const currentUserId = useChatStore((s) => s.currentUserId);
  const isGuest = !currentUserId || currentUserId === 'visitante@guest.local';

  return (
    <Flexbox gap={8}>
      {isGuest && (
        <Link aria-label="Iniciar sesión" href="/login">
          <ActionIcon
            icon={LogIn}
            size={ICON_SIZE}
            style={{ color: '#667eea' }}
            title="Iniciar sesión / Registrarse"
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {!hideGitHub && (
        <Link aria-label={'GitHub'} href={GITHUB} target={'_blank'}>
          <ActionIcon
            icon={Github}
            size={ICON_SIZE}
            title={'GitHub'}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      <Link aria-label={t('labs')} href={'/labs'} suppressHydrationWarning>
        <ActionIcon
          icon={FlaskConical}
          size={ICON_SIZE}
          title={t('labs')}
          tooltipProps={{ placement: 'right' }}
        />
      </Link>
    </Flexbox>
  );
});

export default BottomActions;

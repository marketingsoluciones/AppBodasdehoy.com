'use client';

import { Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { MessageSquareHeart } from 'lucide-react';
import Link from 'next/link';
import { PropsWithChildren, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';

import { OFFICIAL_SITE } from '@/const/branding';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

const useStyles = createStyles(
  ({ css, token }) => css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
    a {
      color: ${token.colorLink};
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `,
);

export const LayoutSettingsFooterClassName = 'settings-layout-footer';

/**
 * Pie de la pantalla de ajustes. Mensaje de marca con enlace a nuestra web.
 * Si hideGitHub está activo en la config del servidor, el pie no se muestra.
 */
const Footer = memo<PropsWithChildren>(() => {
  const { t } = useTranslation('common');
  const { styles } = useStyles();
  const { hideGitHub } = useServerConfigStore(featureFlagsSelectors);

  if (hideGitHub) return null;

  return (
    <Flexbox className={LayoutSettingsFooterClassName} justify={'flex-end'}>
      <Center
        as={'footer'}
        className={styles}
        flex={'none'}
        horizontal
        padding={16}
        width={'100%'}
      >
        <div style={{ textAlign: 'center' }}>
          <Icon icon={MessageSquareHeart} /> {t('footer.brandingPrefix')}{' '}
          <Link href={OFFICIAL_SITE} rel="noopener noreferrer" target="_blank">
            {t('footer.brandingLink')}
          </Link>
        </div>
      </Center>
    </Flexbox>
  );
});

Footer.displayName = 'SettingFooter';

export default Footer;

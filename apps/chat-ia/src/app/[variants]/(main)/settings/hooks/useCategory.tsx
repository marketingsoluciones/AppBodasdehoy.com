import { Icon } from '@lobehub/ui';
import {
  Bot,
  Brain,
  CreditCard,
  Database,
  EthernetPort,
  Image as ImageIcon,
  Info,
  KeyboardIcon,
  Link2,
  Mic2,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { MenuProps } from '@/components/Menu';
import { isDeprecatedEdition, isDesktop } from '@/const/version';
import { SettingsTabs } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

/** Item de menú que navega a /settings/integrations (ver CategoryContent) */
export const SETTINGS_MENU_KEY_INTEGRATIONS = '__integrations';

export const useCategory = () => {
  const { t } = useTranslation('setting');
  const mobile = useServerConfigStore((s) => s.isMobile);
  const { showLLM, enableSTT, hideDocs } = useServerConfigStore(featureFlagsSelectors);
  const isLoggedIn = useUserStore(authSelectors.isLogin);

  const cateItems: MenuProps['items'] = useMemo(
    () =>
      [
        {
          icon: <Icon icon={Settings2} />,
          key: SettingsTabs.Common,
          label: t('tab.common'),
        },
        {
          icon: <Icon icon={Bot} />,
          key: SettingsTabs.Agent,
          label: t('tab.agent'),
        },
        !mobile && {
          icon: <Icon icon={KeyboardIcon} />,
          key: SettingsTabs.Hotkey,
          label: t('tab.hotkey'),
        },
        {
          type: 'divider',
        },
        showLLM &&
          // TODO: Remove /llm when v2.0
          (isDeprecatedEdition
            ? {
                icon: <Icon icon={Brain} />,
                key: SettingsTabs.LLM,
                label: t('tab.llm'),
              }
            : {
                icon: <Icon icon={Brain} />,
                key: SettingsTabs.Provider,
                label: t('tab.provider'),
              }),
        {
          icon: <Icon icon={ImageIcon} />,
          key: SettingsTabs.Image,
          label: t('tab.image'),
        },
        enableSTT && {
          icon: <Icon icon={Mic2} />,
          key: SettingsTabs.TTS,
          label: t('tab.tts'),
        },
        {
          icon: <Icon icon={Sparkles} />,
          key: SettingsTabs.SystemAgent,
          label: t('tab.system-agent'),
        },
        {
          type: 'divider',
        },
        isDesktop && {
          icon: <Icon icon={EthernetPort} />,
          key: SettingsTabs.Proxy,
          label: t('tab.proxy'),
        },
        // Base de datos, Facturación e Integraciones: solo para usuarios registrados
        isLoggedIn && {
          icon: <Icon icon={Database} />,
          key: SettingsTabs.Storage,
          label: t('tab.storage'),
        },
        isLoggedIn && {
          icon: <Icon icon={CreditCard} />,
          key: SettingsTabs.Billing,
          label: (t('tab.billing') && t('tab.billing') !== 'tab.billing') ? t('tab.billing') : 'Facturación',
        },
        isLoggedIn && {
          icon: <Icon icon={Link2} />,
          key: SETTINGS_MENU_KEY_INTEGRATIONS,
          label: 'Integraciones',
        },
        !hideDocs && {
          icon: <Icon icon={Info} />,
          key: SettingsTabs.About,
          label: t('tab.about'),
        },
      ].filter(Boolean) as MenuProps['items'],
    [t, showLLM, enableSTT, hideDocs, mobile, isLoggedIn],
  );

  return cateItems;
};

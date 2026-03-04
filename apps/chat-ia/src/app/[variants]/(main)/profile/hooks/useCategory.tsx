import { Icon } from '@lobehub/ui';
import { ChartColumnBigIcon, CreditCard, FileClockIcon, KeyIcon, Package, ShieldCheck, UserCircle, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import type { MenuProps } from '@/components/Menu';
import { enableAuth } from '@/const/auth';
import { isDeprecatedEdition } from '@/const/version';
import { ProfileTabs } from '@/store/global/initialState';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';

export const useCategory = () => {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const [isLoginWithClerk] = useUserStore((s) => [authSelectors.isLoginWithClerk(s)]);
  const { showApiKeyManage } = useServerConfigStore(featureFlagsSelectors);

  const cateItems: MenuProps['items'] = [
    {
      icon: <Icon icon={UserCircle} />,
      key: ProfileTabs.Profile,
      label: (
        <Link href={'/profile'} onClick={(e) => e.preventDefault()}>
          {t('tab.profile')}
        </Link>
      ),
    },
    !isDeprecatedEdition && {
      icon: <Icon icon={ChartColumnBigIcon} />,
      key: ProfileTabs.Stats,
      label: (
        <Link href={'/profile/stats'} onClick={(e) => e.preventDefault()}>
          {t('tab.stats')}
        </Link>
      ),
    },
    enableAuth &&
      isLoginWithClerk && {
        icon: <Icon icon={ShieldCheck} />,
        key: ProfileTabs.Security,
        label: (
          <Link href={'/profile/security'} onClick={(e) => e.preventDefault()}>
            {t('tab.security')}
          </Link>
        ),
      },
    !!showApiKeyManage && {
      icon: <Icon icon={KeyIcon} />,
      key: ProfileTabs.APIKey,
      label: (
        <Link href={'/profile/apikey'} onClick={(e) => e.preventDefault()}>
          {t('tab.apikey')}
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      icon: <Icon icon={CreditCard} />,
      key: 'billing',
      label: (
        <span
          onClick={(e) => {
            e.preventDefault();
            router.push('/settings?active=billing');
          }}
          style={{ cursor: 'pointer' }}
        >
          Facturación
        </span>
      ),
    },
    {
      icon: <Icon icon={Wallet} />,
      key: 'wallet',
      label: (
        <span
          onClick={(e) => {
            e.preventDefault();
            router.push('/settings?active=billing');
          }}
          style={{ cursor: 'pointer' }}
        >
          Mi Wallet
        </span>
      ),
    },
    {
      icon: <Icon icon={Package} />,
      key: 'packages',
      label: (
        <span
          onClick={(e) => {
            e.preventDefault();
            router.push('/settings/billing/packages/history');
          }}
          style={{ cursor: 'pointer' }}
        >
          Historial de Paquetes
        </span>
      ),
    },
    {
      icon: <Icon icon={FileClockIcon} />,
      key: 'transactions',
      label: (
        <span
          onClick={(e) => {
            e.preventDefault();
            router.push('/settings/billing/transactions');
          }}
          style={{ cursor: 'pointer' }}
        >
          Transacciones
        </span>
      ),
    },
  ].filter(Boolean) as MenuProps['items'];

  return cateItems;
};

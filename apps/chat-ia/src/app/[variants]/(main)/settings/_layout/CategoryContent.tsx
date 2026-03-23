'use client';

import { useRouter } from 'next/navigation';
import { memo } from 'react';

import Menu from '@/components/Menu';
import { withSuspense } from '@/components/withSuspense';
import { SettingsTabs } from '@/store/global/initialState';

import { SETTINGS_MENU_KEY_INTEGRATIONS, useCategory } from '../hooks/useCategory';

type CategoryContentProps = {
  activeTab: string | undefined;
  onMenuSelect: (key: SettingsTabs) => void;
};

const CategoryContent = memo((props: CategoryContentProps) => {
  const router = useRouter();
  const cateItems = useCategory();

  const { onMenuSelect, activeTab } = props;

  return (
    <Menu
      compact
      defaultSelectedKeys={[activeTab || SettingsTabs.Common]}
      items={cateItems}
      onClick={({ key }) => {
        if (key === SETTINGS_MENU_KEY_INTEGRATIONS) {
          router.push('/settings/integrations');
          return;
        }
        onMenuSelect(key as SettingsTabs);
      }}
      selectable
    />
  );
});

export default withSuspense(CategoryContent);

'use client';

import { usePathname } from 'next/navigation';
import { memo } from 'react';
import urlJoin from 'url-join';

import Menu from '@/components/Menu';
import { useQueryRoute } from '@/hooks/useQueryRoute';
import { ProfileTabs } from '@/store/global/initialState';

import { useCategory } from '../../hooks/useCategory';

const CategoryContent = memo(() => {
  const pathname = usePathname();
  const activeTab = pathname.split('/').at(-1);
  const cateItems = useCategory();
  const router = useQueryRoute();

  return (
    <Menu
      compact
      items={cateItems}
      onClick={({ key }) => {
        // ✅ FIX: Manejar rutas especiales de facturación que van a /settings
        if (['billing', 'wallet', 'packages', 'transactions'].includes(key)) {
          // Estas rutas ya manejan su propia navegación en el onClick del label
          return;
        }
        
        const activeKey = key === ProfileTabs.Profile ? '/' : key;
        router.push(urlJoin('/profile', activeKey));
      }}
      selectable
      selectedKeys={activeTab ? [activeTab] : []}
    />
  );
});

export default CategoryContent;

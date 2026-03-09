'use client';

import { ActionIcon } from '@lobehub/ui';
import { Drawer } from 'antd';
import { createStyles } from 'antd-style';
import { MenuIcon } from 'lucide-react';
import { memo, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';
import { useNavigate } from 'react-router-dom';

import Menu from '@/components/Menu';
import { withSuspense } from '@/components/withSuspense';
import { DiscoverTab } from '@/types/discover';

import { useNav } from '../../../features/useNav';

export const useStyles = createStyles(({ css, token }) => ({
  activeNavItem: css`
    background: ${token.colorFillTertiary};
  `,
  container: css`
    height: auto;
    padding-block: 4px;
    background: ${token.colorBgLayout};
  `,
  navItem: css`
    font-weight: 500;
  `,
  title: css`
    font-size: 18px;
    font-weight: 700;
    line-height: 1.2;
  `,
}));

const Nav = memo(() => {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { styles, theme } = useStyles();
  const navData = useNav();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Solo usar los datos de navegación después del mount para evitar problemas de hidratación
  const { activeItem, activeKey, items } = isMounted ? navData : {
    activeItem: null,
    activeKey: DiscoverTab.Home,
    items: [],
  };

  return (
    <>
      <Flexbox
        align={'center'}
        className={styles.title}
        gap={4}
        horizontal
        suppressHydrationWarning
      >
        <ActionIcon
          color={theme.colorText}
          icon={MenuIcon}
          onClick={() => setOpen(true)}
          size={{ blockSize: 32, size: 18 }}
        />
        {isMounted && activeItem?.label}
      </Flexbox>

      <Drawer
        onClick={() => setOpen(false)}
        onClose={() => setOpen(false)}
        open={open}
        placement={'left'}
        rootStyle={{ position: 'absolute' }}
        style={{
          background: theme.colorBgLayout,
          borderRight: `1px solid ${theme.colorSplit}`,
          paddingTop: 44,
        }}
        styles={{
          body: {
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            justifyContent: 'space-between',
            padding: 16,
          },
          header: { display: 'none' },
        }}
        width={260}
        zIndex={10}
      >
        {isMounted ? (
          <Menu
            compact
            items={items}
            onClick={({ key }) => {
              if (key === DiscoverTab.Home) {
                navigate('/');
              } else {
                navigate(`/${key}`);
              }
            }}
            selectable
            selectedKeys={[activeKey]}
          />
        ) : (
          <div suppressHydrationWarning />
        )}
      </Drawer>
    </>
  );
});

export default withSuspense(Nav);

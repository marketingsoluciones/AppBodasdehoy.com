'use client';

import { createStyles } from 'antd-style';
import { Suspense, lazy, memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import ReloginBanner from '@/components/ReloginBanner';
import { withSuspense } from '@/components/withSuspense';
import InitClientDB from '@/features/InitClientDB';
import { useShowMobileWorkspace } from '@/hooks/useShowMobileWorkspace';

// BUG QA 10-jul #1: en desktop este modal se abre al recibir 402 insufficient_balance,
// pero en móvil no estaba montado → el error entraba al store pero el usuario percibía
// "escribiendo eterno" sin feedback. Añadir aquí para paridad desktop/móvil.
const InsufficientBalanceModal = lazy(() => import('@/features/InsufficientBalanceModal'));

import { LayoutProps } from './type';

const useStyles = createStyles(({ css, token }) => ({
  main: css`
    position: relative;
    overflow: hidden;
    background: ${token.colorBgLayout};
  `,
}));

const Layout = memo<LayoutProps>(({ children, session }) => {
  const showMobileWorkspace = useShowMobileWorkspace();
  const { styles } = useStyles();

  return (
    <>
      <ReloginBanner />
      <Flexbox
        className={styles.main}
        height="100%"
        style={showMobileWorkspace ? { display: 'none' } : undefined}
        width="100%"
      >
        {session}
      </Flexbox>
      <Flexbox
        className={styles.main}
        height="100%"
        style={showMobileWorkspace ? undefined : { display: 'none' }}
        width="100%"
      >
        {children}
      </Flexbox>
      <Suspense fallback={null}>
        <InitClientDB bottom={100} />
      </Suspense>
      <Suspense fallback={null}>
        <InsufficientBalanceModal />
      </Suspense>
    </>
  );
});

Layout.displayName = 'MobileChatLayout';

export default withSuspense(Layout);

import dynamic from 'next/dynamic';
import React from 'react';

import ServerLayout from '@/components/server/ServerLayout';
import { DynamicLayoutProps } from '@/types/next';

import Desktop from './_layout/Desktop';
import Mobile from './_layout/Mobile';
import SessionHydration from './features/SessionHydration';
import SkeletonList from './features/SkeletonList';

const SessionListContent = dynamic(() => import('./features/SessionListContent'), {
  loading: () => <SkeletonList />,
});

const Layout = ServerLayout({ Desktop, Mobile });

const Session = (props: DynamicLayoutProps) => {
  return (
    <>
      <Layout {...props}>
        <SessionListContent />
      </Layout>
      <SessionHydration />
    </>
  );
};

Session.displayName = 'Session';

export default Session;

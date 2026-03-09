'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from 'antd';

// Componente de loading simple para evitar problemas de importación
const DiscoverLoading = () => (
  <div style={{ padding: 24 }}>
    <Skeleton active paragraph={{ rows: 4 }} />
  </div>
);

const DiscoverRouter = dynamic(() => import('../DiscoverRouter'), {
  loading: () => <DiscoverLoading />,
  ssr: false,
});

DiscoverRouter.displayName = 'DiscoverRouter';

export default DiscoverRouter;

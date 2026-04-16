'use client';

import { Empty } from 'antd';
import { Center } from 'react-layout-kit';

// Las feature flags del servidor no se pueden acceder desde el cliente
// Este viewer solo está disponible en modo SSR
const FeatureFlagViewer = () => {
  return (
    <Center height={'80%'}>
      <Empty
        description="Feature flags solo disponibles en modo servidor"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </Center>
  );
};

export default FeatureFlagViewer;

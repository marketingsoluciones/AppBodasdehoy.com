/**
 * ✅ MEJORA UX: Componente reutilizable para indicadores de carga
 * Proporciona feedback visual consistente durante operaciones asíncronas
 */

import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingIndicatorProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'small' | 'default' | 'large';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Cargando...',
  size = 'default',
  fullScreen = false,
}) => {
  const antIcon = <LoadingOutlined spin style={{ fontSize: size === 'small' ? 16 : size === 'large' ? 32 : 24 }} />;

  if (fullScreen) {
    return (
      <div
        style={{
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          left: 0,
          position: 'fixed',
          right: 0,
          top: 0,
          zIndex: 9999,
        }}
      >
        <Spin indicator={antIcon} size={size} />
        {message && <p style={{ color: '#666', marginTop: 16 }}>{message}</p>}
      </div>
    );
  }

  return (
    <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', padding: 20 }}>
      <Spin indicator={antIcon} size={size} />
      {message && <p style={{ color: '#666', marginTop: 16 }}>{message}</p>}
    </div>
  );
};

export default LoadingIndicator;


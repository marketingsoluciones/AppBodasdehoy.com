/**
 * ✅ MEJORA UX: Componente reutilizable para mensajes de error
 * Proporciona mensajes de error claros y accionables
 */

import React from 'react';
import { Alert } from 'antd';
import { CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';

interface ErrorMessageProps {
  closable?: boolean;
  description?: string;
  message: string;
  onClose?: () => void;
  showIcon?: boolean;
  type?: 'error' | 'warning';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  description,
  type = 'error',
  showIcon = true,
  closable = false,
  onClose,
}) => {
  return (
    <Alert
      closable={closable}
      description={description}
      icon={type === 'error' ? <CloseCircleOutlined /> : <WarningOutlined />}
      message={message}
      onClose={onClose}
      showIcon={showIcon}
      style={{ marginBottom: 16 }}
      type={type}
    />
  );
};

export default ErrorMessage;


import React, { FC, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Componente de Tooltip para mostrar información de permisos
export const PermissionTooltip: FC<{ message: string; children: React.ReactNode }> = ({ message, children }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          {message}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
};

// Componente wrapper para elementos con permisos
export const PermissionWrapper: FC<{
  hasPermission: boolean;
  showTooltip?: boolean;
  tooltipMessage?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ hasPermission, showTooltip = true, tooltipMessage, children, className = "" }) => {
  const { t } = useTranslation();
  const defaultMessage = t("No tienes permisos para editar");

  if (!hasPermission) {
    return (
      <div className={`bg-red h-full relative ${className}`}>
        <div className="opacity-60 pointer-events-none">
          {children}
        </div>
        {showTooltip && (
          <PermissionTooltip message={tooltipMessage || defaultMessage}>
            <div className="absolute inset-0 cursor-not-allowed flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-gray-500" />
            </div>
          </PermissionTooltip>
        )}
      </div>
    );
  }
  return <div className={className}>
    {children}
  </div>;
};
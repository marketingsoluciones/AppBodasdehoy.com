import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type Priority = 'alta' | 'media' | 'baja';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
  onClick?: () => void;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  className = '',
  onClick
}) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case 'alta':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Alta',
          bgColor: 'bg-[#fff0f0]',
          textColor: 'text-[#ff2525]',
          borderColor: 'border-[#ffa7a7]'
        };
      case 'media':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          text: 'Media',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-300'
        };
      case 'baja':
        return {
          icon: <Info className="w-3 h-3" />,
          text: 'Baja',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-300'
        };
      default:
        return {
          icon: <Info className="w-3 h-3" />,
          text: 'Media',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-300'
        };
    }
  };

  const config = getPriorityConfig();

  return (
    <div 
      className={`
        inline-flex items-center px-2 py-1 rounded-full text-xs border
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {config.icon}
      <span className="ml-1 font-medium">{config.text}</span>
    </div>
  );
};
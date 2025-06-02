import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type Priority = 'alta' | 'media' | 'baja';

interface PriorityBadgeProps {
  priority: Priority;
  onClick?: () => void;
  className?: string;
}

const priorityConfig = {
  alta: {
    icon: <AlertCircle className="w-3 h-3" />,
    color: 'bg-[#ffdddd] text-red border-[#ff8686]',
    label: 'Alta',
  },
  media: {
    icon: <AlertTriangle className="w-3 h-3" />,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    label: 'Media',
  },
  baja: {
    icon: <Info className="w-3 h-3" />,
    color: 'bg-[#e2ffdc] text-green border-[#92ffb8]',
    label: 'Baja',
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  onClick,
  className = '' 
}) => {
  const config = priorityConfig[priority] || priorityConfig.media;

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border
        ${config.color}
        ${onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
        ${className}
      `}
    >
      {config.icon}
      <span>{config.label}</span>
    </button>
  );
};
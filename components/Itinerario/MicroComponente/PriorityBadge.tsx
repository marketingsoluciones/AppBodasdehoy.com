import React from 'react';
import { AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';

export type Priority = 'alta' | 'media' | 'baja'; // Cambiar a export

interface PriorityBadgeProps {
  priority: Priority;
  onClick?: () => void;
  className?: string;
}

const priorityConfig = {
  baja: {
    icon: AlertCircle,
    color: 'text-green-600 bg-green-50',
    label: 'Baja'
  },
  media: {
    icon: AlertTriangle,
    color: 'text-yellow-600 bg-yellow-50',
    label: 'Media'
  },
  alta: {
    icon: AlertOctagon,
    color: 'text-red-600 bg-red-50',
    label: 'Alta'
  }
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  onClick,
  className = ''
}) => {
  const config = priorityConfig[priority] || priorityConfig.media;
  const Icon = config.icon;

  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-1 px-2 py-1 rounded-full
        ${config.color} ${className}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
      `}
    >
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
};
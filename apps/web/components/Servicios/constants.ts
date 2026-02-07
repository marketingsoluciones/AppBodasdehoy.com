import React from 'react';
import {
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { BoardColumn } from './types';

// Configuración de columnas - SOLO las 4 permitidas
export const COLUMN_CONFIG: Record<string, {
  title: string;
  colorConfig: { bg: string; border: string; text: string };
  icon: React.ReactNode;
  color: string;
}> = {
  pending: {
    title: 'Pendiente',
    colorConfig: {
      bg: 'bg-gray-50',
      border: 'border-gray-300',
      text: 'text-white'
    },
    icon: React.createElement(Circle, { className: "w-4 h-4" }),
    color: 'bg-gray-50 border-gray-300'
  },
  in_progress: {
    title: 'En Curso',
    colorConfig: {
      bg: 'bg-pink-50',
      border: 'border-pink-300',
      text: 'text-white'
    },
    icon: React.createElement(Clock, { className: "w-4 h-4" }),
    color: 'bg-pink-50 border-pink-300'
  },
  completed: {
    title: 'Completado',
    colorConfig: {
      bg: 'bg-[#eeffee]',
      border: 'border-[#7bff7b]',
      text: 'text-white'
    },
    icon: React.createElement(CheckCircle2, { className: "w-4 h-4" }),
    color: 'bg-[#eeffee] border-[#7bff7b]'
  },
  blocked: {
    title: 'Bloqueado',
    colorConfig: {
      bg: 'bg-[#fff0f0]',
      border: 'border-[#ffa7a7]',
      text: 'text-white'
    },
    icon: React.createElement(XCircle, { className: "w-4 h-4" }),
    color: 'bg-[#fff0f0] border-[#ffa7a7]'
  }
};

// Estados por defecto - SOLO las 4 columnas permitidas
export const DEFAULT_COLUMNS: Record<string, Omit<BoardColumn, 'tasks'>> = {
  pending: {
    id: 'pending',
    title: 'Pendiente',
    color: 'bg-gray-50 border-gray-300',
    colorConfig: COLUMN_CONFIG.pending.colorConfig,
    icon: COLUMN_CONFIG.pending.icon,
    isCollapsed: false,
    isHidden: false,
    order: 0,
    bgColor: 'bg-gray-700',
  },
  in_progress: {
    id: 'in_progress',
    title: 'En Curso',
    color: 'bg-pink-50 border-pink-300',
    colorConfig: COLUMN_CONFIG.in_progress.colorConfig,
    icon: COLUMN_CONFIG.in_progress.icon,
    isCollapsed: false,
    isHidden: false,
    order: 1,
    bgColor: 'bg-primary',
  },
  completed: {
    id: 'completed',
    title: 'Completado',
    color: 'bg-[#eeffee] border-[#7bff7b]',
    colorConfig: COLUMN_CONFIG.completed.colorConfig,
    icon: COLUMN_CONFIG.completed.icon,
    isCollapsed: false,
    isHidden: false,
    order: 2,
    bgColor: 'bg-[#00b341]',
  },
  blocked: {
    id: 'blocked',
    title: 'Bloqueado',
    color: 'bg-[#fff0f0] border-[#ffa7a7]',
    colorConfig: COLUMN_CONFIG.blocked.colorConfig,
    icon: COLUMN_CONFIG.blocked.icon,
    isCollapsed: false,
    isHidden: false,
    order: 3,
    bgColor: 'bg-[#ff2525]',
  }
};
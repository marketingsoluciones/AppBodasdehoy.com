/**
 * Icon Utilities
 * ==============
 * Iconos SVG para las secciones del sitio
 */

import React from 'react';
import type { ScheduleEventType } from '../types';

interface IconProps {
  className?: string;
  color?: string;
  size?: number;
}

// Icono de ceremonia (anillos)
export function CeremonyIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <circle cx="9" cy="12" r="4" />
      <circle cx="15" cy="12" r="4" />
    </svg>
  );
}

// Icono de coctel
export function CocktailIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <path d="M8 2h8l-4 9v11" />
      <path d="M4 2h16" />
      <path d="M12 22h-4" />
      <path d="M12 22h4" />
    </svg>
  );
}

// Icono de cena
export function DinnerIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  );
}

// Icono de fiesta
export function PartyIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

// Icono de fotos
export function PhotosIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

// Icono generico (reloj)
export function ClockIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// Icono de ubicacion
export function LocationIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// Icono de calendario
export function CalendarIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

// Icono de corazon
export function HeartIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

// Icono de regalo
export function GiftIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect height="5" width="20" x="2" y="7" />
      <line x1="12" x2="12" y1="22" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
    </svg>
  );
}

// Icono de check
export function CheckIcon({ size = 24, color = 'currentColor', className }: IconProps) {
  return (
    <svg className={className} fill="none" height={size} stroke={color} strokeWidth="2" viewBox="0 0 24 24" width={size}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Obtener icono por tipo de evento
 */
export function getEventIcon(type: ScheduleEventType): React.FC<IconProps> {
  const iconMap: Record<ScheduleEventType, React.FC<IconProps>> = {
    ceremony: CeremonyIcon,
    cocktail: CocktailIcon,
    dinner: DinnerIcon,
    other: ClockIcon,
    party: PartyIcon,
    photos: PhotosIcon,
  };

  return iconMap[type] || ClockIcon;
}

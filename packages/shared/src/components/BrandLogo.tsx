/**
 * BrandLogo — componente compartido que muestra el logo de cualquier tenant.
 *
 * Estrategia de resolución:
 * 1. Si la config tiene favicon → usa <img>
 * 2. Si no → muestra iniciales del tenant con primaryColor como fondo
 *
 * Presentacional puro. No reemplaza los SVGs inline de appEventos/icons.js
 * sino que actúa como fallback universal para cualquier app.
 */

import React from 'react';

import { getDevelopmentConfig } from '../types/developments';

export interface BrandLogoProps {
  /** Key del tenant (ej: 'champagne-events') */
  development: string;
  /** Tamaño en px (default 32) */
  size?: number;
  /** Variante: solo icono o icono + nombre */
  variant?: 'icon' | 'full';
  /** Clase CSS adicional */
  className?: string;
  /** Emoji fallback cuando no hay favicon ni iniciales (default '✨') */
  fallbackEmoji?: string;
}

export function BrandLogo({
  development,
  size = 32,
  variant = 'icon',
  className,
  fallbackEmoji = '✨',
}: BrandLogoProps) {
  const config = getDevelopmentConfig(development);
  const name = config?.headTitle || config?.name || development;
  const primaryColor = config?.theme?.primaryColor || '#ec4899';
  const favicon = config?.favicon;

  // Generar iniciales: "Champagne Event Planner" → "CE", "Bodas de hoy" → "Bd"
  const initials = name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const iconElement = favicon ? (
    <img
      src={favicon}
      alt={name}
      width={size}
      height={size}
      style={{ borderRadius: size * 0.25, objectFit: 'contain' }}
    />
  ) : initials ? (
    <div
      style={{
        alignItems: 'center',
        background: primaryColor,
        borderRadius: size * 0.25,
        color: '#ffffff',
        display: 'inline-flex',
        fontSize: size * 0.4,
        fontWeight: 700,
        height: size,
        justifyContent: 'center',
        lineHeight: 1,
        width: size,
      }}
      title={name}
    >
      {initials}
    </div>
  ) : (
    <span style={{ fontSize: size * 0.7, lineHeight: 1 }}>{fallbackEmoji}</span>
  );

  if (variant === 'icon') {
    return <span className={className}>{iconElement}</span>;
  }

  // variant === 'full': icono + nombre
  return (
    <span
      className={className}
      style={{ alignItems: 'center', display: 'inline-flex', gap: size * 0.25 }}
    >
      {iconElement}
      <span style={{ fontSize: size * 0.45, fontWeight: 600, lineHeight: 1.2 }}>{name}</span>
    </span>
  );
}

'use client';

/**
 * Section Wrapper Component
 * =========================
 * Envuelve cada seccion con estilos consistentes y manejo de clicks
 */

import React from 'react';
import type { SectionType, RenderMode } from '../types';

interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
  id: string;
  mode: RenderMode;
  onClick?: (section: SectionType) => void;
  type: SectionType;
}

export function SectionWrapper({
  id,
  type,
  mode,
  onClick,
  className = '',
  children,
}: SectionWrapperProps) {
  const isPreview = mode === 'preview';

  const handleClick = () => {
    if (isPreview && onClick) {
      onClick(type);
    }
  };

  return (
    <section
      className={`
        wedding-section
        wedding-section--${type}
        ${isPreview ? 'wedding-section--preview' : ''}
        ${className}
      `}
      id={id}
      onClick={handleClick}
      onKeyDown={
        isPreview
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleClick();
              }
            }
          : undefined
      }
      role={isPreview ? 'button' : 'region'}
      tabIndex={isPreview ? 0 : undefined}
    >
      <style jsx>{`
        .wedding-section {
          position: relative;
          width: 100%;
        }

        .wedding-section--preview {
          cursor: pointer;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }

        .wedding-section--preview:hover {
          box-shadow: 0 0 0 3px var(--wedding-primary);
        }

        .wedding-section--preview:focus {
          outline: none;
          box-shadow: 0 0 0 3px var(--wedding-primary);
        }
      `}</style>
      {children}
    </section>
  );
}

export default SectionWrapper;

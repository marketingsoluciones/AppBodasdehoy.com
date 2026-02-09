'use client';

/**
 * Section Title Component
 * =======================
 * Titulo consistente para todas las secciones
 */

import React from 'react';

interface SectionTitleProps {
  align?: 'left' | 'center' | 'right';
  className?: string;
  subtitle?: string;
  title: string;
}

export function SectionTitle({
  title,
  subtitle,
  align = 'center',
  className = '',
}: SectionTitleProps) {
  return (
    <div className={`section-title section-title--${align} ${className}`}>
      <style jsx>{`
        .section-title {
          margin-bottom: 2rem;
        }

        .section-title--center {
          text-align: center;
        }

        .section-title--left {
          text-align: left;
        }

        .section-title--right {
          text-align: right;
        }

        .section-title h2 {
          font-family: var(--wedding-font-heading);
          font-size: 2.5rem;
          font-weight: 600;
          color: var(--wedding-text);
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }

        .section-title p {
          font-family: var(--wedding-font-body);
          font-size: 1.125rem;
          color: var(--wedding-text-light);
          margin: 0;
        }

        @media (max-width: 768px) {
          .section-title h2 {
            font-size: 2rem;
          }

          .section-title p {
            font-size: 1rem;
          }
        }
      `}</style>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export default SectionTitle;

'use client';

/**
 * Button Component
 * ================
 * Boton reutilizable con variantes de estilo
 */

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        wedding-btn
        wedding-btn--${variant}
        wedding-btn--${size}
        ${fullWidth ? 'wedding-btn--full' : ''}
        ${className}
      `}
      {...props}
    >
      <style jsx>{`
        .wedding-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border: none;
          border-radius: 4px;
          font-family: var(--wedding-font-body);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wedding-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Sizes */
        .wedding-btn--sm {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
        }

        .wedding-btn--md {
          padding: 0.75rem 1.5rem;
          font-size: 1rem;
        }

        .wedding-btn--lg {
          padding: 1rem 2rem;
          font-size: 1.125rem;
        }

        /* Variants */
        .wedding-btn--primary {
          background-color: var(--wedding-primary);
          color: var(--wedding-text-on-primary);
        }

        .wedding-btn--primary:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .wedding-btn--secondary {
          background-color: var(--wedding-secondary);
          color: var(--wedding-text-on-primary);
        }

        .wedding-btn--secondary:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .wedding-btn--outline {
          background-color: transparent;
          border: 2px solid var(--wedding-primary);
          color: var(--wedding-primary);
        }

        .wedding-btn--outline:hover:not(:disabled) {
          background-color: var(--wedding-primary);
          color: var(--wedding-text-on-primary);
        }

        .wedding-btn--ghost {
          background-color: transparent;
          color: var(--wedding-text);
        }

        .wedding-btn--ghost:hover:not(:disabled) {
          background-color: var(--wedding-accent);
        }

        /* Full Width */
        .wedding-btn--full {
          width: 100%;
        }
      `}</style>
      {children}
    </button>
  );
}

export default Button;

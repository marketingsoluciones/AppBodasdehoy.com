'use client';

/**
 * Hero Section
 * ============
 * Seccion principal con imagen, nombres y countdown
 */

import React from 'react';
import type { HeroData, CoupleInfo, WeddingDate, RenderMode } from '../../types';
import { formatWeddingDate } from '../../utils/formatDate';
import { CountdownTimer } from './CountdownTimer';

interface HeroSectionProps {
  couple: CoupleInfo;
  data: HeroData;
  date: WeddingDate;
  mode: RenderMode;
}

export function HeroSection({ data, couple, date, mode }: HeroSectionProps) {
  const formattedDate = formatWeddingDate(date.date);
  const overlayOpacity = data.overlay ?? 0.4;

  return (
    <section className="hero-section">
      <style jsx>{`
        .hero-section {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, ${overlayOpacity * 0.5}),
            rgba(0, 0, 0, ${overlayOpacity})
          );
        }

        .hero-content {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 2rem;
          max-width: 800px;
        }

        .hero-names {
          font-family: var(--wedding-font-heading);
          font-size: 4rem;
          font-weight: 600;
          color: var(--wedding-text-on-primary);
          margin: 0 0 0.5rem 0;
          line-height: 1.1;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
        }

        .hero-ampersand {
          display: block;
          font-size: 2.5rem;
          opacity: 0.9;
          margin: 0.25rem 0;
        }

        .hero-subtitle {
          font-family: var(--wedding-font-body);
          font-size: 1.25rem;
          color: var(--wedding-text-on-primary);
          opacity: 0.9;
          margin: 1rem 0;
          letter-spacing: 0.1em;
        }

        .hero-date {
          font-family: var(--wedding-font-body);
          font-size: 1.5rem;
          color: var(--wedding-text-on-primary);
          margin: 2rem 0;
          text-transform: capitalize;
        }

        .hero-countdown {
          margin-top: 2rem;
        }

        .scroll-indicator {
          position: absolute;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%);
          animation: bounce 2s infinite;
        }

        .scroll-indicator svg {
          width: 30px;
          height: 30px;
          color: var(--wedding-text-on-primary);
          opacity: 0.8;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateX(-50%) translateY(0);
          }
          40% {
            transform: translateX(-50%) translateY(-10px);
          }
          60% {
            transform: translateX(-50%) translateY(-5px);
          }
        }

        @media (max-width: 768px) {
          .hero-names {
            font-size: 2.5rem;
          }

          .hero-ampersand {
            font-size: 1.5rem;
          }

          .hero-date {
            font-size: 1.125rem;
          }
        }
      `}</style>

      <div
        className="hero-background"
        style={{ backgroundImage: `url(${data.image})` }}
      />
      <div className="hero-overlay" />

      <div className="hero-content">
        <h1 className="hero-names">
          {couple.partner1.name}
          <span className="hero-ampersand">&</span>
          {couple.partner2.name}
        </h1>

        {data.subtitle && <p className="hero-subtitle">{data.subtitle}</p>}

        <p className="hero-date">{formattedDate}</p>

        {data.showCountdown && (
          <div className="hero-countdown">
            <CountdownTimer targetDate={date.date} />
          </div>
        )}
      </div>

      <div className="scroll-indicator">
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
        </svg>
      </div>
    </section>
  );
}

export default HeroSection;

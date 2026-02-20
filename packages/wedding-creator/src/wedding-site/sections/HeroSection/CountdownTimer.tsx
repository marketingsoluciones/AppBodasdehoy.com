'use client';

/**
 * Countdown Timer Component
 * =========================
 * Cuenta regresiva animada hasta la fecha de la boda
 */

import React, { useState, useEffect } from 'react';
import { calculateCountdown, type CountdownValues } from '../../utils/formatDate';

interface CountdownTimerProps {
  className?: string;
  targetDate: string;
}

export function CountdownTimer({ targetDate, className = '' }: CountdownTimerProps) {
  const [countdown, setCountdown] = useState<CountdownValues>(() =>
    calculateCountdown(targetDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (countdown.isPast) {
    return (
      <div className={`countdown countdown--past ${className}`}>
        <style jsx>{`
          .countdown--past {
            font-family: var(--wedding-font-heading);
            font-size: 1.5rem;
            color: var(--wedding-text-on-primary);
          }
        `}</style>
        <span>El gran dia ha llegado!</span>
      </div>
    );
  }

  return (
    <div className={`countdown ${className}`}>
      <style jsx>{`
        .countdown {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
        }

        .countdown-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 80px;
        }

        .countdown-value {
          font-family: var(--wedding-font-heading);
          font-size: 3rem;
          font-weight: 700;
          line-height: 1;
          color: var(--wedding-text-on-primary);
        }

        .countdown-label {
          font-family: var(--wedding-font-body);
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--wedding-text-on-primary);
          opacity: 0.9;
          margin-top: 0.5rem;
        }

        @media (max-width: 640px) {
          .countdown {
            gap: 1rem;
          }

          .countdown-item {
            min-width: 60px;
          }

          .countdown-value {
            font-size: 2rem;
          }

          .countdown-label {
            font-size: 0.75rem;
          }
        }
      `}</style>

      <div className="countdown-item">
        <span className="countdown-value">{countdown.days}</span>
        <span className="countdown-label">Dias</span>
      </div>

      <div className="countdown-item">
        <span className="countdown-value">
          {countdown.hours.toString().padStart(2, '0')}
        </span>
        <span className="countdown-label">Horas</span>
      </div>

      <div className="countdown-item">
        <span className="countdown-value">
          {countdown.minutes.toString().padStart(2, '0')}
        </span>
        <span className="countdown-label">Minutos</span>
      </div>

      <div className="countdown-item">
        <span className="countdown-value">
          {countdown.seconds.toString().padStart(2, '0')}
        </span>
        <span className="countdown-label">Segundos</span>
      </div>
    </div>
  );
}

export default CountdownTimer;

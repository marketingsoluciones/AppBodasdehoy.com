'use client';

/**
 * Registry Section
 * ================
 * Lista de regalos y opciones de efectivo
 */

import React from 'react';
import type { RegistryData, RenderMode } from '../../types';
import { SectionTitle } from '../../shared/SectionTitle';
import { Button } from '../../shared/Button';
import { GiftIcon } from '../../utils/icons';

interface RegistrySectionProps {
  data: RegistryData;
  mode: RenderMode;
}

export function RegistrySection({ data, mode }: RegistrySectionProps) {
  return (
    <section className="registry-section">
      <style jsx>{`
        .registry-section {
          padding: 5rem 1.5rem;
          background-color: var(--wedding-background-alt);
        }

        .registry-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .registry-message {
          text-align: center;
          font-family: var(--wedding-font-body);
          font-size: 1.125rem;
          color: var(--wedding-text);
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto 3rem;
        }

        .registry-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .registry-card {
          background-color: var(--wedding-background);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          transition: transform 0.2s ease;
        }

        .registry-card:hover {
          transform: translateY(-4px);
        }

        .registry-logo {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          object-fit: contain;
        }

        .registry-logo-placeholder {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          background-color: var(--wedding-accent);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--wedding-primary);
        }

        .registry-name {
          font-family: var(--wedding-font-heading);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--wedding-text);
          margin-bottom: 0.5rem;
        }

        .registry-description {
          font-family: var(--wedding-font-body);
          font-size: 0.9375rem;
          color: var(--wedding-text-light);
          margin-bottom: 1.5rem;
        }

        .cash-option {
          background-color: var(--wedding-background);
          border-radius: 12px;
          padding: 2rem;
          margin-top: 2rem;
        }

        .cash-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .cash-icon {
          width: 48px;
          height: 48px;
          background-color: var(--wedding-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--wedding-text-on-primary);
        }

        .cash-title {
          font-family: var(--wedding-font-heading);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--wedding-text);
        }

        .cash-message {
          font-family: var(--wedding-font-body);
          font-size: 1rem;
          color: var(--wedding-text);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .bank-details {
          background-color: var(--wedding-background-alt);
          border-radius: 8px;
          padding: 1.5rem;
        }

        .bank-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--wedding-background);
        }

        .bank-row:last-child {
          border-bottom: none;
        }

        .bank-label {
          font-family: var(--wedding-font-body);
          font-size: 0.875rem;
          color: var(--wedding-text-light);
        }

        .bank-value {
          font-family: var(--wedding-font-body);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--wedding-text);
        }

        .payment-buttons {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
          flex-wrap: wrap;
        }
      `}</style>

      <div className="registry-container">
        <SectionTitle title={data.title} />

        {data.message && <p className="registry-message">{data.message}</p>}

        <div className="registry-grid">
          {data.links.map((link) => (
            <div className="registry-card" key={link.id}>
              {link.logo ? (
                <img alt={link.name} className="registry-logo" src={link.logo} />
              ) : (
                <div className="registry-logo-placeholder">
                  <GiftIcon size={32} />
                </div>
              )}

              <h3 className="registry-name">{link.name}</h3>

              {link.description && (
                <p className="registry-description">{link.description}</p>
              )}

              <Button
                onClick={() => window.open(link.url, '_blank')}
                variant="primary"
              >
                Ver lista
              </Button>
            </div>
          ))}
        </div>

        {data.cashOption?.enabled && (
          <div className="cash-option">
            <div className="cash-header">
              <div className="cash-icon">
                <svg fill="none" height="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24">
                  <line x1="12" x2="12" y1="1" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <h3 className="cash-title">Aporte en efectivo</h3>
            </div>

            {data.cashOption.message && (
              <p className="cash-message">{data.cashOption.message}</p>
            )}

            {data.cashOption.bankDetails && (
              <div className="bank-details">
                <div className="bank-row">
                  <span className="bank-label">Banco</span>
                  <span className="bank-value">{data.cashOption.bankDetails.bankName}</span>
                </div>
                <div className="bank-row">
                  <span className="bank-label">Titular</span>
                  <span className="bank-value">{data.cashOption.bankDetails.accountHolder}</span>
                </div>
                <div className="bank-row">
                  <span className="bank-label">Cuenta</span>
                  <span className="bank-value">{data.cashOption.bankDetails.accountNumber}</span>
                </div>
                {data.cashOption.bankDetails.routingNumber && (
                  <div className="bank-row">
                    <span className="bank-label">CLABE</span>
                    <span className="bank-value">{data.cashOption.bankDetails.routingNumber}</span>
                  </div>
                )}
              </div>
            )}

            {(data.cashOption.paypalEmail || data.cashOption.venmoUsername) && (
              <div className="payment-buttons">
                {data.cashOption.paypalEmail && (
                  <Button
                    onClick={() =>
                      window.open(`https://paypal.me/${data.cashOption!.paypalEmail}`, '_blank')
                    }
                    variant="outline"
                  >
                    PayPal
                  </Button>
                )}
                {data.cashOption.venmoUsername && (
                  <Button
                    onClick={() =>
                      window.open(`https://venmo.com/${data.cashOption!.venmoUsername}`, '_blank')
                    }
                    variant="outline"
                  >
                    Venmo
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default RegistrySection;

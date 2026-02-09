'use client';

/**
 * Info Section
 * ============
 * Dress code, alojamientos y FAQs
 */

import React, { useState } from 'react';
import type { InfoData, DressCode, Accommodation, FAQ, RenderMode } from '../../types';
import { SectionTitle } from '../../shared/SectionTitle';

interface InfoSectionProps {
  data: InfoData;
  mode: RenderMode;
}

function DressCodeCard({ dressCode }: { dressCode: DressCode }) {
  const dressCodeLabels: Record<string, string> = {
    'beach': 'Playa',
    'black-tie': 'Etiqueta',
    'casual': 'Casual',
    'cocktail': 'Cocktail',
    'custom': 'Personalizado',
    'formal': 'Formal',
    'semi-formal': 'Semi-Formal',
  };

  return (
    <div className="dress-code-card">
      <style jsx>{`
        .dress-code-card {
          background-color: var(--wedding-background);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .dress-code-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 1rem;
          background-color: var(--wedding-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .dress-code-icon svg {
          width: 40px;
          height: 40px;
          color: var(--wedding-text-on-primary);
        }

        .dress-code-type {
          font-family: var(--wedding-font-heading);
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--wedding-text);
          margin-bottom: 0.5rem;
        }

        .dress-code-description {
          font-family: var(--wedding-font-body);
          font-size: 1rem;
          color: var(--wedding-text-light);
          margin-bottom: 1rem;
        }

        .dress-code-colors {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          margin-top: 1rem;
        }

        .color-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid var(--wedding-background-alt);
        }

        .avoid-text {
          font-size: 0.875rem;
          color: var(--wedding-text-light);
          margin-top: 1rem;
        }
      `}</style>

      <div className="dress-code-icon">
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" x2="21" y1="6" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      </div>

      <h3 className="dress-code-type">{dressCodeLabels[dressCode.type]}</h3>

      {dressCode.description && (
        <p className="dress-code-description">{dressCode.description}</p>
      )}

      {dressCode.colors && dressCode.colors.length > 0 && (
        <div className="dress-code-colors">
          {dressCode.colors.map((color, i) => (
            <div className="color-dot" key={i} style={{ backgroundColor: color }} />
          ))}
        </div>
      )}

      {dressCode.avoid && dressCode.avoid.length > 0 && (
        <p className="avoid-text">
          Por favor evitar: {dressCode.avoid.join(', ')}
        </p>
      )}
    </div>
  );
}

function AccommodationCard({ accommodation }: { accommodation: Accommodation }) {
  return (
    <div className="accommodation-card">
      <style jsx>{`
        .accommodation-card {
          background-color: var(--wedding-background);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .accommodation-image {
          width: 100%;
          height: 150px;
          object-fit: cover;
        }

        .accommodation-content {
          padding: 1.25rem;
        }

        .accommodation-name {
          font-family: var(--wedding-font-heading);
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--wedding-text);
          margin: 0 0 0.5rem 0;
        }

        .accommodation-description {
          font-family: var(--wedding-font-body);
          font-size: 0.9375rem;
          color: var(--wedding-text-light);
          margin-bottom: 0.75rem;
        }

        .accommodation-price {
          font-size: 0.875rem;
          color: var(--wedding-primary);
          font-weight: 500;
        }

        .accommodation-discount {
          background-color: var(--wedding-accent);
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.875rem;
          margin-top: 0.75rem;
        }

        .accommodation-link {
          display: inline-block;
          margin-top: 0.75rem;
          color: var(--wedding-primary);
          text-decoration: none;
          font-weight: 500;
        }
      `}</style>

      {accommodation.image && (
        <img alt={accommodation.name} className="accommodation-image" src={accommodation.image} />
      )}

      <div className="accommodation-content">
        <h4 className="accommodation-name">{accommodation.name}</h4>

        {accommodation.description && (
          <p className="accommodation-description">{accommodation.description}</p>
        )}

        {accommodation.priceRange && (
          <p className="accommodation-price">{accommodation.priceRange}</p>
        )}

        {accommodation.discountCode && (
          <div className="accommodation-discount">
            Codigo de descuento: <strong>{accommodation.discountCode}</strong>
          </div>
        )}

        {accommodation.website && (
          <a
            className="accommodation-link"
            href={accommodation.website}
            rel="noopener noreferrer"
            target="_blank"
          >
            Ver sitio web →
          </a>
        )}
      </div>
    </div>
  );
}

function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-accordion">
      <style jsx>{`
        .faq-accordion {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .faq-item {
          background-color: var(--wedding-background);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .faq-question {
          width: 100%;
          padding: 1rem 1.25rem;
          background: none;
          border: none;
          text-align: left;
          font-family: var(--wedding-font-body);
          font-size: 1rem;
          font-weight: 500;
          color: var(--wedding-text);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .faq-icon {
          transition: transform 0.3s ease;
        }

        .faq-icon.open {
          transform: rotate(180deg);
        }

        .faq-answer {
          padding: 0 1.25rem 1rem;
          font-family: var(--wedding-font-body);
          font-size: 0.9375rem;
          color: var(--wedding-text-light);
          line-height: 1.6;
        }
      `}</style>

      {faqs.map((faq, index) => (
        <div className="faq-item" key={faq.id}>
          <button
            className="faq-question"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            {faq.question}
            <svg
              className={`faq-icon ${openIndex === index ? 'open' : ''}`}
              fill="none"
              height="20"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {openIndex === index && (
            <div className="faq-answer">{faq.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function InfoSection({ data, mode }: InfoSectionProps) {
  return (
    <section className="info-section">
      <style jsx>{`
        .info-section {
          padding: 5rem 1.5rem;
          background-color: var(--wedding-background-alt);
        }

        .info-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .info-block {
          margin-bottom: 3rem;
        }

        .info-block-title {
          font-family: var(--wedding-font-heading);
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--wedding-text);
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .accommodations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }
      `}</style>

      <div className="info-container">
        <SectionTitle title={data.title} />

        {data.dressCode && (
          <div className="info-block">
            <h3 className="info-block-title">Codigo de Vestimenta</h3>
            <div style={{ margin: '0 auto', maxWidth: '400px' }}>
              <DressCodeCard dressCode={data.dressCode} />
            </div>
          </div>
        )}

        {data.accommodations && data.accommodations.length > 0 && (
          <div className="info-block">
            <h3 className="info-block-title">Alojamiento</h3>
            <div className="accommodations-grid">
              {data.accommodations.map((accommodation) => (
                <AccommodationCard accommodation={accommodation} key={accommodation.id} />
              ))}
            </div>
          </div>
        )}

        {data.faqs && data.faqs.length > 0 && (
          <div className="info-block">
            <h3 className="info-block-title">Preguntas Frecuentes</h3>
            <div style={{ margin: '0 auto', maxWidth: '700px' }}>
              <FAQAccordion faqs={data.faqs} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default InfoSection;

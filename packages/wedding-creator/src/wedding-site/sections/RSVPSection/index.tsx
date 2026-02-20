'use client';

/**
 * RSVP Section
 * ============
 * Formulario de confirmacion de asistencia
 */

import React, { useState } from 'react';
import type { RSVPData, RSVPSubmission, RenderMode } from '../../types';
import { SectionTitle } from '../../shared/SectionTitle';
import { Button } from '../../shared/Button';
import { formatShortDate } from '../../utils/formatDate';

interface RSVPSectionProps {
  data: RSVPData;
  mode: RenderMode;
  onSubmit?: (submission: RSVPSubmission) => Promise<void>;
}

export function RSVPSection({ data, mode, onSubmit }: RSVPSectionProps) {
  const [formData, setFormData] = useState<RSVPSubmission>({
    attending: true,
    email: '',
    guestCount: 1,
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'preview') {
        // Simular submit en preview
        await new Promise((resolve) => setTimeout(resolve, 1000));
        console.log('[Preview] RSVP submission:', formData);
      } else if (onSubmit) {
        await onSubmit(formData);
      }
      setSubmitted(true);
    } catch {
      setError('Hubo un error al enviar tu confirmacion. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (submitted) {
    return (
      <section className="rsvp-section">
        <style jsx>{`
          .rsvp-section {
            padding: 5rem 1.5rem;
            background-color: var(--wedding-background);
          }
          .rsvp-container {
            max-width: 600px;
            margin: 0 auto;
            text-align: center;
          }
          .success-message {
            background-color: var(--wedding-accent);
            border-radius: 12px;
            padding: 3rem;
          }
          .success-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 1.5rem;
            background-color: var(--wedding-primary);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--wedding-text-on-primary);
          }
          .success-title {
            font-family: var(--wedding-font-heading);
            font-size: 1.75rem;
            color: var(--wedding-text);
            margin-bottom: 0.5rem;
          }
          .success-text {
            font-family: var(--wedding-font-body);
            font-size: 1rem;
            color: var(--wedding-text-light);
          }
        `}</style>
        <div className="rsvp-container">
          <div className="success-message">
            <div className="success-icon">
              <svg fill="none" height="32" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="32">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="success-title">Gracias por confirmar!</h3>
            <p className="success-text">
              Hemos recibido tu confirmacion. Nos vemos pronto!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rsvp-section">
      <style jsx>{`
        .rsvp-section {
          padding: 5rem 1.5rem;
          background-color: var(--wedding-background);
        }

        .rsvp-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .rsvp-deadline {
          text-align: center;
          font-family: var(--wedding-font-body);
          font-size: 0.9375rem;
          color: var(--wedding-text-light);
          margin-bottom: 2rem;
        }

        .rsvp-form {
          background-color: var(--wedding-background-alt);
          border-radius: 12px;
          padding: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          font-family: var(--wedding-font-body);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--wedding-text);
          margin-bottom: 0.5rem;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          font-family: var(--wedding-font-body);
          font-size: 1rem;
          border: 2px solid var(--wedding-background);
          border-radius: 8px;
          background-color: var(--wedding-background);
          color: var(--wedding-text);
          transition: border-color 0.2s ease;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--wedding-primary);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .form-radio-group {
          display: flex;
          gap: 1.5rem;
        }

        .form-radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .form-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.9375rem;
        }

        .form-actions {
          margin-top: 2rem;
        }
      `}</style>

      <div className="rsvp-container">
        <SectionTitle subtitle={data.subtitle} title={data.title} />

        <p className="rsvp-deadline">
          Por favor confirma antes del {formatShortDate(data.config.deadline)}
        </p>

        <form className="rsvp-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Nombre completo *
            </label>
            <input
              className="form-input"
              id="name"
              name="name"
              onChange={handleChange}
              required
              type="text"
              value={formData.name}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Correo electronico *
            </label>
            <input
              className="form-input"
              id="email"
              name="email"
              onChange={handleChange}
              required
              type="email"
              value={formData.email}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmo mi asistencia *</label>
            <div className="form-radio-group">
              <label className="form-radio-label">
                <input
                  checked={formData.attending}
                  name="attending"
                  onChange={() => setFormData((prev) => ({ ...prev, attending: true }))}
                  type="radio"
                />
                Si, asistire
              </label>
              <label className="form-radio-label">
                <input
                  checked={!formData.attending}
                  name="attending"
                  onChange={() => setFormData((prev) => ({ ...prev, attending: false }))}
                  type="radio"
                />
                No podre asistir
              </label>
            </div>
          </div>

          {formData.attending && (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="guestCount">
                  Numero de invitados (incluyendote)
                </label>
                <select
                  className="form-select"
                  id="guestCount"
                  name="guestCount"
                  onChange={handleChange}
                  value={formData.guestCount}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {data.config.askDietaryRestrictions && (
                <div className="form-group">
                  <label className="form-label" htmlFor="dietaryRestrictions">
                    Restricciones alimentarias
                  </label>
                  <textarea
                    className="form-textarea"
                    id="dietaryRestrictions"
                    name="dietaryRestrictions"
                    onChange={handleChange}
                    placeholder="Alergias, dieta vegetariana, etc."
                    value={formData.dietaryRestrictions || ''}
                  />
                </div>
              )}

              {data.config.askSongRequest && (
                <div className="form-group">
                  <label className="form-label" htmlFor="songRequest">
                    Cancion que no puede faltar
                  </label>
                  <input
                    className="form-input"
                    id="songRequest"
                    name="songRequest"
                    onChange={handleChange}
                    placeholder="Artista - Cancion"
                    type="text"
                    value={formData.songRequest || ''}
                  />
                </div>
              )}
            </>
          )}

          {data.config.askMessage && (
            <div className="form-group">
              <label className="form-label" htmlFor="message">
                Mensaje para los novios
              </label>
              <textarea
                className="form-textarea"
                id="message"
                name="message"
                onChange={handleChange}
                value={formData.message || ''}
              />
            </div>
          )}

          <div className="form-actions">
            <Button
              disabled={isSubmitting}
              fullWidth
              type="submit"
              variant="primary"
            >
              {isSubmitting ? 'Enviando...' : 'Confirmar asistencia'}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default RSVPSection;

'use client';

/**
 * Publish Modal Component
 * =======================
 * Modal para publicar la web de boda con subdomain personalizado
 */

import React, { useState, useEffect } from 'react';

interface PublishModalProps {
  coupleName: string;
  currentSubdomain?: string;
  isOpen: boolean;
  onClose: () => void;
  onPublish: (subdomain: string) => Promise<void | { error?: string, success: boolean; url?: string; }>;
  onUnpublish?: () => Promise<void>;
}

export function PublishModal({
  isOpen,
  onClose,
  currentSubdomain,
  coupleName,
  onPublish,
  onUnpublish,
}: PublishModalProps) {
  const [subdomain, setSubdomain] = useState(currentSubdomain || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(!!currentSubdomain);

  // Generate suggested subdomain from couple name
  useEffect(() => {
    if (!subdomain && coupleName) {
      const suggested = coupleName
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036F]/g, '') // Remove accents
        .replaceAll(/[^\da-z]+/g, '-')
        .replaceAll(/^-+|-+$/g, '');
      setSubdomain(suggested);
    }
  }, [coupleName, subdomain]);

  const validateSubdomain = (value: string): string | null => {
    if (!value) return 'El subdomain es requerido';
    if (value.length < 3) return 'Minimo 3 caracteres';
    if (value.length > 30) return 'Maximo 30 caracteres';
    if (!/^[\da-z-]+$/.test(value)) return 'Solo letras minusculas, numeros y guiones';
    if (/^-|-$/.test(value)) return 'No puede empezar o terminar con guion';
    return null;
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replaceAll(/[^\da-z-]/g, '');
    setSubdomain(value);
    setError(null);
  };

  const handlePublish = async () => {
    const validationError = validateSubdomain(subdomain);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPublishing(true);
    setError(null);

    try {
      const result = await onPublish(subdomain);
      // Handle both void (parent handles everything) and object result types
      if (result && typeof result === 'object') {
        if (result.success && result.url) {
          setPublishedUrl(result.url);
          setIsPublished(true);
        } else {
          setError(result.error || 'Error al publicar');
        }
      } else {
        // void return - parent handled the state update
        setIsPublished(true);
      }
    } catch {
      setError('Error inesperado al publicar');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!onUnpublish) return;

    setIsPublishing(true);
    try {
      await onUnpublish();
      setIsPublished(false);
      setPublishedUrl(null);
    } catch {
      setError('Error al despublicar');
    } finally {
      setIsPublishing(false);
    }
  };

  const copyToClipboard = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="publish-modal-overlay" onClick={onClose}>
      <style jsx>{`
        .publish-modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .publish-modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.2s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .modal-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .subdomain-input-group {
          display: flex;
          align-items: center;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.2s;
        }

        .subdomain-input-group:focus-within {
          border-color: #3b82f6;
        }

        .subdomain-prefix {
          background-color: #f3f4f6;
          padding: 0.75rem 1rem;
          color: #6b7280;
          font-size: 0.875rem;
          border-right: 1px solid #e5e7eb;
        }

        .subdomain-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          font-size: 1rem;
          outline: none;
        }

        .subdomain-suffix {
          background-color: #f3f4f6;
          padding: 0.75rem 1rem;
          color: #6b7280;
          font-size: 0.875rem;
          border-left: 1px solid #e5e7eb;
        }

        .error-message {
          color: #dc2626;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .published-url {
          background-color: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .published-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #059669;
          font-weight: 600;
        }

        .published-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .published-link a {
          color: #059669;
          font-weight: 500;
          text-decoration: none;
        }

        .published-link a:hover {
          text-decoration: underline;
        }

        .copy-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 0.25rem;
        }

        .copy-button:hover {
          color: #374151;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .cancel-button {
          padding: 0.75rem 1.5rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-weight: 500;
          cursor: pointer;
        }

        .cancel-button:hover {
          background-color: #f9fafb;
        }

        .publish-button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          background: #059669;
          color: white;
          font-weight: 500;
          cursor: pointer;
        }

        .publish-button:hover:not(:disabled) {
          background: #047857;
        }

        .publish-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .unpublish-button {
          padding: 0.75rem 1.5rem;
          border: 1px solid #dc2626;
          border-radius: 8px;
          background: white;
          color: #dc2626;
          font-weight: 500;
          cursor: pointer;
        }

        .unpublish-button:hover {
          background: #fef2f2;
        }
      `}</style>

      <div className="publish-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isPublished ? 'Tu web esta publicada' : 'Publicar tu web de boda'}
          </h2>
          <p className="modal-subtitle">
            {isPublished
              ? 'Comparte este link con tus invitados'
              : 'Elige un nombre unico para tu web'}
          </p>
        </div>

        <div className="modal-body">
          {!isPublished ? (
            <>
              <div className="subdomain-input-group">
                <span className="subdomain-prefix">https://</span>
                <input
                  className="subdomain-input"
                  maxLength={30}
                  onChange={handleSubdomainChange}
                  placeholder="maria-y-juan"
                  type="text"
                  value={subdomain}
                />
                <span className="subdomain-suffix">.bodasdehoy.com</span>
              </div>
              {error && <p className="error-message">{error}</p>}
            </>
          ) : (
            <div className="published-url">
              <span className="published-label">URL de tu web</span>
              <div className="published-link">
                <a
                  href={publishedUrl || `https://${subdomain}.bodasdehoy.com`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {publishedUrl || `https://${subdomain}.bodasdehoy.com`}
                </a>
                <button className="copy-button" onClick={copyToClipboard} title="Copiar URL">
                  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16">
                    <rect height="13" rx="2" ry="2" width="13" x="9" y="9" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            {isPublished ? 'Cerrar' : 'Cancelar'}
          </button>

          {isPublished ? (
            <button
              className="unpublish-button"
              disabled={isPublishing}
              onClick={handleUnpublish}
            >
              {isPublishing ? 'Despublicando...' : 'Despublicar'}
            </button>
          ) : (
            <button
              className="publish-button"
              disabled={isPublishing || !subdomain}
              onClick={handlePublish}
            >
              {isPublishing ? 'Publicando...' : 'Publicar web'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublishModal;

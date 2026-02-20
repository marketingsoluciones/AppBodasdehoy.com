'use client';

/**
 * Gallery Section
 * ===============
 * Galeria de fotos con diferentes layouts
 */

import React, { useState } from 'react';
import type { GalleryData, Photo, RenderMode } from '../../types';
import { SectionTitle } from '../../shared/SectionTitle';

interface GallerySectionProps {
  data: GalleryData;
  mode: RenderMode;
}

function Lightbox({
  photo,
  onClose,
  onPrev,
  onNext,
}: {
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  photo: Photo;
}) {
  return (
    <div className="lightbox" onClick={onClose}>
      <style jsx>{`
        .lightbox {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.95);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .lightbox-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
        }

        .lightbox-image {
          max-width: 100%;
          max-height: 85vh;
          object-fit: contain;
        }

        .lightbox-caption {
          color: white;
          text-align: center;
          padding: 1rem;
          font-family: var(--wedding-font-body);
        }

        .lightbox-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          z-index: 1001;
        }

        .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 2rem;
          padding: 1rem;
          cursor: pointer;
          border-radius: 50%;
        }

        .lightbox-prev {
          left: 1rem;
        }

        .lightbox-next {
          right: 1rem;
        }
      `}</style>

      <button className="lightbox-close" onClick={onClose}>×</button>

      <button
        className="lightbox-nav lightbox-prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
      >
        ‹
      </button>

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img alt={photo.caption || ''} className="lightbox-image" src={photo.url} />
        {photo.caption && <p className="lightbox-caption">{photo.caption}</p>}
      </div>

      <button
        className="lightbox-nav lightbox-next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
      >
        ›
      </button>
    </div>
  );
}

export function GallerySection({ data, mode }: GallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const goToPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === 0 ? data.photos.length - 1 : lightboxIndex - 1);
    }
  };

  const goToNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(lightboxIndex === data.photos.length - 1 ? 0 : lightboxIndex + 1);
    }
  };

  return (
    <section className="gallery-section">
      <style jsx>{`
        .gallery-section {
          padding: 5rem 1.5rem;
          background-color: var(--wedding-background);
        }

        .gallery-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .gallery-masonry {
          column-count: 3;
          column-gap: 1rem;
        }

        .gallery-carousel {
          display: flex;
          overflow-x: auto;
          gap: 1rem;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
        }

        .gallery-item {
          cursor: pointer;
          overflow: hidden;
          border-radius: 8px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .gallery-item:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }

        .gallery-masonry .gallery-item {
          break-inside: avoid;
          margin-bottom: 1rem;
        }

        .gallery-carousel .gallery-item {
          flex: 0 0 300px;
          scroll-snap-align: start;
        }

        .gallery-image {
          width: 100%;
          display: block;
        }

        .gallery-grid .gallery-image {
          height: 250px;
          object-fit: cover;
        }

        .gallery-carousel .gallery-image {
          height: 350px;
          object-fit: cover;
        }

        @media (max-width: 768px) {
          .gallery-masonry {
            column-count: 2;
          }
        }

        @media (max-width: 480px) {
          .gallery-masonry {
            column-count: 1;
          }
        }
      `}</style>

      <div className="gallery-container">
        <SectionTitle subtitle={data.subtitle} title={data.title} />

        <div className={`gallery-${data.layout}`}>
          {data.photos.map((photo, index) => (
            <div
              className="gallery-item"
              key={photo.id}
              onClick={() => openLightbox(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') openLightbox(index);
              }}
              role="button"
              tabIndex={0}
            >
              <img
                alt={photo.caption || `Foto ${index + 1}`}
                className="gallery-image"
                loading="lazy"
                src={photo.thumbnail || photo.url}
              />
            </div>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          onClose={closeLightbox}
          onNext={goToNext}
          onPrev={goToPrev}
          photo={data.photos[lightboxIndex]}
        />
      )}
    </section>
  );
}

export default GallerySection;

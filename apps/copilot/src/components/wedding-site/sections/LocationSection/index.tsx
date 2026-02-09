'use client';

/**
 * Location Section
 * ================
 * Ubicaciones con mapa y direcciones
 */

import React from 'react';
import type { LocationData, Venue, RenderMode } from '../../types';
import { SectionTitle } from '../../shared/SectionTitle';
import { Button } from '../../shared/Button';
import { LocationIcon } from '../../utils/icons';

interface LocationSectionProps {
  data: LocationData;
  mode: RenderMode;
}

function VenueCard({ venue }: { venue: Venue }) {
  const openGoogleMaps = () => {
    if (venue.googleMapsUrl) {
      window.open(venue.googleMapsUrl, '_blank');
    } else if (venue.coordinates) {
      const url = `https://www.google.com/maps/search/?api=1&query=${venue.coordinates.lat},${venue.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  const openWaze = () => {
    if (venue.wazeUrl) {
      window.open(venue.wazeUrl, '_blank');
    } else if (venue.coordinates) {
      const url = `https://www.waze.com/ul?ll=${venue.coordinates.lat},${venue.coordinates.lng}&navigate=yes`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="venue-card">
      <style jsx>{`
        .venue-card {
          background-color: var(--wedding-background-alt);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .venue-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
        }

        .venue-image-placeholder {
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, var(--wedding-primary) 0%, var(--wedding-secondary) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--wedding-text-on-primary);
        }

        .venue-content {
          padding: 1.5rem;
        }

        .venue-type {
          font-family: var(--wedding-font-body);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--wedding-primary);
          margin-bottom: 0.5rem;
        }

        .venue-name {
          font-family: var(--wedding-font-heading);
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--wedding-text);
          margin: 0 0 0.5rem 0;
        }

        .venue-address {
          font-family: var(--wedding-font-body);
          font-size: 0.9375rem;
          color: var(--wedding-text-light);
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .venue-description {
          font-family: var(--wedding-font-body);
          font-size: 0.9375rem;
          color: var(--wedding-text);
          margin-bottom: 1rem;
          line-height: 1.6;
        }

        .venue-parking {
          font-family: var(--wedding-font-body);
          font-size: 0.875rem;
          color: var(--wedding-text-light);
          background-color: var(--wedding-accent);
          padding: 0.75rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .venue-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
      `}</style>

      {venue.image ? (
        <img alt={venue.name} className="venue-image" src={venue.image} />
      ) : (
        <div className="venue-image-placeholder">
          <LocationIcon size={48} />
        </div>
      )}

      <div className="venue-content">
        <div className="venue-type">
          {venue.type === 'ceremony' && 'Ceremonia'}
          {venue.type === 'reception' && 'Recepcion'}
          {venue.type === 'both' && 'Ceremonia y Recepcion'}
          {venue.type === 'other' && 'Ubicacion'}
        </div>

        <h3 className="venue-name">{venue.name}</h3>

        <p className="venue-address">
          {venue.address}
          {venue.city && `, ${venue.city}`}
        </p>

        {venue.description && (
          <p className="venue-description">{venue.description}</p>
        )}

        {venue.parkingInfo && (
          <div className="venue-parking">
            <strong>Estacionamiento:</strong> {venue.parkingInfo}
          </div>
        )}

        <div className="venue-actions">
          <Button onClick={openGoogleMaps} size="sm" variant="primary">
            Google Maps
          </Button>
          <Button onClick={openWaze} size="sm" variant="outline">
            Waze
          </Button>
        </div>
      </div>
    </div>
  );
}

export function LocationSection({ data, mode }: LocationSectionProps) {
  return (
    <section className="location-section">
      <style jsx>{`
        .location-section {
          padding: 5rem 1.5rem;
          background-color: var(--wedding-background-alt);
        }

        .location-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .venues-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }

        .map-container {
          margin-top: 3rem;
          border-radius: 12px;
          overflow: hidden;
          height: 400px;
          background-color: var(--wedding-background);
        }

        .map-container iframe {
          width: 100%;
          height: 100%;
          border: none;
        }

        @media (max-width: 640px) {
          .venues-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="location-container">
        <SectionTitle subtitle={data.subtitle} title={data.title} />

        <div className="venues-grid">
          {data.venues.map((venue) => (
            <VenueCard key={venue.id} venue={venue} />
          ))}
        </div>

        {data.showMap && data.venues[0]?.coordinates && (
          <div className="map-container">
            <iframe
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${data.venues[0].coordinates.lat},${data.venues[0].coordinates.lng}&zoom=15`}
              title="Ubicacion"
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default LocationSection;

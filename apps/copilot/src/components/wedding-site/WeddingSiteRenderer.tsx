'use client';

/**
 * Wedding Site Renderer
 * =====================
 * Componente principal que renderiza el sitio de boda completo.
 * Soporta dos modos:
 * - preview: Para el editor con actualizacion en tiempo real
 * - production: Para el sitio publicado con optimizaciones
 */

import React from 'react';
import type {
  WeddingSiteRendererProps,
  SectionConfig,
  ScheduleData,
  ScheduleEvent,
  LocationData,
  GalleryData,
  InfoData,
  RSVPData,
  RSVPSubmission,
  RegistryData,
} from './types';
import { ThemeProvider } from './ThemeProvider';
import { SectionWrapper } from './shared/SectionWrapper';

// Sections
import { HeroSection } from './sections/HeroSection';
import { ScheduleSection } from './sections/ScheduleSection';
import { LocationSection } from './sections/LocationSection';
import { GallerySection } from './sections/GallerySection';
import { InfoSection } from './sections/InfoSection';
import { RSVPSection } from './sections/RSVPSection';
import { RegistrySection } from './sections/RegistrySection';

interface WeddingSiteRendererExtendedProps extends WeddingSiteRendererProps {
  onRSVPSubmit?: (submission: RSVPSubmission) => Promise<void>;
  onScheduleEventAdd?: (event: Omit<ScheduleEvent, 'id'>) => void;
  onScheduleEventDelete?: (eventId: string) => void;
  onScheduleEventUpdate?: (eventId: string, event: Partial<ScheduleEvent>) => void;
}

function renderSection(
  section: SectionConfig,
  mode: WeddingSiteRendererProps['mode'],
  onRSVPSubmit?: (submission: RSVPSubmission) => Promise<void>,
  onScheduleEventAdd?: (event: Omit<ScheduleEvent, 'id'>) => void,
  onScheduleEventUpdate?: (eventId: string, event: Partial<ScheduleEvent>) => void,
  onScheduleEventDelete?: (eventId: string) => void
): React.ReactNode {
  switch (section.type) {
    case 'schedule': {
      return (
        <ScheduleSection 
          data={section.data as ScheduleData} 
          mode={mode}
          onEventAdd={onScheduleEventAdd}
          onEventDelete={onScheduleEventDelete}
          onEventUpdate={onScheduleEventUpdate}
        />
      );
    }

    case 'location': {
      return <LocationSection data={section.data as LocationData} mode={mode} />;
    }

    case 'gallery': {
      return <GallerySection data={section.data as GalleryData} mode={mode} />;
    }

    case 'info': {
      return <InfoSection data={section.data as InfoData} mode={mode} />;
    }

    case 'rsvp': {
      return (
        <RSVPSection
          data={section.data as RSVPData}
          mode={mode}
          onSubmit={onRSVPSubmit}
        />
      );
    }

    case 'registry': {
      return <RegistrySection data={section.data as RegistryData} mode={mode} />;
    }

    default: {
      return null;
    }
  }
}

function Footer() {
  return (
    <footer className="wedding-footer">
      <style jsx>{`
        .wedding-footer {
          padding: 3rem 1.5rem;
          background-color: var(--wedding-primary);
          text-align: center;
        }

        .footer-heart {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .footer-text {
          font-family: var(--wedding-font-body);
          font-size: 0.875rem;
          color: var(--wedding-text-on-primary);
          opacity: 0.9;
        }

        .footer-link {
          color: var(--wedding-text-on-primary);
          text-decoration: none;
        }
      `}</style>

      <div className="footer-heart">❤️</div>
      <p className="footer-text">
        Creado con amor usando{' '}
        <a
          className="footer-link"
          href="https://bodasdehoy.com"
          rel="noopener noreferrer"
          target="_blank"
        >
          Bodas de Hoy
        </a>
      </p>
    </footer>
  );
}

export function WeddingSiteRenderer({
  mode,
  wedding,
  onSectionClick,
  onRSVPSubmit,
  onScheduleEventAdd,
  onScheduleEventUpdate,
  onScheduleEventDelete,
  className = '',
}: WeddingSiteRendererExtendedProps) {
  // Filtrar y ordenar secciones habilitadas (excluyendo hero que siempre va primero)
  const enabledSections = wedding.sections
    .filter((s) => s.enabled && s.type !== 'hero')
    .sort((a, b) => a.order - b.order);

  return (
    <ThemeProvider
      customColors={wedding.style.customColors}
      fonts={wedding.style.customFonts}
      palette={wedding.style.palette}
    >
      <div className={`wedding-site wedding-site--${mode} ${className}`}>
        <style jsx>{`
          .wedding-site {
            min-height: 100vh;
            overflow-x: hidden;
          }

          .wedding-site--preview {
            /* En preview, permitir scroll suave */
            scroll-behavior: smooth;
          }

          .wedding-site--production {
            /* En production, optimizaciones */
          }
        `}</style>

        {/* Hero siempre visible */}
        <HeroSection
          couple={wedding.couple}
          data={wedding.hero}
          date={wedding.date}
          mode={mode}
        />

        {/* Secciones ordenadas y filtradas */}
        {enabledSections.map((section) => (
          <SectionWrapper
            id={`section-${section.type}`}
            key={section.type}
            mode={mode}
            onClick={onSectionClick}
            type={section.type}
          >
            {renderSection(
              section, 
              mode, 
              onRSVPSubmit,
              onScheduleEventAdd,
              onScheduleEventUpdate,
              onScheduleEventDelete
            )}
          </SectionWrapper>
        ))}

        {/* Footer */}
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default WeddingSiteRenderer;

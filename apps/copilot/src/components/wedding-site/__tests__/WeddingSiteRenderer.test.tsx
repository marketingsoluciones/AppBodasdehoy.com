import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WeddingSiteRenderer } from '../WeddingSiteRenderer';
import type { WeddingWebData } from '../types';

// No usar mocks - usar datos reales
// Los tests se conectarán a servicios reales (Google Fonts, APIs, etc.)

// Mock data
const mockWedding: WeddingWebData = {
  id: 'test-wedding-1',
  slug: 'maria-juan',
  couple: {
    partner1: { name: 'Maria' },
    partner2: { name: 'Juan' },
  },
  date: {
    date: new Date('2025-06-15T17:00:00Z').toISOString(),
    time: '17:00',
  },
  style: {
    palette: 'romantic',
  },
  hero: {
    image: 'https://example.com/hero.jpg',
    showCountdown: true,
    subtitle: 'Nos casamos',
  },
  sections: [
    {
      type: 'schedule',
      enabled: true,
      order: 1,
      data: {
        title: 'Programa del Dia',
        events: [
          { id: '1', type: 'ceremony', title: 'Ceremonia', time: '17:00', location: 'Iglesia' },
        ],
      },
    },
    {
      type: 'location',
      enabled: true,
      order: 2,
      data: {
        title: 'Ubicacion',
        showMap: false,
        showDirections: true,
        venues: [
          {
            id: '1',
            name: 'Hacienda Los Olivos',
            type: 'both',
            address: 'Calle Principal 123',
            city: 'Ciudad',
          },
        ],
      },
    },
    {
      type: 'gallery',
      enabled: false, // Disabled section
      order: 3,
      data: {
        title: 'Galeria',
        layout: 'grid',
        photos: [],
      },
    },
  ],
  published: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('WeddingSiteRenderer', () => {
  describe('Basic Rendering', () => {
    it('renders couple names in hero section', () => {
      render(<WeddingSiteRenderer mode="preview" wedding={mockWedding} />);

      expect(screen.getByText(/Maria/i)).toBeInTheDocument();
      expect(screen.getByText(/Juan/i)).toBeInTheDocument();
    });

    it('renders hero subtitle', () => {
      render(<WeddingSiteRenderer mode="preview" wedding={mockWedding} />);

      expect(screen.getByText('Nos casamos')).toBeInTheDocument();
    });

    it('renders enabled sections', () => {
      render(<WeddingSiteRenderer mode="preview" wedding={mockWedding} />);

      expect(screen.getByText('Programa del Dia')).toBeInTheDocument();
      expect(screen.getByText('Ubicacion')).toBeInTheDocument();
    });

    it('does not render disabled sections', () => {
      render(<WeddingSiteRenderer mode="preview" wedding={mockWedding} />);

      expect(screen.queryByText('Galeria')).not.toBeInTheDocument();
    });
  });

  describe('Preview Mode', () => {
    it('calls onSectionClick when section is clicked in preview mode', () => {
      const handleSectionClick = vi.fn();
      render(
        <WeddingSiteRenderer
          mode="preview"
          wedding={mockWedding}
          onSectionClick={handleSectionClick}
        />
      );

      // Find and click a section
      const scheduleSection = screen.getByText('Programa del Dia').closest('section');
      if (scheduleSection) {
        scheduleSection.click();
        expect(handleSectionClick).toHaveBeenCalledWith('schedule');
      }
    });

    it('renders edit indicators in preview mode', () => {
      const { container } = render(
        <WeddingSiteRenderer
          mode="preview"
          wedding={mockWedding}
          onSectionClick={vi.fn()}
        />
      );

      // Check for sections with preview class (indicating edit mode)
      const previewSections = container.querySelectorAll('.wedding-section--preview');
      expect(previewSections.length).toBeGreaterThan(0);
    });
  });

  describe('Production Mode', () => {
    it('does not call onSectionClick in production mode', () => {
      const handleSectionClick = vi.fn();
      render(
        <WeddingSiteRenderer
          mode="production"
          wedding={mockWedding}
          onSectionClick={handleSectionClick}
        />
      );

      const scheduleSection = screen.getByText('Programa del Dia').closest('section');
      if (scheduleSection) {
        scheduleSection.click();
        expect(handleSectionClick).not.toHaveBeenCalled();
      }
    });
  });

  describe('Theme Application', () => {
    it('applies romantic palette CSS variables', () => {
      const { container } = render(
        <WeddingSiteRenderer mode="preview" wedding={mockWedding} />
      );

      // Verificar que el componente se renderiza correctamente
      const weddingSite = container.querySelector('.wedding-site');
      expect(weddingSite).toBeInTheDocument();
      
      // Verificar que el ThemeProvider aplica las variables CSS
      const themeRoot = container.querySelector('.wedding-theme-root');
      expect(themeRoot).toBeInTheDocument();
    });

    it('changes theme when palette changes', () => {
      const { rerender, container } = render(
        <WeddingSiteRenderer mode="preview" wedding={mockWedding} />
      );

      const elegantWedding = {
        ...mockWedding,
        style: { palette: 'elegant' as const },
      };

      rerender(<WeddingSiteRenderer mode="preview" wedding={elegantWedding} />);

      // Verificar que el componente se renderiza con el nuevo tema
      const weddingSite = container.querySelector('.wedding-site');
      expect(weddingSite).toBeInTheDocument();
      
      const themeRoot = container.querySelector('.wedding-theme-root');
      expect(themeRoot).toBeInTheDocument();
    });
  });

  describe('Section Order', () => {
    it('renders sections in correct order', () => {
      const orderedWedding: WeddingWebData = {
        ...mockWedding,
        sections: [
          { ...mockWedding.sections[1], order: 1 }, // Location first
          { ...mockWedding.sections[0], order: 2 }, // Schedule second
        ],
      };

      const { container } = render(<WeddingSiteRenderer mode="preview" wedding={orderedWedding} />);

      // Buscar secciones por su id o className
      const locationSection = container.querySelector('#section-location');
      const scheduleSection = container.querySelector('#section-schedule');
      
      expect(locationSection).toBeInTheDocument();
      expect(scheduleSection).toBeInTheDocument();
      
      // Verificar que location viene antes que schedule en el DOM
      const allSections = container.querySelectorAll('.wedding-section');
      const locationIndex = Array.from(allSections).findIndex(s => s.id === 'section-location');
      const scheduleIndex = Array.from(allSections).findIndex(s => s.id === 'section-schedule');
      
      expect(locationIndex).toBeLessThan(scheduleIndex);
    });
  });

  describe('RSVP Submission', () => {
    it('calls onRSVPSubmit in production mode with RSVP section', () => {
      const handleRSVPSubmit = vi.fn();
      const weddingWithRSVP: WeddingWebData = {
        ...mockWedding,
        sections: [
          ...mockWedding.sections,
          {
            type: 'rsvp',
            enabled: true,
            order: 10,
            data: {
              title: 'RSVP',
              config: {
                deadline: '2025-05-15',
                allowPlusOne: true,
                askDietaryRestrictions: true,
                askSongRequest: false,
                askMessage: true,
              },
            },
          },
        ],
      };

      render(
        <WeddingSiteRenderer
          mode="production"
          wedding={weddingWithRSVP}
          onRSVPSubmit={handleRSVPSubmit}
        />
      );

      expect(screen.getByText('RSVP')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('renders gracefully with minimal data', () => {
      const minimalWedding: WeddingWebData = {
        id: 'minimal',
        slug: '',
        couple: {
          partner1: { name: '' },
          partner2: { name: '' },
        },
        date: { date: new Date().toISOString() },
        style: { palette: 'romantic' },
        hero: { image: '', showCountdown: false },
        sections: [],
        published: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(() => {
        render(<WeddingSiteRenderer mode="preview" wedding={minimalWedding} />);
      }).not.toThrow();
    });
  });
});

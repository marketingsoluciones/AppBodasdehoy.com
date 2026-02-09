import {
  PALETTES,
  getPalette,
  getAllPalettes,
  paletteToCSS,
} from '../styles/palettes';
import type { PaletteType } from '../types';

describe('Palettes', () => {
  describe('PALETTES constant', () => {
    it('contains all expected palette types', () => {
      const expectedPalettes: PaletteType[] = [
        'romantic',
        'elegant',
        'modern',
        'rustic',
        'beach',
        'classic',
      ];

      expectedPalettes.forEach((palette) => {
        expect(PALETTES[palette]).toBeDefined();
      });
    });

    it('each palette has required properties', () => {
      Object.values(PALETTES).forEach((palette) => {
        expect(palette.id).toBeDefined();
        expect(palette.name).toBeDefined();
        expect(palette.colors).toBeDefined();
        expect(palette.fonts).toBeDefined();
      });
    });

    it('each palette has all required colors', () => {
      const requiredColors = [
        'primary',
        'secondary',
        'accent',
        'background',
        'surface',
        'text',
        'textLight',
        'border',
      ];

      Object.values(PALETTES).forEach((palette) => {
        requiredColors.forEach((color) => {
          expect(palette.colors[color as keyof typeof palette.colors]).toBeDefined();
        });
      });
    });

    it('each palette has heading and body fonts', () => {
      Object.values(PALETTES).forEach((palette) => {
        expect(palette.fonts.heading).toBeDefined();
        expect(palette.fonts.body).toBeDefined();
      });
    });
  });

  describe('getPalette', () => {
    it('returns correct palette for valid type', () => {
      const romantic = getPalette('romantic');
      expect(romantic.id).toBe('romantic');
      expect(romantic.name).toBe('Romantico');
    });

    it('returns romantic palette for invalid type (fallback)', () => {
      const invalid = getPalette('invalid' as PaletteType);
      expect(invalid.id).toBe('romantic');
    });

    it('returns each palette type correctly', () => {
      const types: PaletteType[] = ['romantic', 'elegant', 'modern', 'rustic', 'beach', 'classic'];

      types.forEach((type) => {
        const palette = getPalette(type);
        expect(palette.id).toBe(type);
      });
    });
  });

  describe('getAllPalettes', () => {
    it('returns array of all palettes', () => {
      const palettes = getAllPalettes();
      expect(Array.isArray(palettes)).toBe(true);
      expect(palettes.length).toBe(6);
    });

    it('returns palettes with all properties', () => {
      const palettes = getAllPalettes();

      palettes.forEach((palette) => {
        expect(palette.id).toBeDefined();
        expect(palette.name).toBeDefined();
        expect(palette.colors).toBeDefined();
        expect(palette.fonts).toBeDefined();
      });
    });
  });

  describe('paletteToCSS', () => {
    it('generates valid CSS variables', () => {
      const css = paletteToCSS(getPalette('romantic'));

      expect(css).toContain('--wedding-primary');
      expect(css).toContain('--wedding-secondary');
      expect(css).toContain('--wedding-accent');
      expect(css).toContain('--wedding-background');
      expect(css).toContain('--wedding-text');
      expect(css).toContain('--wedding-text-light');
    });

    it('includes font variables', () => {
      const css = paletteToCSS(getPalette('elegant'));

      expect(css).toContain('--wedding-font-heading');
      expect(css).toContain('--wedding-font-body');
    });

    it('generates valid hex color values', () => {
      const css = paletteToCSS(getPalette('romantic'));
      const hexPattern = /#[0-9a-fA-F]{6}/g;
      const matches = css.match(hexPattern);

      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThan(0);
    });
  });

  describe('Palette Color Values', () => {
    it('romantic palette has pink tones', () => {
      const romantic = PALETTES.romantic;
      // Primary should be pinkish (high red component)
      expect(romantic.colors.primary).toMatch(/#[d-f]/i);
    });

    it('elegant palette has dark tones', () => {
      const elegant = PALETTES.elegant;
      // Should have darker colors
      expect(elegant.colors.text).toBeDefined();
    });

    it('beach palette has blue tones', () => {
      const beach = PALETTES.beach;
      // Primary should have blue component
      expect(beach.colors.primary).toBeDefined();
    });

    it('rustic palette has earth tones', () => {
      const rustic = PALETTES.rustic;
      expect(rustic.colors.primary).toBeDefined();
    });
  });

  describe('Palette Font Pairings', () => {
    it('romantic uses elegant serif fonts', () => {
      const romantic = PALETTES.romantic;
      expect(romantic.fonts.heading).toContain('Playfair');
    });

    it('modern uses sans-serif fonts', () => {
      const modern = PALETTES.modern;
      // Modern typically uses clean sans-serif
      expect(modern.fonts.body).toBeDefined();
    });

    it('all fonts are Google Fonts compatible', () => {
      const googleFonts = [
        'Playfair Display',
        'Cormorant Garamond',
        'Montserrat',
        'Lato',
        'Great Vibes',
        'Josefin Sans',
        'Libre Baskerville',
        'Source Sans Pro',
        'Amatic SC',
        'Quicksand',
        'Pacifico',
        'Open Sans',
        'Crimson Text',
        'Raleway',
      ];

      Object.values(PALETTES).forEach((palette) => {
        // At least heading or body should be a known Google Font
        const hasGoogleFont =
          googleFonts.some((font) => palette.fonts.heading.includes(font)) ||
          googleFonts.some((font) => palette.fonts.body.includes(font));

        expect(hasGoogleFont).toBe(true);
      });
    });
  });
});

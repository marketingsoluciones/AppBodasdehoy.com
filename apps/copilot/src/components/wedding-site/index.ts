/**
 * Wedding Site Components
 * =======================
 * Exports principales para el sistema de renderizado de webs de boda
 */

// Main Renderer
export { WeddingSiteRenderer } from './WeddingSiteRenderer';
export { default } from './WeddingSiteRenderer';

// Theme
export { ThemeProvider } from './ThemeProvider';

// Sections
export { GallerySection } from './sections/GallerySection';
export { HeroSection } from './sections/HeroSection';
export { InfoSection } from './sections/InfoSection';
export { LocationSection } from './sections/LocationSection';
export { RegistrySection } from './sections/RegistrySection';
export { RSVPSection } from './sections/RSVPSection';
export { ScheduleSection } from './sections/ScheduleSection';

// Shared Components
export { Button } from './shared/Button';
export { SectionTitle } from './shared/SectionTitle';
export { SectionWrapper } from './shared/SectionWrapper';

// UI Components
export type { ImageUploaderProps } from './ImageUploader';
export { ImageUploader } from './ImageUploader';
export type { MobileTabType } from './MobileTabs';
export { MobileTabs } from './MobileTabs';
export { PublishModal } from './PublishModal';

// Error Handling
export { ErrorBoundary, SectionErrorBoundary, WeddingCreatorErrorBoundary } from './ErrorBoundary';

// Loading States
export {
  ChatSkeleton,
  PreviewSkeleton,
  SectionSkeleton,
  WeddingCreatorSkeleton,
} from './LoadingSkeletons';

// Styles
export { getFontPreloadLinks, getGoogleFontsUrl, GOOGLE_FONTS, PALETTE_FONTS } from './styles/fonts';
export { getAllPalettes, getPalette, PALETTES, paletteToCSS } from './styles/palettes';

// Utils
export { calculateCountdown,daysUntil, formatShortDate, formatTime, formatWeddingDate } from './utils/formatDate';
export * from './utils/icons';

// Types
export type {
  Accommodation,
  CashOption,
  // Wedding Data
  CoupleInfo,
  DressCode,
  DressCodeType,
  FAQ,
  GalleryData,
  GalleryLayout,
  // Sections
  HeroData,
  InfoData,
  LocationData,
  Palette,
  PaletteColors,
  // Palettes
  PaletteType,
  Photo,
  RegistryData,
  RegistryLink,
  RenderMode,
  RSVPConfig,
  RSVPData,
  RSVPSubmission,
  ScheduleData,
  ScheduleEvent,
  ScheduleEventType,
  SectionConfig,
  // Config
  SectionType,
  ThemeProviderProps,
  Venue,
  WeddingDate,
  // Props
  WeddingSiteRendererProps,
  WeddingStyle,
  WeddingWebData,
} from './types';

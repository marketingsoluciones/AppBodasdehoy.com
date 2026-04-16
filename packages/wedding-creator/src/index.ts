/**
 * @bodasdehoy/wedding-creator
 * Paquete compartido: Creador de webs para bodas y eventos.
 * Uso: Copilot, App Bodas, CRM, ERP; opcional web standalone.
 *
 * Exporta config, tipos y componentes wedding-site (renderer, secciones, estilos, utils).
 */

export type { WeddingCreatorConfig } from './config';
export type {
  Accommodation,
  CashOption,
  CoupleInfo,
  DressCode,
  DressCodeType,
  FAQ,
  GalleryData,
  GalleryLayout,
  HeroData,
  InfoData,
  LocationData,
  Palette,
  PaletteColors,
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
  SectionType,
  ThemeProviderProps,
  Venue,
  WeddingDate,
  WeddingSiteRendererProps,
  WeddingStyle,
  WeddingWebData,
} from './types';

export * from './wedding-site';

export { useWeddingWeb } from './hooks/useWeddingWeb';
export type { UseWeddingWebOptions, UseWeddingWebReturn, WeddingWebAPI } from './hooks/useWeddingWeb';

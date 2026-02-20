/**
 * Tipos del Creador de webs de boda.
 * Copiados desde apps/copilot para que consumidores del paquete tengan la misma superficie de tipos.
 */

import type { ReactNode } from 'react';

export type PaletteType =
  | 'romantic'
  | 'elegant'
  | 'modern'
  | 'rustic'
  | 'beach'
  | 'classic';

export interface PaletteColors {
  accent: string;
  background: string;
  backgroundAlt: string;
  primary: string;
  secondary: string;
  text: string;
  textLight: string;
  textOnPrimary: string;
}

export interface Palette {
  colors: PaletteColors;
  fonts: { body: string; heading: string };
  id: PaletteType;
  name: string;
}

export interface CoupleInfo {
  partner1: { fullName?: string; name: string; photo?: string };
  partner2: { fullName?: string; name: string; photo?: string };
}

export interface WeddingDate {
  date: string;
  time?: string;
  timezone?: string;
}

export interface HeroData {
  image: string;
  layout?: 'centered' | 'left' | 'right';
  overlay?: number;
  showCountdown: boolean;
  subtitle?: string;
}

export type ScheduleEventType =
  | 'ceremony'
  | 'cocktail'
  | 'dinner'
  | 'party'
  | 'photos'
  | 'other';

export interface ScheduleEvent {
  description?: string;
  endTime?: string;
  icon?: string;
  id: string;
  location?: string;
  time: string;
  title: string;
  type: ScheduleEventType;
}

export interface ScheduleData {
  events: ScheduleEvent[];
  subtitle?: string;
  title: string;
}

export interface Venue {
  address: string;
  city?: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  googleMapsUrl?: string;
  id: string;
  image?: string;
  name: string;
  parkingInfo?: string;
  type: 'ceremony' | 'reception' | 'both' | 'other';
  wazeUrl?: string;
}

export interface LocationData {
  showDirections: boolean;
  showMap: boolean;
  subtitle?: string;
  title: string;
  venues: Venue[];
}

export type GalleryLayout = 'grid' | 'masonry' | 'carousel';

export interface Photo {
  caption?: string;
  height?: number;
  id: string;
  thumbnail?: string;
  url: string;
  width?: number;
}

export interface GalleryData {
  layout: GalleryLayout;
  photos: Photo[];
  subtitle?: string;
  title: string;
}

export type DressCodeType =
  | 'formal'
  | 'semi-formal'
  | 'cocktail'
  | 'casual'
  | 'beach'
  | 'black-tie'
  | 'custom';

export interface DressCode {
  avoid?: string[];
  colors?: string[];
  description?: string;
  type: DressCodeType;
}

export interface Accommodation {
  address?: string;
  description?: string;
  discountCode?: string;
  id: string;
  image?: string;
  name: string;
  phone?: string;
  priceRange?: string;
  website?: string;
}

export interface FAQ {
  answer: string;
  id: string;
  question: string;
}

export interface InfoData {
  accommodations?: Accommodation[];
  dressCode?: DressCode;
  faqs?: FAQ[];
  title: string;
}

export interface RSVPConfig {
  allowPlusOne: boolean;
  askDietaryRestrictions: boolean;
  askMessage: boolean;
  askSongRequest: boolean;
  customQuestions?: {
    id: string;
    options?: string[];
    question: string;
    required?: boolean;
    type: 'text' | 'select' | 'checkbox';
  }[];
  deadline: string;
  maxGuests?: number;
}

export interface RSVPData {
  config: RSVPConfig;
  message?: string;
  subtitle?: string;
  title: string;
}

export interface RSVPSubmission {
  attending: boolean;
  customAnswers?: Record<string, string>;
  dietaryRestrictions?: string;
  email: string;
  guestCount: number;
  message?: string;
  name: string;
  songRequest?: string;
}

export interface RegistryLink {
  description?: string;
  id: string;
  logo?: string;
  name: string;
  url: string;
}

export interface CashOption {
  bankDetails?: {
    accountHolder: string;
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
    swift?: string;
  };
  enabled: boolean;
  message?: string;
  paypalEmail?: string;
  venmoUsername?: string;
}

export interface RegistryData {
  cashOption?: CashOption;
  links: RegistryLink[];
  message?: string;
  title: string;
}

export type SectionType =
  | 'hero'
  | 'schedule'
  | 'location'
  | 'gallery'
  | 'info'
  | 'rsvp'
  | 'registry';

export interface SectionConfig {
  data:
    | HeroData
    | ScheduleData
    | LocationData
    | GalleryData
    | InfoData
    | RSVPData
    | RegistryData;
  enabled: boolean;
  order: number;
  type: SectionType;
}

export interface WeddingStyle {
  customColors?: Partial<PaletteColors>;
  customFonts?: { body?: string; heading?: string };
  palette: PaletteType;
}

export interface WeddingWebData {
  couple: CoupleInfo;
  createdAt: string;
  date: WeddingDate;
  hero: HeroData;
  id: string;
  published: boolean;
  sections: SectionConfig[];
  seo?: { description?: string; image?: string; title?: string };
  slug: string;
  style: WeddingStyle;
  updatedAt: string;
}

export type RenderMode = 'preview' | 'production';

export interface WeddingSiteRendererProps {
  className?: string;
  mode: RenderMode;
  onSectionClick?: (section: SectionType) => void;
  wedding: WeddingWebData;
}

export interface ThemeProviderProps {
  children: ReactNode;
  customColors?: Partial<PaletteColors>;
  fonts?: { body?: string; heading?: string };
  palette: PaletteType;
}

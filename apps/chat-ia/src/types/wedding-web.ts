/**
 * Tipos TypeScript para Wedding Web Creator
 * =========================================
 * Alineados con el schema GraphQL de API2
 * Fecha: 2025-12-13
 */

// ========================================
// ENUMS
// ========================================

export enum WeddingTemplate {
  BOHEMIAN = 'BOHEMIAN',
  CLASSIC = 'CLASSIC',
  CUSTOM = 'CUSTOM',
  ELEGANT = 'ELEGANT',
  MINIMALIST = 'MINIMALIST',
  MODERN = 'MODERN',
  ROMANTIC = 'ROMANTIC',
  RUSTIC = 'RUSTIC'
}

export enum WeddingWebStatus {
  ARCHIVED = 'ARCHIVED',
  DRAFT = 'DRAFT',
  PREVIEW = 'PREVIEW',
  PUBLISHED = 'PUBLISHED'
}

export enum PartnerRole {
  BRIDE = 'BRIDE',
  GROOM = 'GROOM',
}

export enum WeddingSectionName {
  COUNTDOWN = 'COUNTDOWN',
  COUPLE = 'COUPLE',
  FAQ = 'FAQ',
  FOOTER = 'FOOTER',
  GALLERY = 'GALLERY',
  GIFTS = 'GIFTS',
  HERO = 'HERO',
  OUR_STORY = 'OUR_STORY',
  RSVP = 'RSVP',
  TIMELINE = 'TIMELINE',
  VENUE = 'VENUE'
}

// Alias para compatibilidad
export enum SectionName {
  COUNTDOWN = 'COUNTDOWN',
  COUPLE = 'COUPLE',
  FAQ = 'FAQ',
  FOOTER = 'FOOTER',
  GALLERY = 'GALLERY',
  GIFTS = 'GIFTS',
  HERO = 'HERO',
  OUR_STORY = 'OUR_STORY',
  RSVP = 'RSVP',
  TIMELINE = 'TIMELINE',
  VENUE = 'VENUE'
}

export enum RSVPQuestionType {
  CHECKBOX = 'CHECKBOX',
  MULTISELECT = 'MULTISELECT',
  NUMBER = 'NUMBER',
  SELECT = 'SELECT',
  TEXT = 'TEXT'
}

// ========================================
// TIPOS BÁSICOS
// ========================================

export interface PartnerInfo {
  bio?: string;
  name: string;
  photoUrl?: string;
  role?: PartnerRole;
}

export interface CoupleInfo {
  hashtag?: string;
  partner1: PartnerInfo;
  partner2: PartnerInfo;
}

export interface WeddingStyle {
  fontBody?: string;
  fontHeading?: string;
  /** @deprecated Use heroImageUrl instead */
  heroImage?: string;
  /** URL de la imagen del hero (nombre correcto en API2) */
  heroImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  template: WeddingTemplate;
}

export interface SectionConfig {
  enabled: boolean;
  order: number;
  subtitle?: string;
  title?: string;
}

export interface WeddingSections {
  countdown?: SectionConfig;
  couple?: SectionConfig;
  faq?: SectionConfig;
  footer?: SectionConfig;
  gallery?: SectionConfig;
  gifts?: SectionConfig;
  hero?: SectionConfig;
  ourStory?: SectionConfig;
  rsvp?: SectionConfig;
  timeline?: SectionConfig;
  venue?: SectionConfig;
}

export interface RSVPQuestion {
  id?: string;
  options?: string[];
  order?: number;
  question: string;
  required?: boolean;
  type: RSVPQuestionType;
}

export interface RSVPConfig {
  allowMessage?: boolean;
  confirmationMessage?: string;
  deadline?: string;
  dietaryOptions?: string[];
  enabled: boolean;
  maxPlusOnes?: number;
  mealOptions?: string[];
  questions?: RSVPQuestion[];
  requireEmail?: boolean;
  requirePhone?: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface VenueLocation {
  address?: string;
  city?: string;
  coordinates?: Coordinates;
  dressCode?: string;
  name?: string;
  notes?: string;
  time?: string;
}

export interface WeddingVenue {
  accommodationInfo?: string;
  ceremony?: VenueLocation;
  parkingInfo?: string;
  reception?: VenueLocation;
  sameVenue?: boolean;
}

export interface OurStory {
  firstDate?: string;
  howWeMet?: string;
  photos?: string[];
  proposal?: string;
}

export interface GiftRegistryLink {
  description?: string;
  id: string;
  logoUrl?: string;
  name: string;
  url: string;
}

export interface CashOption {
  enabled: boolean;
  iban?: string;
  message?: string;
}

export interface GiftRegistry {
  cashOption?: CashOption;
  enabled: boolean;
  links?: GiftRegistryLink[];
  message?: string;
}

export interface FAQItem {
  answer: string;
  id: string;
  order: number;
  question: string;
}

export interface SEOConfig {
  description?: string;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: string;
  title?: string;
}

export interface GalleryPhoto {
  caption?: string;
  id: string;
  url: string;
}

export interface BillingInfo {
  quantity: number;
  recorded: boolean;
  sku: string;
  withinQuota: boolean;
}

// ========================================
// TIPO PRINCIPAL: WEDDING WEB
// ========================================

export interface WeddingWeb {
  albumId?: string;
  couple: CoupleInfo;
  createdAt?: string;
  customDomain?: string;
  eventDate?: string;
  eventId?: string;
  eventName?: string;
  faqItems?: FAQItem[];
  galleryPhotos?: GalleryPhoto[];
  giftRegistry?: GiftRegistry;
  lastEditedAt?: string;
  
  ourStory?: OurStory;
  previewToken?: string;
  previewUrl?: string;
  publicUrl?: string;
  publishedAt?: string;
  rsvpConfig?: RSVPConfig;
  sections: WeddingSections;
  seo?: SEOConfig;
  status: WeddingWebStatus;
  style: WeddingStyle;
  
  subdomain: string;
  updatedAt?: string;
  venue?: WeddingVenue;
  weddingWebId: string;
}

// ========================================
// TIPOS PARA INPUTS (MUTATIONS)
// ========================================

export interface CreateWeddingWebInput {
  couple?: {
    hashtag?: string;
    partner1?: {
      bio?: string;
      name: string;
      photoUrl?: string;
      role?: PartnerRole;
    };
    partner2?: {
      bio?: string;
      name: string;
      photoUrl?: string;
      role?: PartnerRole;
    };
  };
  eventId: string;
  subdomain: string;
  template?: WeddingTemplate;
}

export interface UpdatePartnerInput {
  bio?: string;
  name?: string;
  photoUrl?: string;
  role?: PartnerRole;
}

export interface CoupleInfoInput {
  hashtag?: string;
  partner1?: UpdatePartnerInput;
  partner2?: UpdatePartnerInput;
}

export interface OurStoryInput {
  firstDate?: string;
  howWeMet?: string;
  photos?: string[];
  proposal?: string;
}

export interface WeddingStyleInput {
  fontBody?: string;
  fontHeading?: string;
  heroImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  template?: WeddingTemplate;
}

export interface RSVPConfigInput {
  allowMessage?: boolean;
  confirmationMessage?: string;
  deadline?: string;
  dietaryOptions?: string[];
  enabled?: boolean;
  maxPlusOnes?: number;
  mealOptions?: string[];
  questions?: Omit<RSVPQuestion, 'id'>[];
  requireEmail?: boolean;
  requirePhone?: boolean;
}

export interface RSVPQuestionInput {
  options?: string[];
  order?: number;
  question: string;
  required?: boolean;
  type: RSVPQuestionType;
}

export interface UpdateSectionInput {
  config?: {
    enabled?: boolean;
    order?: number;
    subtitle?: string;
    title?: string;
  };
  section: WeddingSectionName;
}

export interface ReorderSectionsInput {
  sectionOrder: WeddingSectionName[];
}

export interface VenueInfoInput {
  accommodationInfo?: string;
  ceremony?: {
    address?: string;
    city?: string;
    coordinates?: Coordinates;
    dressCode?: string;
    name?: string;
    notes?: string;
    time?: string;
  };
  parkingInfo?: string;
  reception?: {
    address?: string;
    city?: string;
    coordinates?: Coordinates;
    name?: string;
    time?: string;
  };
  sameVenue?: boolean;
}

export interface GiftRegistryInput {
  cashOption?: {
    enabled?: boolean;
    iban?: string;
    message?: string;
  };
  enabled?: boolean;
  links?: Omit<GiftRegistryLink, 'id'>[];
  message?: string;
}

export interface GiftRegistryLinkInput {
  description?: string;
  logoUrl?: string;
  name: string;
  url: string;
}

export interface FAQItemInput {
  answer: string;
  order?: number;
  question: string;
}

export interface SEOConfigInput {
  description?: string;
  keywords?: string[];
  noIndex?: boolean;
  ogImage?: string;
  title?: string;
}

export interface UpdateWeddingWebInput {
  albumId?: string;
  couple?: CoupleInfoInput;
  giftRegistry?: GiftRegistryInput;
  ourStory?: OurStoryInput;
  rsvpConfig?: RSVPConfigInput;
  seo?: SEOConfigInput;
  style?: WeddingStyleInput;
  venue?: VenueInfoInput;
}

export interface RSVPResponseInput {
  answers?: Array<{
    answer: string;
    questionId: string;
  }>;
  attending: boolean;
  dietaryRestrictions?: string;
  email: string;
  guestName: string;
  mealChoice?: string;
  message?: string;
  plusOnes?: number;
}

// ========================================
// TIPOS PARA RESPUESTAS GRAPHQL
// ========================================

export interface GraphQLError {
  code?: string;
  field?: string;
  message: string;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
  success: boolean;
}

export interface GetWeddingWebResponse {
  errors?: GraphQLError[];
  success: boolean;
  weddingWeb?: WeddingWeb;
}

export interface GetPublicWeddingWebResponse {
  errors?: GraphQLError[];
  success: boolean;
  weddingWeb?: Partial<WeddingWeb>;
}

export interface CreateWeddingWebResponse {
  billing?: BillingInfo;
  errors?: GraphQLError[];
  success: boolean;
  weddingWeb?: {
    previewToken?: string;
    previewUrl?: string;
    status: WeddingWebStatus;
    subdomain: string;
    weddingWebId: string;
  };
}

export interface PublishWeddingWebResponse {
  billing?: BillingInfo;
  errors?: GraphQLError[];
  publicUrl?: string;
  success: boolean;
  weddingWeb?: {
    publicUrl?: string;
    publishedAt?: string;
    status: WeddingWebStatus;
    subdomain: string;
  };
}

export interface CheckSubdomainAvailabilityResponse {
  available?: boolean;
  errors?: GraphQLError[];
  success: boolean;
  suggestion?: string;
}

export interface GetMyWeddingWebsResponse {
  errors?: GraphQLError[];
  pagination?: {
    hasMore: boolean;
    limit: number;
    offset: number;
  };
  success: boolean;
  total?: number;
  weddingWebs?: Array<{
    createdAt?: string;
    eventId: string;
    publicUrl?: string;
    status: WeddingWebStatus;
    subdomain: string;
    weddingWebId: string;
  }>;
}

export interface RSVPResponse {
  _id: string;
  answers?: Array<{
    answer: string;
    questionId: string;
  }>;
  attending: boolean;
  createdAt?: string;
  dietaryRestrictions?: string;
  email: string;
  guestName: string;
  mealChoice?: string;
  message?: string;
  plusOnes?: number;
}

export interface RSVPStats {
  attending: number;
  notAttending: number;
  pending: number;
  total: number;
  totalGuests: number;
}

export interface GetRSVPResponsesResponse {
  errors?: GraphQLError[];
  responses?: RSVPResponse[];
  stats?: RSVPStats;
  success: boolean;
}

export interface SubmitRSVPResponse {
  errors?: GraphQLError[];
  response?: {
    _id: string;
    attending: boolean;
    confirmationCode?: string;
  };
  success: boolean;
}

// ========================================
// UTILIDADES: MAPPING ENTRE TIPOS
// ========================================

/**
 * Mapea el template GraphQL a la paleta del frontend
 */
export function mapTemplateToPalette(template: WeddingTemplate): string {
  const mapping: Record<WeddingTemplate, string> = {
    [WeddingTemplate.ROMANTIC]: 'romantic',
    [WeddingTemplate.ELEGANT]: 'elegant',
    [WeddingTemplate.MODERN]: 'modern',
    [WeddingTemplate.RUSTIC]: 'rustic',
    [WeddingTemplate.MINIMALIST]: 'modern', // Minimalist usa estilo moderno
    [WeddingTemplate.BOHEMIAN]: 'rustic', // Bohemian usa estilo rústico
    [WeddingTemplate.CLASSIC]: 'classic',
    [WeddingTemplate.CUSTOM]: 'romantic', // Custom por defecto usa romantic
  };
  return mapping[template] || 'romantic';
}

/**
 * Mapea la paleta del frontend al template GraphQL
 */
export function mapPaletteToTemplate(palette: string): WeddingTemplate {
  const mapping: Record<string, WeddingTemplate> = {
    'beach': WeddingTemplate.MODERN,
    // Beach no existe en GraphQL, usar MODERN
'classic': WeddingTemplate.CLASSIC,
    
'elegant': WeddingTemplate.ELEGANT,
    
'modern': WeddingTemplate.MODERN,
    
'romantic': WeddingTemplate.ROMANTIC, 
    'rustic': WeddingTemplate.RUSTIC,
  };
  return mapping[palette] || WeddingTemplate.ROMANTIC;
}






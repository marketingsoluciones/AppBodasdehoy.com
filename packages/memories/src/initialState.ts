/**
 * @bodasdehoy/memories - State types and initial state
 */

export type ProfessionalSpecialty =
  | 'photographer'
  | 'videographer'
  | 'dj'
  | 'florist'
  | 'catering'
  | 'venue'
  | 'makeup'
  | 'hairstylist'
  | 'wedding_planner'
  | 'musician'
  | 'officiant'
  | 'other';

export interface ProfessionalProfile {
  _id: string;
  userId: string;
  /** URL-friendly unique slug: /pro/[slug] */
  slug: string;
  name: string;
  specialty: ProfessionalSpecialty;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  location?: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
  email?: string;
  /** IDs of albums to show in public portfolio */
  portfolioAlbumIds: string[];
  /** Text shown in watermark overlay (default: name) */
  watermarkText?: string;
  /** Who can print without watermark: owner only, or also album members */
  printPermission: 'owner_only' | 'members';
  /** Whether the public profile is visible */
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AlbumType =
  // Genéricos
  | 'general'
  | 'guestbook'
  | 'photographer'
  // Boda
  | 'wedding_childhood'
  | 'wedding_engagement'
  | 'wedding_bachelor'
  | 'wedding_ceremony'
  | 'wedding_reception'
  | 'wedding_honeymoon'
  // Cumpleaños
  | 'birthday_party'
  | 'birthday_history'
  | 'birthday_surprise'
  // Quinceañera / Sweet 16
  | 'xv_childhood'
  | 'xv_preparation'
  | 'xv_ceremony'
  | 'xv_party'
  // Graduación
  | 'graduation_ceremony'
  | 'graduation_memories'
  | 'graduation_trip'
  // Viaje
  | 'trip_day'
  | 'trip_destination'
  // Corporativo
  | 'corporate_event'
  | 'corporate_team'
  // Celebraciones religiosas
  | 'communion'
  | 'bar_mitzvah'
  | 'baptism'
  // Legacy
  | 'main'
  | 'sub';

export interface Album {
  _id: string;
  albumType?: AlbumType;
  coverImageUrl?: string;
  createdAt: string;
  description?: string;
  eventId?: string;
  itineraryId?: string;
  mediaCount: number;
  memberCount: number;
  name: string;
  ownerId: string;
  parentAlbumId?: string;
  settings?: {
    allow_comments?: boolean;
    allow_downloads?: boolean;
    allow_reactions?: boolean;
  };
  updatedAt: string;
  visibility: 'private' | 'members' | 'public';
  isOptimistic?: boolean;
}

export interface EventAlbumStructure {
  mainAlbum: Album | null;
  subAlbums: Album[];
  totalMediaCount: number;
}

export interface AlbumMedia {
  _id: string;
  albumId: string;
  caption?: string;
  createdAt: string;
  fileId: string;
  location?: string;
  mediaType: 'photo' | 'video';
  originalUrl: string;
  sortOrder: number;
  takenAt?: string;
  thumbnailUrl?: string;
  userId: string;
}

export interface AlbumMember {
  albumId: string;
  invitedBy?: string;
  joinedAt: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  userAvatar?: string;
  userEmail?: string;
  userId: string;
  userName?: string;
}

export interface AlbumInvitation {
  _id: string;
  albumId: string;
  email?: string;
  expiresAt: string;
  invitedBy: string;
  phone?: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  token: string;
}

/** Config injected by host (apiBaseUrl, userId, development) */
export interface MemoriesConfig {
  apiBaseUrl: string;
  userId: string;
  development: string;
}

export interface MemoriesState {
  apiBaseUrl: string;
  userId: string;
  development: string;

  albums: Album[];
  albumsError: string | null;
  albumsLoading: boolean;

  currentAlbum: Album | null;
  currentAlbumError: string | null;
  currentAlbumLoading: boolean;

  currentAlbumMedia: AlbumMedia[];
  currentAlbumMembers: AlbumMember[];

  eventAlbumLoading: boolean;
  eventAlbumStructure: EventAlbumStructure | null;

  isCreateAlbumModalOpen: boolean;
  isInviteModalOpen: boolean;
  isShareModalOpen: boolean;
  isUploadModalOpen: boolean;

  mediaError: string | null;
  mediaLoading: boolean;
  membersError: string | null;
  membersLoading: boolean;

  searchTerm: string;
  selectedMediaIds: string[];
  subAlbums: Album[];

  uploadProgress: number;
  uploadingFiles: string[];

  professionalProfile: ProfessionalProfile | null;
  professionalProfileLoading: boolean;
  professionalProfileError: string | null;
}

export const initialMemoriesState: MemoriesState = {
  apiBaseUrl: '',
  userId: '',
  development: 'bodasdehoy',

  albums: [],
  albumsError: null,
  albumsLoading: false,

  currentAlbum: null,
  currentAlbumError: null,
  currentAlbumLoading: false,

  currentAlbumMedia: [],
  currentAlbumMembers: [],

  eventAlbumLoading: false,
  eventAlbumStructure: null,

  isCreateAlbumModalOpen: false,
  isInviteModalOpen: false,
  isShareModalOpen: false,
  isUploadModalOpen: false,

  mediaError: null,
  mediaLoading: false,
  membersError: null,
  membersLoading: false,

  searchTerm: '',
  selectedMediaIds: [],
  subAlbums: [],

  uploadProgress: 0,
  uploadingFiles: [],

  professionalProfile: null,
  professionalProfileLoading: false,
  professionalProfileError: null,
};

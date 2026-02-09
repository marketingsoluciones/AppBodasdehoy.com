/**
 * Dots Memories - State Types and Initial State
 */

export interface Album {
  _id: string;
  // Vinculado a momento del itinerario
  albumType?: 'main' | 'sub';
  coverImageUrl?: string;
  createdAt: string;
  description?: string;
  eventId?: string;
  // Si es sub-álbum, referencia al padre
  itineraryId?: string;
  mediaCount: number;
  memberCount: number;
  name: string;
  ownerId: string;
  // Nuevos campos para jerarquía evento/itinerario
  parentAlbumId?: string;
  settings?: {
    allow_comments?: boolean;
    allow_downloads?: boolean;
    allow_reactions?: boolean;
  };    
  updatedAt: string;      
  visibility: 'private' | 'members' | 'public'; // Tipo de álbum
}

// Estructura de álbumes de un evento
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

export interface MemoriesState {
  // Albums list
  albums: Album[];
  albumsError: string | null;
  albumsLoading: boolean;

  // Current album detail
  currentAlbum: Album | null;
  currentAlbumError: string | null;
  currentAlbumLoading: boolean;

  // Album media
  currentAlbumMedia: AlbumMedia[];
  // Album members
  currentAlbumMembers: AlbumMember[];

  eventAlbumLoading: boolean;
  // Estructura de evento (álbum principal + sub-álbumes)
  eventAlbumStructure: EventAlbumStructure | null;

  isCreateAlbumModalOpen: boolean;

  isInviteModalOpen: boolean;

  isShareModalOpen: boolean;
  isUploadModalOpen: boolean;
  mediaError: string | null;

  mediaLoading: boolean;
  membersError: string | null;
  membersLoading: boolean;
  // UI state
  searchTerm: string;
  selectedMediaIds: string[];
  // Sub-álbumes del álbum actual
  subAlbums: Album[];

  // Upload state
  uploadProgress: number;
  uploadingFiles: string[];
}

export const initialMemoriesState: MemoriesState = {
  // Albums list
  albums: [],
  albumsError: null,
  albumsLoading: false,

  // Current album detail
  currentAlbum: null,
  currentAlbumError: null,
  currentAlbumLoading: false,

  // Album media
  currentAlbumMedia: [],
  // Album members
  currentAlbumMembers: [],

  
  eventAlbumLoading: false,
  // Estructura de evento
eventAlbumStructure: null,

  
  // UI state
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
  // Sub-álbumes
subAlbums: [],

  // Upload state
  uploadProgress: 0,
  uploadingFiles: [],
};

/**
 * Tests para Upload de Media en Álbum
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock del store
const mockUploadMedia = vi.fn();
const mockFetchAlbumMedia = vi.fn();

const mockUseMemoriesStore = vi.fn(() => ({
  currentAlbum: {
    _id: 'album123',
    name: 'Test Album',
    eventId: null,
  },
  currentAlbumLoading: false,
  currentAlbumMedia: [],
  mediaLoading: false,
  currentAlbumMembers: [],
  membersLoading: false,
  selectedMediaIds: [],
  setSelectedMediaIds: vi.fn(),
  deleteMedia: vi.fn(),
  fetchAlbum: vi.fn(),
  fetchAlbumMedia: mockFetchAlbumMedia,
  fetchAlbumMembers: vi.fn(),
  clearCurrentAlbum: vi.fn(),
  toggleInviteModal: vi.fn(),
  generateShareLink: vi.fn(),
  uploadMedia: mockUploadMedia,
  inviteMember: vi.fn(),
  updateAlbum: vi.fn(),
  deleteAlbum: vi.fn(),
  getEventGuests: vi.fn(),
  sendQrToGuests: vi.fn(),
}));

vi.mock('@bodasdehoy/memories', () => ({
  useMemoriesStore: mockUseMemoriesStore,
}));

vi.mock('@/store/user', () => ({
  useUserStore: () => ({
    user: { id: 'user123' },
    isSignedIn: true,
  }),
}));

vi.mock('@/utils/developmentDetector', () => ({
  useDevelopment: () => ({
    development: 'bodasdehoy',
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    albumId: 'album123',
  }),
}));

const mockLocalStorage = {
  getItem: vi.fn((key: string) => {
    if (key === 'dev-user-config') {
      return JSON.stringify({ userId: 'user123', user_id: 'user123' });
    }
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

vi.mock('@/store/chat', () => ({
  useChatStore: vi.fn(() => ({
    fetchUserEvents: vi.fn(),
    userEvents: [],
  })),
}));

vi.mock('@/utils/performanceMonitor', () => ({
  performanceMonitor: {
    startPhase: vi.fn(),
    endPhase: vi.fn(),
    startTimes: new Map(),
  },
}));

vi.mock('@/const/supportKeys', () => ({
  getSupportKey: vi.fn(() => 'test-support-key'),
}));

const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  loading: vi.fn(),
};
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: mockMessage,
  };
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('AlbumDetailPage - Upload Media', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'dev-user-config') {
        return JSON.stringify({ userId: 'user123', user_id: 'user123' });
      }
      return null;
    });
  });

  it('debe renderizar la zona de upload con texto correcto', async () => {
    const AlbumDetailPage = (await import('../page')).default;
    render(<AlbumDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Arrastra fotos aquí o haz clic para subir')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('debe mostrar texto de tipos soportados', async () => {
    const AlbumDetailPage = (await import('../page')).default;
    render(<AlbumDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Soporta imágenes y videos/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('debe renderizar botón Subir Fotos', async () => {
    const AlbumDetailPage = (await import('../page')).default;
    render(<AlbumDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Subir Fotos')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('debe llamar uploadMedia al subir un archivo', async () => {
    mockUploadMedia.mockResolvedValue({
      _id: 'media1',
      mediaType: 'photo',
      originalUrl: 'https://example.com/photo.jpg',
    });

    const AlbumDetailPage = (await import('../page')).default;
    render(<AlbumDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Subir Fotos')).toBeInTheDocument();
    }, { timeout: 5000 });

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();

    const file = new File(['test-content'], 'test-photo.png', { type: 'image/png' });
    await userEvent.upload(fileInput as HTMLElement, file);

    await waitFor(() => {
      expect(mockUploadMedia).toHaveBeenCalledWith('album123', expect.any(File));
    }, { timeout: 5000 });
  });

  it('debe mostrar mensaje de éxito tras upload correcto', async () => {
    mockUploadMedia.mockResolvedValue({
      _id: 'media1',
      mediaType: 'photo',
      originalUrl: 'https://example.com/photo.jpg',
    });

    const AlbumDetailPage = (await import('../page')).default;
    render(<AlbumDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Subir Fotos')).toBeInTheDocument();
    }, { timeout: 5000 });

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test-content'], 'test-photo.png', { type: 'image/png' });
    await userEvent.upload(fileInput as HTMLElement, file);

    await waitFor(() => {
      expect(mockMessage.success).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Archivo subido correctamente', key: 'upload' })
      );
    }, { timeout: 5000 });
  });

  it('debe mostrar mensaje de error cuando upload falla', async () => {
    mockUploadMedia.mockResolvedValue(null);

    const AlbumDetailPage = (await import('../page')).default;
    render(<AlbumDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Subir Fotos')).toBeInTheDocument();
    }, { timeout: 5000 });

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['test-content'], 'test-photo.png', { type: 'image/png' });
    await userEvent.upload(fileInput as HTMLElement, file);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Error al subir el archivo', key: 'upload' })
      );
    }, { timeout: 5000 });
  });
});

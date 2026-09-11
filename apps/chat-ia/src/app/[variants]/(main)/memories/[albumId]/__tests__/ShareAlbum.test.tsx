/**
 * Tests para Compartir Álbum y QR
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock del store
const mockGenerateShareLink = vi.fn();

const mockUseMemoriesStore = vi.fn(() => ({
  currentAlbum: {
    _id: 'album123',
    name: 'Test Album',
    eventId: null,
  },
  currentAlbumLoading: false,
  currentAlbumMedia: [
    { _id: 'media1', originalUrl: 'url1', thumbnailUrl: 'thumb1', mediaType: 'photo' },
  ],
  mediaLoading: false,
  currentAlbumMembers: [],
  membersLoading: false,
  selectedMediaIds: [],
  setSelectedMediaIds: vi.fn(),
  deleteMedia: vi.fn(),
  fetchAlbum: vi.fn(),
  fetchAlbumMedia: vi.fn(),
  fetchAlbumMembers: vi.fn(),
  clearCurrentAlbum: vi.fn(),
  toggleInviteModal: vi.fn(),
  generateShareLink: mockGenerateShareLink,
  uploadMedia: vi.fn(),
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

// Mock clipboard
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('AlbumDetailPage - Compartir Álbum', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'dev-user-config') {
        return JSON.stringify({ userId: 'user123', user_id: 'user123' });
      }
      return null;
    });
  });

  it('debe mostrar botón Compartir / QR', async () => {
    const AlbumDetailPage = (await import('../page')).default;
    render(<AlbumDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Compartir / QR')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('debe llamar generateShareLink al hacer click en Compartir', async () => {
    mockGenerateShareLink.mockResolvedValue({
      shareToken: 'test-token-abc123',
      shareUrl: 'https://test.bodasdehoy.com/memories/shared/test-token-abc123',
    });

    const user = userEvent.setup();
    const AlbumDetailPage = (await import('../page')).default;
    render(<AlbumDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Compartir / QR')).toBeInTheDocument();
    }, { timeout: 5000 });

    await user.click(screen.getByText('Compartir / QR'));

    await waitFor(() => {
      expect(mockGenerateShareLink).toHaveBeenCalledWith('album123', 30);
    }, { timeout: 5000 });
  });

  it('debe mostrar modal de compartir con QR tras generar link', async () => {
    mockGenerateShareLink.mockResolvedValue({
      shareToken: 'test-token-abc123',
      shareUrl: 'https://test.bodasdehoy.com/memories/shared/test-token-abc123',
    });

    const user = userEvent.setup();
    const AlbumDetailPage = (await import('../page')).default;
    render(<AlbumDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Compartir / QR')).toBeInTheDocument();
    }, { timeout: 5000 });

    await user.click(screen.getByText('Compartir / QR'));

    await waitFor(() => {
      expect(screen.getByText('Compartir Álbum')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('debe mostrar error cuando falla generateShareLink', async () => {
    mockGenerateShareLink.mockResolvedValue(null);

    const user = userEvent.setup();
    const AlbumDetailPage = (await import('../page')).default;
    render(<AlbumDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Compartir / QR')).toBeInTheDocument();
    }, { timeout: 5000 });

    await user.click(screen.getByText('Compartir / QR'));

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('Error al generar el enlace de compartir');
    }, { timeout: 5000 });
  });
});

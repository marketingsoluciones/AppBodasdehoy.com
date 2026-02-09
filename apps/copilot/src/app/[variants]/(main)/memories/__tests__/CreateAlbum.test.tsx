/**
 * Tests para la funcionalidad de Crear Álbum
 *
 * NOTA: Estos tests requieren configuración adicional de mocks y setup.
 * Ver documentación en docs/IMPLEMENTACION_TESTS_FRONTEND.md
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ⚠️ IMPORTANTE: Los mocks deben estar ANTES de cualquier import que los use
// Mock de useDevelopment - PRIMERO para evitar problemas de resolución
vi.mock('@/utils/developmentDetector', () => {
  return {
    useDevelopment: vi.fn(() => ({
      development: 'bodasdehoy',
    })),
    getCurrentDevelopment: vi.fn(() => 'bodasdehoy'),
    getCurrentDevelopmentConfig: vi.fn(() => ({
      development: 'bodasdehoy',
      name: 'Bodas de Hoy',
      domain: 'bodasdehoy.com',
      api: {
        backendUrl: 'http://localhost:3000',
        graphqlEndpoint: '/graphql',
      },
      colors: {
        accent: '#000',
        background: '#fff',
        primary: '#000',
        secondary: '#666',
        text: '#000',
      },
      corsOrigin: [],
    })),
  };
});

// Mock de performanceMonitor
vi.mock('@/utils/performanceMonitor', () => ({
  performanceMonitor: {
    startPhase: vi.fn(),
    endPhase: vi.fn(),
    startTimes: new Map(),
  },
}));

// Mock de supportKeys
vi.mock('@/const/supportKeys', () => ({
  getSupportKey: vi.fn(() => 'test-support-key'),
}));

// Mock del store
const mockFetchAlbums = vi.fn();
const mockCreateAlbum = vi.fn();
const mockToggleCreateAlbumModal = vi.fn();
const mockToggleCreateAlbum = mockToggleCreateAlbumModal; // Alias para compatibilidad
const mockSetSearchTerm = vi.fn();

const mockUseMemoriesStore = vi.fn(() => ({
  albums: [],
  albumsLoading: false,
  searchTerm: '',
  isCreateAlbumModalOpen: false,
  fetchAlbums: mockFetchAlbums,
  createAlbum: mockCreateAlbum,
  toggleCreateAlbumModal: mockToggleCreateAlbumModal,
  setSearchTerm: mockSetSearchTerm,
}));

vi.mock('@/store/memories', () => ({
  useMemoriesStore: mockUseMemoriesStore,
}));

// Mock de useUserStore
const mockUseUserStore = vi.fn(() => ({
  user: { id: 'user123' },
  isSignedIn: true,
}));

vi.mock('@/store/user', () => ({
  useUserStore: mockUseUserStore,
}));

// Mock de router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({}),
}));

// Mock de useChatStore
const mockFetchUserEvents = vi.fn();
const mockUserEvents: any[] = [];
vi.mock('@/store/chat', () => ({
  useChatStore: vi.fn((selector: any) => selector({
    fetchUserEvents: mockFetchUserEvents,
    userEvents: mockUserEvents,
  })),
}));

// Mock de antd message
const mockMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: mockMessage,
  };
});

// Mock de localStorage para simular usuario autenticado
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

// Ahora sí importar las librerías de testing
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MemoriesPage - Crear Álbum', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetear localStorage mock
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'dev-user-config') {
        return JSON.stringify({ userId: 'user123', user_id: 'user123' });
      }
      return null;
    });
    // Resetear message mocks
    mockMessage.success.mockClear();
    mockMessage.error.mockClear();
  });

  it('debe mostrar el modal al hacer click en "Crear Álbum"', async () => {
    const user = userEvent.setup();
    const MemoriesPage = (await import('../page')).default;
    render(<MemoriesPage />);

    const createButton = screen.getByText('Crear Álbum');
    await user.click(createButton);

    expect(mockToggleCreateAlbumModal).toHaveBeenCalled();
  });

  it('debe validar que el nombre es requerido', async () => {
    const user = userEvent.setup();

    // Simular que el modal está abierto
    mockUseMemoriesStore.mockReturnValue({
      albums: [],
      albumsLoading: false,
      searchTerm: '',
      isCreateAlbumModalOpen: true,
      fetchAlbums: mockFetchAlbums,
      createAlbum: mockCreateAlbum,
      toggleCreateAlbumModal: mockToggleCreateAlbumModal,
      setSearchTerm: mockSetSearchTerm,
    });

    const MemoriesPage = (await import('../page')).default;
    render(<MemoriesPage />);

    // Esperar a que el modal se renderice
    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Álbum')).toBeInTheDocument();
    });

    // Buscar el botón OK del modal (el que tiene okText="Crear Álbum")
    const modal = screen.getByText('Crear Nuevo Álbum').closest('.ant-modal');
    const submitButton = modal?.querySelector('button.ant-btn-primary') || screen.getAllByText('Crear Álbum').find(btn => btn.closest('.ant-modal'));
    
    if (!submitButton) {
      throw new Error('No se encontró el botón de crear en el modal');
    }
    
    await user.click(submitButton as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText('Por favor ingresa un nombre')).toBeInTheDocument();
    });
  });

  it('debe crear un álbum con datos válidos', async () => {
    const user = userEvent.setup();
    const mockAlbum = {
      _id: 'album123',
      name: 'Test Album',
      description: 'Test Description',
      visibility: 'private' as const,
    };

    mockCreateAlbum.mockResolvedValue(mockAlbum);

    // Simular que el modal está abierto
    mockUseMemoriesStore.mockReturnValue({
      albums: [],
      albumsLoading: false,
      searchTerm: '',
      isCreateAlbumModalOpen: true,
      fetchAlbums: mockFetchAlbums,
      createAlbum: mockCreateAlbum,
      toggleCreateAlbumModal: mockToggleCreateAlbumModal,
      setSearchTerm: mockSetSearchTerm,
    });

    const MemoriesPage = (await import('../page')).default;
    render(<MemoriesPage />);

    // Esperar a que el modal se renderice
    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Álbum')).toBeInTheDocument();
    });

    // Llenar formulario
    const nameInput = screen.getByPlaceholderText('Ej: Boda de Ana y Carlos');
    const descInput = screen.getByPlaceholderText('Describe tu álbum...');
    
    await user.type(nameInput, 'Test Album');
    await user.type(descInput, 'Test Description');

    // Crear - buscar el botón OK del modal
    const modal = screen.getByText('Crear Nuevo Álbum').closest('.ant-modal');
    const submitButton = modal?.querySelector('button.ant-btn-primary') || screen.getAllByText('Crear Álbum').find(btn => btn.closest('.ant-modal'));
    
    if (!submitButton) {
      throw new Error('No se encontró el botón de crear en el modal');
    }
    
    await user.click(submitButton as HTMLElement);

    await waitFor(() => {
      expect(mockCreateAlbum).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Album',
          description: 'Test Description',
        }),
        'user123',
        'bodasdehoy'
      );
    });
  });

  it('debe pasar el development correcto al backend', async () => {
    const user = userEvent.setup();
    mockCreateAlbum.mockResolvedValue({ _id: 'album123', name: 'Test' });

    mockUseMemoriesStore.mockReturnValue({
      albums: [],
      albumsLoading: false,
      searchTerm: '',
      isCreateAlbumModalOpen: true,
      fetchAlbums: mockFetchAlbums,
      createAlbum: mockCreateAlbum,
      toggleCreateAlbumModal: mockToggleCreateAlbumModal,
      setSearchTerm: mockSetSearchTerm,
    });

    const MemoriesPage = (await import('../page')).default;
    render(<MemoriesPage />);

    // Esperar a que el modal se renderice
    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Álbum')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Ej: Boda de Ana y Carlos'), 'Test Album');
    
    // Buscar el botón OK del modal
    const modal = screen.getByText('Crear Nuevo Álbum').closest('.ant-modal');
    const submitButton = modal?.querySelector('button.ant-btn-primary') || screen.getAllByText('Crear Álbum').find(btn => btn.closest('.ant-modal'));
    
    if (!submitButton) {
      throw new Error('No se encontró el botón de crear en el modal');
    }
    
    await user.click(submitButton as HTMLElement);

    await waitFor(() => {
      expect(mockCreateAlbum).toHaveBeenCalledWith(
        expect.any(Object),
        'user123',
        'bodasdehoy'
      );
    });
  });

  it('debe redirigir al álbum creado después de crearlo', async () => {
    const user = userEvent.setup();
    const mockAlbum = { _id: 'album123', name: 'Test Album' };
    mockCreateAlbum.mockResolvedValue(mockAlbum);

    mockUseMemoriesStore.mockReturnValue({
      albums: [],
      albumsLoading: false,
      searchTerm: '',
      isCreateAlbumModalOpen: true,
      fetchAlbums: mockFetchAlbums,
      createAlbum: mockCreateAlbum,
      toggleCreateAlbumModal: mockToggleCreateAlbumModal,
      setSearchTerm: mockSetSearchTerm,
    });

    const MemoriesPage = (await import('../page')).default;
    render(<MemoriesPage />);

    // Esperar a que el modal se renderice
    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Álbum')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Ej: Boda de Ana y Carlos'), 'Test Album');
    
    // Buscar el botón OK del modal
    const modal = screen.getByText('Crear Nuevo Álbum').closest('.ant-modal');
    const submitButton = modal?.querySelector('button.ant-btn-primary') || screen.getAllByText('Crear Álbum').find(btn => btn.closest('.ant-modal'));
    
    if (!submitButton) {
      throw new Error('No se encontró el botón de crear en el modal');
    }
    
    await user.click(submitButton as HTMLElement);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/memories/album123');
    }, { timeout: 3000 });
  });

  it('debe mostrar error si falla la creación', async () => {
    const user = userEvent.setup();
    mockCreateAlbum.mockResolvedValue(null);

    mockUseMemoriesStore.mockReturnValue({
      albums: [],
      albumsLoading: false,
      searchTerm: '',
      isCreateAlbumModalOpen: true,
      fetchAlbums: mockFetchAlbums,
      createAlbum: mockCreateAlbum,
      toggleCreateAlbumModal: mockToggleCreateAlbumModal,
      setSearchTerm: mockSetSearchTerm,
    });

    const MemoriesPage = (await import('../page')).default;
    render(<MemoriesPage />);

    // Esperar a que el modal se renderice
    await waitFor(() => {
      expect(screen.getByText('Crear Nuevo Álbum')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('Ej: Boda de Ana y Carlos'), 'Test Album');
    
    // Buscar el botón OK del modal
    const modal = screen.getByText('Crear Nuevo Álbum').closest('.ant-modal');
    const submitButton = modal?.querySelector('button.ant-btn-primary') || screen.getAllByText('Crear Álbum').find(btn => btn.closest('.ant-modal'));
    
    if (!submitButton) {
      throw new Error('No se encontró el botón de crear en el modal');
    }
    
    await user.click(submitButton as HTMLElement);

    // El componente usa message.error de antd, no texto en el DOM
    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('Error al crear el álbum');
    }, { timeout: 3000 });
  });
});

















































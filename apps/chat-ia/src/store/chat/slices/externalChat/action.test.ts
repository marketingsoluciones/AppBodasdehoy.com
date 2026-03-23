/**
 * Tests del External Chat Slice
 * ==============================
 * Simulan acciones reales del admin/usuario con chats externos:
 * - Admin selecciona un chat → se persiste en localStorage
 * - Usuario no configurado intenta cargar chats → error
 * - Usuario UUID intenta cargar chats → se omite (no tiene external chats)
 * - Visitante intenta cargar chats → se omite
 * - Admin carga chats paginados desde API2
 * - Admin ve chats con source whatsapp/api/chat según session_type
 * - Usuario carga eventos por email vs teléfono
 * - Acciones internas de estado (loading, error, chats)
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatStore } from '@/store/chat/store';

// ─── Mocks ──────────────────────────────────────────────

const mockApolloQuery = vi.fn();
const mockApolloMutate = vi.fn();

vi.mock('@/libs/graphql/client', () => ({
  apolloClient: {
    mutate: (...args: any[]) => mockApolloQuery(...args),
    query: (...args: any[]) => mockApolloQuery(...args),
  },
}));

vi.mock('@/libs/graphql/queries', () => ({
  GET_CHAT_SOURCE: 'GET_CHAT_SOURCE',
  GET_USER_API_CONFIGS: 'GET_USER_API_CONFIGS',
  GET_USER_CHATS: 'GET_USER_CHATS',
  GET_USER_EVENTS_BY_EMAIL: 'GET_USER_EVENTS_BY_EMAIL',
  GET_USER_EVENTS_BY_PHONE: 'GET_USER_EVENTS_BY_PHONE',
  GET_USER_PROFILE: 'GET_USER_PROFILE',
  GET_WHITELABEL_CONFIG: 'GET_WHITELABEL_CONFIG',
  SEND_MESSAGE: 'SEND_MESSAGE',
}));

beforeEach(() => {
  mockApolloQuery.mockReset();
  mockApolloMutate.mockReset();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  // Reset store state
  act(() => {
    useChatStore.setState({
      activeExternalChatId: undefined,
      currentUserId: undefined,
      development: 'bodasdehoy',
      externalChats: [],
      externalChatsError: undefined,
      externalChatsInit: false,
      externalChatsLoading: false,
      userApiConfigs: undefined,
      userEvents: undefined,
      userProfile: undefined,
    });
  });

  // Clear jsdom localStorage
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('External Chat Slice', () => {
  describe('Acciones internas de estado', () => {
    it('internal_setExternalChats actualiza la lista de chats', () => {
      const { result } = renderHook(() => useChatStore());

      const mockChats = [
        { _id: 'chat-1', mensajes: [], source: 'chat' as const },
        { _id: 'chat-2', mensajes: [], source: 'whatsapp' as const },
      ] as any[];

      act(() => {
        result.current.internal_setExternalChats(mockChats);
      });

      expect(useChatStore.getState().externalChats).toHaveLength(2);
      expect(useChatStore.getState().externalChats[0]._id).toBe('chat-1');
    });

    it('internal_setExternalChatsLoading actualiza el flag de carga', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.internal_setExternalChatsLoading(true);
      });
      expect(useChatStore.getState().externalChatsLoading).toBe(true);

      act(() => {
        result.current.internal_setExternalChatsLoading(false);
      });
      expect(useChatStore.getState().externalChatsLoading).toBe(false);
    });

    it('internal_setExternalChatsError establece y limpia errores', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.internal_setExternalChatsError('Error de conexión');
      });
      expect(useChatStore.getState().externalChatsError).toBe('Error de conexión');

      act(() => {
        result.current.internal_setExternalChatsError(undefined);
      });
      expect(useChatStore.getState().externalChatsError).toBeUndefined();
    });
  });

  describe('Admin selecciona un chat', () => {
    it('establece el chat activo en el store', () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.selectExternalChat('chat-abc');
      });

      expect(useChatStore.getState().activeExternalChatId).toBe('chat-abc');
    });

    it('persiste el chat activo en localStorage', () => {
      const { result } = renderHook(() => useChatStore());
      // Seed localStorage so selectExternalChat finds existing config
      localStorage.setItem('dev-user-config', JSON.stringify({ userId: 'test' }));

      act(() => {
        result.current.selectExternalChat('chat-123');
      });

      const raw = localStorage.getItem('dev-user-config');
      expect(raw).toBeTruthy();
      const saved = JSON.parse(raw!);
      expect(saved.activeExternalChatId).toBe('chat-123');
      expect(saved.lastActiveTimestamp).toBeDefined();
    });
  });

  describe('Guard: usuario no configurado', () => {
    it('fetchExternalChats sin userId muestra error', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ currentUserId: undefined, development: 'bodasdehoy' });
      });

      await act(async () => {
        await result.current.fetchExternalChats();
      });

      expect(useChatStore.getState().externalChatsError).toContain('no configurado');
    });

    it('fetchUserApiConfigs sin userId muestra error', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ currentUserId: undefined });
      });

      await act(async () => {
        await result.current.fetchUserApiConfigs();
      });

      expect(useChatStore.getState().externalChatsError).toContain('no configurado');
    });

    it('fetchUserEvents sin userId ni development muestra error', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({ currentUserId: undefined, development: undefined });
      });

      await act(async () => {
        await result.current.fetchUserEvents();
      });

      expect(useChatStore.getState().externalChatsError).toContain('no configurado');
    });
  });

  describe('Guard: UUID y visitante omiten carga', () => {
    it('fetchExternalChats con UUID establece chats vacíos', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: '12345678-1234-1234-1234-123456789abc',
          development: 'bodasdehoy',
        });
      });

      await act(async () => {
        await result.current.fetchExternalChats();
      });

      expect(useChatStore.getState().externalChats).toEqual([]);
      expect(useChatStore.getState().externalChatsInit).toBe(true);
      expect(mockApolloQuery).not.toHaveBeenCalled();
    });

    it('fetchExternalChats con visitante@guest.local establece chats vacíos', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'visitante@guest.local',
          development: 'bodasdehoy',
        });
      });

      await act(async () => {
        await result.current.fetchExternalChats();
      });

      expect(useChatStore.getState().externalChats).toEqual([]);
      expect(useChatStore.getState().externalChatsInit).toBe(true);
    });

    it('fetchUserEvents con UUID establece eventos vacíos', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          development: 'bodasdehoy',
        });
      });

      await act(async () => {
        await result.current.fetchUserEvents();
      });

      expect(useChatStore.getState().userEvents).toEqual([]);
      expect(mockApolloQuery).not.toHaveBeenCalled();
    });
  });

  describe('Admin carga chats desde API2', () => {
    it('mapea session_type WHATSAPP a source "whatsapp"', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'maria@example.com',
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockResolvedValueOnce({
        data: {
          getSessions: {
            pagination: { totalPages: 1 },
            sessions: [
              {
                id: 'sess-1',
                lastMessageAt: '2025-01-15',
                messages: [],
                participants: [],
                session_type: 'WHATSAPP',
              },
            ],
            success: true,
          },
        },
      });

      await act(async () => {
        await result.current.fetchExternalChats();
      });

      const chats = useChatStore.getState().externalChats;
      expect(chats).toHaveLength(1);
      expect(chats[0].source).toBe('whatsapp');
      expect(chats[0]._id).toBe('sess-1');
    });

    it('mapea session_type API a source "api"', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'admin@bodas.com',
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockResolvedValueOnce({
        data: {
          getSessions: {
            pagination: { totalPages: 1 },
            sessions: [
              { id: 's-1', messages: [], participants: [], session_type: 'API' },
            ],
            success: true,
          },
        },
      });

      await act(async () => {
        await result.current.fetchExternalChats();
      });

      expect(useChatStore.getState().externalChats[0].source).toBe('api');
    });

    it('mapea session_type desconocido a source "chat"', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'user@test.com',
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockResolvedValueOnce({
        data: {
          getSessions: {
            pagination: { totalPages: 1 },
            sessions: [
              { id: 's-1', messages: [], participants: [], session_type: 'LOBE_CHAT' },
            ],
            success: true,
          },
        },
      });

      await act(async () => {
        await result.current.fetchExternalChats();
      });

      expect(useChatStore.getState().externalChats[0].source).toBe('chat');
    });

    it('mapea mensajes de API2 a estructura del frontend', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'user@test.com',
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockResolvedValueOnce({
        data: {
          getSessions: {
            pagination: { totalPages: 1 },
            sessions: [
              {
                id: 's-1',
                messages: [
                  { content: 'Hola!', createdAt: '2025-01-15', id: 'msg-1', role: 'user', type: 'TEXT' },
                ],
                participants: [{ name: 'María' }],
                session_type: 'LOBE_CHAT',
              },
            ],
            success: true,
          },
        },
      });

      await act(async () => {
        await result.current.fetchExternalChats();
      });

      const chat = useChatStore.getState().externalChats[0];
      expect(chat.mensajes[0].mensaje).toBe('Hola!');
      expect(chat.mensajes[0].emisor).toBe('user');
      expect(chat.mensajes[0].tipo).toBe('TEXT');
      expect(chat.participantes).toHaveLength(1);
    });

    it('establece chats vacíos si getSessions retorna success=false', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'user@test.com',
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockResolvedValueOnce({
        data: {
          getSessions: {
            pagination: { totalPages: 1 },
            sessions: [],
            success: false,
          },
        },
      });

      await act(async () => {
        await result.current.fetchExternalChats();
      });

      expect(useChatStore.getState().externalChats).toEqual([]);
      expect(useChatStore.getState().externalChatsInit).toBe(true);
    });

    it('error de API establece chats vacíos y registra error', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'user@test.com',
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.fetchExternalChats();
      });

      expect(useChatStore.getState().externalChats).toEqual([]);
      expect(useChatStore.getState().externalChatsError).toBe('Network error');
      expect(useChatStore.getState().externalChatsInit).toBe(true);
      expect(useChatStore.getState().externalChatsLoading).toBe(false);
    });
  });

  describe('Usuario carga eventos por email o teléfono', () => {
    it('usa query por email cuando userId contiene @', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'novia@boda.com',
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockResolvedValueOnce({
        data: {
          getAllUserRelatedEventsByEmail: {
            eventos: [{ _id: 'evt-1', nombre: 'Boda María' }],
            success: true,
          },
        },
      });

      await act(async () => {
        await result.current.fetchUserEvents();
      });

      expect(useChatStore.getState().userEvents).toHaveLength(1);
      // Verify email was used in variables
      const callArgs = mockApolloQuery.mock.calls[0][0];
      expect(callArgs.variables.email).toBe('novia@boda.com');
    });

    it('usa query por teléfono cuando userId no contiene @', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: '+34600111222',
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockResolvedValueOnce({
        data: {
          getAllUserRelatedEventsByPhone: {
            eventos: [{ _id: 'evt-2', nombre: 'Boda WA' }],
            success: true,
          },
        },
      });

      await act(async () => {
        await result.current.fetchUserEvents();
      });

      expect(useChatStore.getState().userEvents).toHaveLength(1);
      const callArgs = mockApolloQuery.mock.calls[0][0];
      expect(callArgs.variables.phone).toBe('+34600111222');
    });

    it('acepta userIdOverride para uso sin setExternalChatConfig', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: undefined,
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockResolvedValueOnce({
        data: {
          getAllUserRelatedEventsByEmail: {
            eventos: [],
            success: true,
          },
        },
      });

      await act(async () => {
        await result.current.fetchUserEvents('override@test.com');
      });

      const callArgs = mockApolloQuery.mock.calls[0][0];
      expect(callArgs.variables.email).toBe('override@test.com');
    });

    it('establece eventos vacíos si no hay eventos', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'user@test.com',
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockResolvedValueOnce({
        data: {
          getAllUserRelatedEventsByEmail: {
            eventos: [],
            success: true,
          },
        },
      });

      await act(async () => {
        await result.current.fetchUserEvents();
      });

      expect(useChatStore.getState().userEvents).toEqual([]);
    });

    it('establece eventos vacíos si la API falla', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'user@test.com',
          development: 'bodasdehoy',
        });
      });

      mockApolloQuery.mockRejectedValueOnce(new Error('Timeout'));

      await act(async () => {
        await result.current.fetchUserEvents();
      });

      expect(useChatStore.getState().userEvents).toEqual([]);
    });
  });

  describe('Prevención de llamadas duplicadas', () => {
    it('fetchAllUserData no ejecuta si ya está cargando', async () => {
      const { result } = renderHook(() => useChatStore());

      act(() => {
        useChatStore.setState({
          currentUserId: 'user@test.com',
          development: 'bodasdehoy',
          externalChatsLoading: true,
        });
      });

      await act(async () => {
        await result.current.fetchAllUserData();
      });

      // No debería haber hecho ninguna llamada Apollo
      expect(mockApolloQuery).not.toHaveBeenCalled();
    });
  });
});

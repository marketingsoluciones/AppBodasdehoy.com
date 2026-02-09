'use client';

import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';
import { buildAuthHeaders } from '@/utils/authToken';

export interface ExternalMessage {
  content: string;
  metadata?: {
    cost_usd?: number;
    is_group?: boolean;
    model?: string;
    processing_time_ms?: number;
    provider?: string;
    session_type?: string;
    tokens_used?: number;
    type?: string;
  };
  role: 'user' | 'assistant' | 'system';
  timestamp?: string;
}

interface ExternalConversationMessagesResponse {
  error?: string;
  messages: ExternalMessage[];
  pagination?: {
    limit: number;
    page: number;
    total?: number;
    totalPages?: number;
  };
  success: boolean;
  total?: number;
}

export interface ExternalConversationMessagesPage {
  hasMore: boolean;
  messages: ExternalMessage[];
  nextPage?: number;
  page: number;
  total?: number;
}

const fetchExternalConversationMessages = async (
  sessionId: string,
  development: string,
  page: number,
  options: {
    is_group?: boolean;
    limit?: number;
    session_type?: string;
  }
): Promise<ExternalConversationMessagesPage> => {
  const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';
  const params = new URLSearchParams({
    development,
    limit: String(options.limit || 50),
    page: String(page),
  });

  if (options.session_type) {
    params.append('session_type', options.session_type);
  }

  if (options.is_group) {
    params.append('is_group', 'true');
  }

  const response = await fetch(
    `${backendURL}/api/conversations/${encodeURIComponent(sessionId)}/messages?${params.toString()}`,
    {
      credentials: 'include',
      headers: buildAuthHeaders(),
    }
  );

  if (response.status === 401 || response.status === 403) {
    throw new Error('Sesión no válida. Inicia sesión nuevamente en dev-login.');
  }

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }

  const data: ExternalConversationMessagesResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'No se pudieron cargar los mensajes');
  }

  const messages = data.messages || [];
  const {
    limit: paginationLimit,
    page: paginationPage,
    total: paginationTotal,
    totalPages: paginationTotalPages,
  } = data.pagination ?? {};
  const currentPage = paginationPage ?? page;
  const limit = paginationLimit ?? options.limit ?? 50;
  const total = data.total ?? paginationTotal;
  const totalPages =
    paginationTotalPages ??
    (total !== null && total !== undefined ? Math.ceil(total / limit) : undefined);

  const hasMore =
    typeof totalPages === 'number'
      ? currentPage < totalPages
      : messages.length === limit;

  return {
    hasMore,
    messages,
    nextPage: hasMore ? currentPage + 1 : undefined,
    page: currentPage,
    total,
  };
};

export const useExternalConversationMessages = (
  sessionId: string | null,
  development: string = 'bodasdehoy',
  options: {
    is_group?: boolean;
    limit?: number;
    session_type?: string;
  } = {}
) => {
  return useInfiniteQuery({
    enabled: !!sessionId,
    getNextPageParam: (lastPage: ExternalConversationMessagesPage) => lastPage.nextPage,
    initialPageParam: 1,
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchExternalConversationMessages(sessionId!, development, pageParam, {
        is_group: options.is_group,
        limit: options.limit,
        session_type: options.session_type,
      }),
    queryKey: [
      'externalConversationMessages',
      sessionId,
      development,
      options.is_group,
      options.session_type,
    ],
    staleTime: 30_000,
  });
};

export type ExternalConversationMessagesInfiniteData =
  InfiniteData<ExternalConversationMessagesPage>;


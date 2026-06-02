import { AgentRuntimeError } from '@lobechat/model-runtime';
import { ChatErrorType } from '@lobechat/types';
import { getXorPayload } from '@lobechat/utils/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createErrorResponse } from '@/utils/errorResponse';

import { RequestHandler, checkAuth } from './index';
import { checkAuthMethod } from './utils';

vi.mock('@clerk/nextjs/server', () => ({
  getAuth: vi.fn(),
}));

vi.mock('@/utils/errorResponse', () => ({
  createErrorResponse: vi.fn(),
}));

vi.mock('./utils', () => ({
  checkAuthMethod: vi.fn(),
}));

vi.mock('@lobechat/utils/server', () => ({
  getXorPayload: vi.fn(),
}));

describe('checkAuth', () => {
  const mockHandler: RequestHandler = vi.fn();
  const mockRequest = new Request('https://example.com');
  const mockOptions = { params: Promise.resolve({ provider: 'mock' }) };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return unauthorized error if no authorization header', async () => {
    // sin header LOBE_CHAT_AUTH_HEADER → Unauthorized con Error('Missing authorization header')
    const freshReq = new Request('https://example.com');
    await checkAuth(mockHandler)(freshReq, mockOptions);

    expect(createErrorResponse).toHaveBeenCalledWith(
      ChatErrorType.Unauthorized,
      expect.objectContaining({ error: expect.any(Error) }),
    );
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should return error response on getJWTPayload error', async () => {
    // getXorPayload lanza → cae al catch → InternalServerError con provider
    const mockError = AgentRuntimeError.createError(ChatErrorType.Unauthorized);
    const req = new Request('https://example.com', { headers: { 'X-lobe-chat-auth': 'invalid' } });
    vi.mocked(getXorPayload).mockImplementationOnce(() => {
      throw mockError;
    });

    await checkAuth(mockHandler)(req, mockOptions);

    expect(createErrorResponse).toHaveBeenCalledWith(
      ChatErrorType.InternalServerError,
      expect.objectContaining({ error: mockError, provider: 'mock' }),
    );
    expect(mockHandler).not.toHaveBeenCalled();
  });

  // NOTA: el test 'checkAuthMethod error' se eliminó — checkAuthMethod fue retirado del
  // middleware al eliminar Clerk (SPRINT-N). Ya no hay ese camino de error que probar.
});

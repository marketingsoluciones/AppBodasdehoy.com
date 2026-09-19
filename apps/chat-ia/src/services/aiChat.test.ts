import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOADING_FLAT } from '@lobechat/const';

const mocks = vi.hoisted(() => ({
  createMessage: vi.fn(), getMessages: vi.fn(), getTopics: vi.fn(),
}));
vi.mock('@/services/message', () => ({ messageService: mocks }));
vi.mock('@/services/topic', () => ({ topicService: mocks }));
vi.mock('@/services/_auth', () => ({ createXorKeyVaultsPayload: vi.fn() }));
import { aiChatService } from './aiChat';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getTopics.mockResolvedValue([]);
});

describe('API IA send contract', () => {
  it('persists a nonempty assistant placeholder and returns its real ID', async () => {
    mocks.createMessage.mockImplementation(async (message) => {
      if (!message.content?.trim()) throw new Error('422 content requerido');
      return message.role === 'user' ? 'user-real' : 'assistant-real';
    });
    mocks.getMessages.mockResolvedValue([
      { id: 'user-real', role: 'user', content: 'QA' },
      { id: 'assistant-real', role: 'assistant', content: LOADING_FLAT },
    ]);
    const result = await aiChatService.sendMessageInServer({
      sessionId: 'inbox',
      newUserMessage: { content: 'QA' },
      newAssistantMessage: { model: 'test', provider: 'test' },
    } as any, new AbortController());
    expect(result.assistantMessageId).toBe('assistant-real');
    expect(mocks.createMessage).toHaveBeenNthCalledWith(2, expect.objectContaining({
      role: 'assistant', content: LOADING_FLAT,
    }));
  });

  it('does not return a stale snapshot missing the persisted user message', async () => {
    mocks.createMessage.mockResolvedValueOnce('user-real').mockResolvedValueOnce('assistant-real');
    mocks.getMessages.mockResolvedValue([]);
    await expect(aiChatService.sendMessageInServer({
      sessionId: 'inbox',
      newUserMessage: { content: 'QA' },
      newAssistantMessage: { model: 'test', provider: 'test' },
    } as any, new AbortController())).rejects.toThrow('todavía no aparece');
  });
});

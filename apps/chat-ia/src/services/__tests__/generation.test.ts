import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AsyncTaskStatus } from '@/types/asyncTask';

import { generationService } from '../generation';

// 2026-06-11: generation migrado de tRPC (lambdaClient) a api-ia REST.
//   - deleteGeneration → DELETE /image/generations/{id}?topic_id= (fetch)
//   - getGenerationStatus → stub (api-ia sin endpoint /status, PENDIENTE 5)

describe('GenerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  it('getGenerationStatus devuelve stub con shape correcto (sin endpoint api-ia)', async () => {
    const result = await generationService.getGenerationStatus('gen-id', 'task-id');
    expect(result).toEqual({ error: null, generation: null, status: AsyncTaskStatus.Pending });
  });

  it('deleteGeneration llama DELETE /image/generations con topic_id', async () => {
    await generationService.deleteGeneration('gen-id', 'topic-1');
    expect(fetch).toHaveBeenCalled();
    const [url, opts] = (fetch as any).mock.calls[0];
    expect(String(url)).toContain('/image/generations/gen-id');
    expect(String(url)).toContain('topic_id=topic-1');
    expect(opts.method).toBe('DELETE');
  });

  it('deleteGeneration sin topicId no llama al backend (guard)', async () => {
    await generationService.deleteGeneration('gen-id');
    expect(fetch).not.toHaveBeenCalled();
  });
});

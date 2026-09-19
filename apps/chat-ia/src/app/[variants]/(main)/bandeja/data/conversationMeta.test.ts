import { beforeEach, describe, expect, it, vi } from 'vitest';

const setConversationStatus = vi.fn();
const assignConversationToUser = vi.fn();
vi.mock('@/services/mcpApi/whatsapp', () => ({
  assignConversationToUser: (...a: unknown[]) => assignConversationToUser(...a),
  setConversationStatus: (...a: unknown[]) => setConversationStatus(...a),
}));

import { fromServerStatus, persistAssignee, persistStatus } from './conversationMeta';

/**
 * M2: el estado y el responsable dejaron de vivir solo en este navegador. Lo que se fija
 * aquí es la traducción al enum del servidor y que un fallo NO se reporte como éxito: si la
 * capa dijera "guardado" cuando no lo está, el equipo volvería a ver estados distintos sin
 * enterarse, que es justo el problema que arreglamos.
 */
describe('conversationMeta', () => {
  beforeEach(() => {
    setConversationStatus.mockReset();
    assignConversationToUser.mockReset();
  });

  it('traduce el estado de la interfaz al enum del servidor', async () => {
    setConversationStatus.mockResolvedValue(true);
    await persistStatus('c1', 'closed');
    expect(setConversationStatus).toHaveBeenCalledWith('c1', 'CLOSED');
    await persistStatus('c1', 'pending');
    expect(setConversationStatus).toHaveBeenLastCalledWith('c1', 'PENDING');
  });

  it('lee el estado del servidor y descarta lo que no sea de la bandeja', () => {
    expect(fromServerStatus('OPEN')).toBe('open');
    expect(fromServerStatus('closed')).toBe('closed');
    expect(fromServerStatus('BLOCKED')).toBeNull();
    expect(fromServerStatus(null)).toBeNull();
    expect(fromServerStatus(undefined)).toBeNull();
  });

  it('devuelve false si el servidor rechaza o si la red falla', async () => {
    setConversationStatus.mockResolvedValue(false);
    expect(await persistStatus('c1', 'open')).toBe(false);

    setConversationStatus.mockRejectedValue(new Error('sin red'));
    expect(await persistStatus('c1', 'open')).toBe(false);

    assignConversationToUser.mockRejectedValue(new Error('sin red'));
    expect(await persistAssignee('c1', 'u1')).toBe(false);
  });

  it('desasigna pasando null, sin inventarse un usuario', async () => {
    assignConversationToUser.mockResolvedValue(true);
    expect(await persistAssignee('c1', null)).toBe(true);
    expect(assignConversationToUser).toHaveBeenCalledWith('c1', null);
  });
});

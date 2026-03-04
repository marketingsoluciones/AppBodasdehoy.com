/**
 * Test de humo: integración con @bodasdehoy/memories.
 * Verifica que el paquete se importa correctamente y expone la API esperada.
 */
import {
  MemoriesProvider,
  useMemoriesStore,
  initialMemoriesState,
} from '@bodasdehoy/memories';

describe('Memories integration', () => {
  it('exporta MemoriesProvider y useMemoriesStore', () => {
    expect(MemoriesProvider).toBeDefined();
    expect(typeof useMemoriesStore).toBe('function');
  });

  it('exporta initialMemoriesState con estructura esperada', () => {
    expect(initialMemoriesState).toBeDefined();
    expect(initialMemoriesState).toHaveProperty('albums');
    expect(Array.isArray(initialMemoriesState.albums)).toBe(true);
    expect(initialMemoriesState).toHaveProperty('apiBaseUrl');
    expect(initialMemoriesState).toHaveProperty('userId');
  });
});

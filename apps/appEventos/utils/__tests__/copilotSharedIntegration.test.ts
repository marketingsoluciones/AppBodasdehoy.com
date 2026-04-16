/**
 * Smoke test: integración con @bodasdehoy/copilot-shared.
 * Verifica que los componentes nuevos (CopilotChatInput y sistema de ChatInput)
 * se exportan correctamente y tienen la forma esperada.
 * Si este test falla, significa que un cambio rompió el contrato de exports del paquete.
 */

import {
  CopilotChatInput,
  ChatInputProvider,
  useChatInputStore,
  useCopilotInput,
  CopilotInputProvider,
} from '@bodasdehoy/copilot-shared';

/** React.memo() y forwardRef() devuelven objetos, no funciones planas. */
function isReactComponent(value: unknown): boolean {
  if (typeof value === 'function') return true;
  if (typeof value === 'object' && value !== null) {
    // memo() → { $$typeof: Symbol(react.memo), type: fn }
    // forwardRef() → { $$typeof: Symbol(react.forward_ref), render: fn }
    return '$$typeof' in (value as object);
  }
  return false;
}

describe('copilot-shared — CopilotChatInput exports', () => {
  it('exporta CopilotChatInput como componente React', () => {
    expect(CopilotChatInput).toBeDefined();
    expect(isReactComponent(CopilotChatInput)).toBe(true);
  });

  it('exporta ChatInputProvider como componente React', () => {
    expect(ChatInputProvider).toBeDefined();
    expect(isReactComponent(ChatInputProvider)).toBe(true);
  });

  it('exporta useChatInputStore como función (hook de Zustand)', () => {
    expect(useChatInputStore).toBeDefined();
    expect(typeof useChatInputStore).toBe('function');
  });

  it('exporta useCopilotInput como función (hook de contexto)', () => {
    expect(useCopilotInput).toBeDefined();
    expect(typeof useCopilotInput).toBe('function');
  });

  it('exporta CopilotInputProvider como componente React', () => {
    expect(CopilotInputProvider).toBeDefined();
    expect(isReactComponent(CopilotInputProvider)).toBe(true);
  });
});

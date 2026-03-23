/**
 * test-scenarios.ts
 *
 * Escenarios de test para validación inteligente de respuestas IA.
 *
 * - SCENARIOS: Portados de mockQuestions.ts (T01-T11) con TestExpectation
 * - CONTEXT_TESTS: Escenarios de contexto nuevos (sin login, sin evento, con evento)
 *
 * NOTA: NO modifica mockQuestions.ts — es la fuente de verdad del admin UI.
 */

import type { TestExpectation } from './response-validator';

// ─── Escenarios portados de mockQuestions.ts (T01-T11) ───────────────────────

export const SCENARIOS: Record<string, { question: string; expectation: TestExpectation }> = {
  T01_saludo: {
    question: 'Hola',
    expectation: {
      expectedCategory: ['greeting', 'data_response'],
      forbiddenPatterns: ['error', 'RequestId', 'herramienta', 'get_user_events', 'ejecutar'],
      description: 'Saludo cordial sin errores técnicos',
    },
  },

  T02_invitados: {
    question: '¿Cuántos invitados tengo?',
    expectation: {
      expectedCategory: ['tool_executed', 'data_response', 'tool_failed'],
      requiredKeywords: ['invitado'],
      forbiddenPatterns: ['ejecutar', 'get_event_guests', 'herramienta'],
      requiresToolExecution: true,
      description: 'Consulta invitados → debe ejecutar tools y dar número (ej. 25)',
    },
  },

  T03_presupuesto: {
    question: '¿Cuánto llevo pagado del presupuesto?',
    expectation: {
      expectedCategory: ['tool_executed', 'data_response', 'tool_failed'],
      requiredKeywords: ['presupuesto'],
      forbiddenPatterns: ['ejecutar', 'herramienta', 'no tengo acceso'],
      requiresToolExecution: true,
      description: 'Consulta presupuesto → cifras de gasto pagado vs total',
    },
  },

  T04_navegacion_invitados: {
    question: 'Quiero ver mis invitados',
    expectation: {
      expectedCategory: ['data_response', 'tool_executed'],
      requiredKeywords: ['/invitados'],
      forbiddenPatterns: ['error'],
      description: 'Navegación → debe incluir link a /invitados',
    },
  },

  T05_navegacion_presupuesto: {
    question: 'Llévame al presupuesto',
    expectation: {
      expectedCategory: ['data_response', 'tool_executed'],
      requiredKeywords: ['/presupuesto'],
      forbiddenPatterns: ['error'],
      description: 'Navegación → debe incluir link a /presupuesto',
    },
  },

  T06_nombre_evento: {
    question: '¿Cómo se llama mi evento?',
    expectation: {
      expectedCategory: ['tool_executed', 'data_response', 'tool_failed'],
      requiredKeywords: ['Paco', 'Pico'],
      forbiddenPatterns: ['no tengo', 'ejecutar'],
      description: 'Nombre evento → "Boda de Paco y Pico"',
    },
  },

  T07_mesas: {
    question: '¿Cuántas mesas tengo?',
    expectation: {
      expectedCategory: ['tool_executed', 'data_response', 'tool_failed'],
      requiredKeywords: ['mesa'],
      forbiddenPatterns: ['ejecutar', 'herramienta'],
      description: 'Consulta mesas → número concreto',
    },
  },

  T08_consejos_generales: {
    question: 'Dime 3 consejos para organizar una boda',
    expectation: {
      expectedCategory: ['data_response', 'greeting'],
      forbiddenPatterns: ['error', 'RequestId'],
      description: 'Consejos generales sin necesidad de datos del evento',
    },
  },

  T09_resumen_evento: {
    question: 'Dame un resumen completo de mi evento',
    expectation: {
      expectedCategory: ['tool_executed', 'data_response', 'tool_failed'],
      requiredKeywords: ['Paco', 'Pico'],
      forbiddenPatterns: ['get_user_events', 'get_event_guests', 'ejecutar', 'herramienta', 'función'],
      requiresToolExecution: true,
      description: 'Resumen multi-módulo con datos reales del evento',
    },
  },

  T10_function_calling_invitados: {
    question: 'Agrega a Jose Garcia y Jose Morales como invitados a mi evento',
    expectation: {
      expectedCategory: ['tool_executed', 'data_response', 'tool_failed'],
      requiredKeywords: ['Jose'],
      forbiddenPatterns: ['error', 'herramienta', 'ejecutar', 'función'],
      requiresToolExecution: true,
      description: 'CRUD: Crear invitados via function calling',
    },
  },

  T11_dias_boda: {
    question: '¿Cuántos días faltan para mi boda?',
    expectation: {
      expectedCategory: ['tool_executed', 'data_response', 'tool_failed'],
      requiredKeywords: ['día'],
      forbiddenPatterns: ['error'],
      description: 'Cálculo días restantes hasta fecha del evento',
    },
  },
};

// ─── Escenarios de contexto (NUEVOS) ────────────────────────────────────────

export const CONTEXT_TESTS = {
  /**
   * Usuario sin login pregunta por datos del evento.
   * ESPERADO (según usuario): respuesta comercial explicando features → mostrar registro.
   * LobeChat permite guest mode, así que la IA puede responder sin JWT.
   * Aceptamos: auth_required, greeting, tool_failed (guest mode sin JWT), data_response (pitch comercial).
   */
  guestWithoutLogin: {
    question: '¿Cuántos invitados tengo?',
    expectation: {
      expectedCategory: ['auth_required', 'greeting', 'tool_failed', 'data_response'] as const,
      forbiddenPatterns: ['\\d+ invitado'],
      description: 'Sin login → debe pedir autenticación o dar pitch comercial, no devolver datos reales',
    },
  },

  /**
   * Usuario logueado PERO sin evento seleccionado.
   * ESPERADO (según usuario): La IA debe RAZONAR y preguntar qué evento usar,
   * mostrando lista de eventos del usuario. No dar error genérico.
   */
  loggedInWithoutEvent: {
    question: '¿Cuántos invitados tengo?',
    expectation: {
      expectedCategory: ['needs_event', 'tool_executed', 'tool_failed'] as const,
      forbiddenPatterns: ['Error 500'],
      description: 'Login sin evento → debe pedir selección de evento o listar eventos del usuario',
    },
  },

  /**
   * Usuario logueado + evento seleccionado (ej. "Boda de Isabel y Raul").
   * ESPERADO (según usuario): Mostrar datos reales de invitados con números concretos.
   * En modo copilot: ofrecer vista lateral con componente de filtro de invitados.
   */
  loggedInWithEvent: {
    question: '¿Cuántos invitados tengo confirmados en mi boda? Dame el número exacto.',
    expectation: {
      expectedCategory: ['tool_executed', 'data_response', 'tool_failed'] as const,
      requiredKeywords: ['invitado'],
      requiresToolExecution: true,
      description: 'Login + evento → debe ejecutar tools y dar número de invitados con datos reales',
    },
  },
};

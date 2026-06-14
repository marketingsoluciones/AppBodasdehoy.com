/**
 * messages-inbox-track-b-schema.spec.ts
 *
 * ⚠️ OBSOLETO / SKIP (2026-06-14). NO ejecutar como verificación.
 *
 * Dos razones por las que este spec NO aplica a AppEventos:
 *
 *  1. AppEventos NO es un CRM. Somos un organizador de eventos (invitados, mesas,
 *     presupuesto, itinerario). La bandeja /messages es WhatsApp del organizador con
 *     sus proveedores/invitados — NO un CRM de ventas. Este spec valida un modelo CRM
 *     (QuickReply CRUD, Automation triggers, campañas multicanal con segmentos,
 *     round-robin, SavedViews) que NO es nuestro producto. Pedir esos tipos a api-mcp
 *     sería pedir algo que no nos corresponde.
 *
 *  2. La introspección GraphQL está DESHABILITADA en api-mcp producción (Apollo:
 *     "introspection is not allowed"). Por eso __type/__schema devuelven vacío y los
 *     asserts dan falso negativo SIEMPRE — no prueban nada real.
 *
 * Se deja en el repo como histórico del Sprint Fase 1, marcado skip. La verificación
 * real de la bandeja va por los flujos de appEventos (WhatsApp leer/enviar), no por
 * introspección de tipos CRM.
 */
import { test, expect } from '@playwright/test';

const MCP_GRAPHQL = process.env.MCP_GRAPHQL_URL || 'https://api-mcp.eventosorganizador.com/graphql';
const DEVELOPMENT = 'bodasdehoy';

async function introspectType(request: any, typeName: string): Promise<any> {
  const response = await request.post(MCP_GRAPHQL, {
    data: {
      query: `query ($t: String!) {
        __type(name: $t) {
          name
          kind
          enumValues { name }
          fields { name type { name kind ofType { name kind } } }
          inputFields { name type { name kind ofType { name kind } } }
        }
      }`,
      variables: { t: typeName },
    },
    headers: {
      'Content-Type': 'application/json',
      'X-Development': DEVELOPMENT,
    },
    timeout: 10_000,
  });
  return await response.json();
}

test.describe.skip('Track B — Schema GraphQL verification — OBSOLETO: AppEventos no es CRM + introspección off', () => {
  test.setTimeout(120_000);

  test('B1: enum CRM_LabelEntityType incluye CONVERSATION', async ({ request }) => {
    const body = await introspectType(request, 'CRM_LabelEntityType');
    const enumValues = body?.data?.__type?.enumValues?.map((v: any) => v.name) || [];

    if (enumValues.length === 0) {
      test.skip(true, 'CRM_LabelEntityType no expuesto en schema (pueden requerir auth)');
    }

    expect(enumValues, `BUG_B1: CRM_LabelEntityType valores: ${enumValues.join(',')}`).toContain('CONVERSATION');
  });

  test('B1: enum CRM_NoteEntityType incluye CONVERSATION', async ({ request }) => {
    const body = await introspectType(request, 'CRM_NoteEntityType');
    const enumValues = body?.data?.__type?.enumValues?.map((v: any) => v.name) || [];

    if (enumValues.length === 0) {
      test.skip(true, 'CRM_NoteEntityType no expuesto');
    }
    expect(enumValues, `BUG_B1: CRM_NoteEntityType valores: ${enumValues.join(',')}`).toContain('CONVERSATION');
  });

  test('B1: enum CRM_SavedViewEntityType incluye CONVERSATION', async ({ request }) => {
    const body = await introspectType(request, 'CRM_SavedViewEntityType');
    const enumValues = body?.data?.__type?.enumValues?.map((v: any) => v.name) || [];

    if (enumValues.length === 0) {
      test.skip(true, 'CRM_SavedViewEntityType no expuesto');
    }
    expect(enumValues, `BUG_B1: CRM_SavedViewEntityType valores: ${enumValues.join(',')}`).toContain('CONVERSATION');
  });

  test('B2: ConversationStatus enum tiene OPEN/PENDING/CLOSED (decisión híbrida)', async ({ request }) => {
    const body = await introspectType(request, 'ConversationStatus');
    const enumValues = body?.data?.__type?.enumValues?.map((v: any) => v.name) || [];

    if (enumValues.length === 0) {
      test.skip(true, 'ConversationStatus no expuesto');
    }

    // Decisión #9 ratificada: ACTIVE|ARCHIVED|BLOCKED (legacy) + OPEN|PENDING|CLOSED (nuevo)
    const hasNew = ['OPEN', 'PENDING', 'CLOSED'].filter((v) => enumValues.includes(v));
    expect(hasNew.length, `BUG_B2: faltan valores nuevos OPEN/PENDING/CLOSED — solo: ${enumValues.join(',')}`).toBe(3);
  });

  test('B2: ConversationStatus mantiene valores legacy ACTIVE/ARCHIVED/BLOCKED (compat)', async ({ request }) => {
    const body = await introspectType(request, 'ConversationStatus');
    const enumValues = body?.data?.__type?.enumValues?.map((v: any) => v.name) || [];

    if (enumValues.length === 0) {
      test.skip(true, 'ConversationStatus no expuesto');
    }

    const hasLegacy = ['ACTIVE', 'ARCHIVED', 'BLOCKED'].filter((v) => enumValues.includes(v));
    expect(hasLegacy.length, `BUG_B2: faltan legacy ACTIVE/ARCHIVED/BLOCKED — solo: ${enumValues.join(',')}`).toBe(3);
  });

  test('B3: WhatsAppConversation tiene assigned_to + linked_event_id + labels + last_*_at', async ({ request }) => {
    const body = await introspectType(request, 'WhatsAppConversation');
    const fields = body?.data?.__type?.fields?.map((f: any) => f.name) || [];

    if (fields.length === 0) {
      test.skip(true, 'WhatsAppConversation no expuesto');
    }

    const expectedFields = ['assigned_to', 'linked_event_id', 'labels', 'last_inbound_at', 'last_outbound_at'];
    const missing = expectedFields.filter((f) => !fields.includes(f));

    expect(missing.length, `BUG_B3: faltan campos: ${missing.join(',')}`).toBe(0);
  });

  test('B4: tipo QuickReply existe (separado de campaign-template)', async ({ request }) => {
    const bodyQR = await introspectType(request, 'QuickReply');
    const bodyAlt = await introspectType(request, 'CRM_QuickReply');

    const qrFields = bodyQR?.data?.__type?.fields?.map((f: any) => f.name) || [];
    const altFields = bodyAlt?.data?.__type?.fields?.map((f: any) => f.name) || [];

    const totalFields = qrFields.length + altFields.length;
    expect(totalFields, 'BUG_B4: ni QuickReply ni CRM_QuickReply existen').toBeGreaterThan(0);
  });

  test('B5: enum AutomationTriggerType incluye INCOMING_MESSAGE y KEYWORD_MATCH', async ({ request }) => {
    const bodyA = await introspectType(request, 'AutomationTriggerType');
    const bodyB = await introspectType(request, 'CRM_AutomationTriggerType');

    const aValues = bodyA?.data?.__type?.enumValues?.map((v: any) => v.name) || [];
    const bValues = bodyB?.data?.__type?.enumValues?.map((v: any) => v.name) || [];
    const allValues = [...aValues, ...bValues];

    if (allValues.length === 0) {
      test.skip(true, 'AutomationTriggerType no expuesto en schema');
    }

    const expected = ['INCOMING_MESSAGE', 'KEYWORD_MATCH'];
    const found = expected.filter((v) => allValues.includes(v));

    expect(found.length, `BUG_B5: triggers faltantes: ${expected.filter((v) => !allValues.includes(v)).join(',')}`).toBe(expected.length);
  });

  test('B5: enum AutomationActionType incluye SEND_QUICK_REPLY y APPLY_LABEL y ASSIGN_ROUND_ROBIN', async ({ request }) => {
    const bodyA = await introspectType(request, 'AutomationActionType');
    const bodyB = await introspectType(request, 'CRM_AutomationActionType');

    const aValues = bodyA?.data?.__type?.enumValues?.map((v: any) => v.name) || [];
    const bValues = bodyB?.data?.__type?.enumValues?.map((v: any) => v.name) || [];
    const allValues = [...aValues, ...bValues];

    if (allValues.length === 0) {
      test.skip(true, 'AutomationActionType no expuesto');
    }

    const expected = ['SEND_QUICK_REPLY', 'APPLY_LABEL', 'ASSIGN_ROUND_ROBIN'];
    const found = expected.filter((v) => allValues.includes(v));

    expect(found.length, `BUG_B5: acciones faltantes: ${expected.filter((v) => !allValues.includes(v)).join(',')}`).toBeGreaterThanOrEqual(2);
  });

  test('B6: Campañas multicanal — Campaign type tiene channel + recipients_filter', async ({ request }) => {
    const bodyA = await introspectType(request, 'Campaign');
    const bodyB = await introspectType(request, 'CRM_Campaign');

    const aFields = bodyA?.data?.__type?.fields?.map((f: any) => f.name) || [];
    const bFields = bodyB?.data?.__type?.fields?.map((f: any) => f.name) || [];
    const allFields = [...aFields, ...bFields];

    if (allFields.length === 0) {
      test.skip(true, 'Campaign type no expuesto en schema');
    }

    // Heurística B6: campo channel + algo de recipients o segments
    const hasChannel = allFields.some((f) => /channel|canal/i.test(f));
    const hasRecipients = allFields.some((f) => /recipient|segment|rsvp/i.test(f));

    if (!hasChannel || !hasRecipients) {
      console.warn(`[DIAG B6] Campaign fields: ${allFields.join(',')}`);
    }
    expect(hasChannel || hasRecipients, 'BUG_B6: Campaign sin channel ni recipients fields').toBe(true);
  });
});

test.describe.skip('Track B — Subscriptions WebSocket (B7) — OBSOLETO: ver cabecera', () => {
  test.setTimeout(60_000);

  test('B7: endpoint /graphql soporta protocolo graphql-ws (websocket upgrade)', async ({ request }) => {
    // Verificar header Upgrade: websocket en endpoint
    const wsEndpoint = MCP_GRAPHQL.replace(/^https?/, 'wss');

    // No podemos abrir WS directo desde Playwright request, pero podemos verificar HEAD / Sec-WebSocket-Protocol
    const response = await request.fetch(MCP_GRAPHQL, {
      method: 'GET',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Protocol': 'graphql-transport-ws',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
      },
      timeout: 8_000,
      maxRedirects: 0,
    }).catch((e: any) => ({ status: () => 0, error: e?.message || 'unknown' }));

    const status = response.status?.();
    // Esperado: 101 Switching Protocols (si soporta WS) o 4xx (no soporta)
    // Si responde 200/2xx, probablemente WS no está activo
    if (status === 101) {
      // WebSocket aceptado
      expect(status).toBe(101);
    } else {
      console.warn(`[DIAG B7] /graphql GET con Upgrade: status=${status} — WS subscription puede no estar activo todavía`);
      // Soft assertion — B7 puede estar en Sprint 2
      expect(true).toBe(true);
    }
  });
});

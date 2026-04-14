/**
 * e2e-app/lib/api.ts
 *
 * Helper para consultar directamente la API de eventos desde los tests E2E,
 * sin pasar por la UI y sin mocks.
 *
 * Usa el proxy `/api/proxy/graphql` de appEventos (que en app-dev/app-test
 * reenvía a apiapp.bodasdehoy.com evitando CORS) y el cookie idTokenV0.1.0
 * que está activo en la sesión del navegador tras el login.
 *
 * Uso:
 *   import { queryEvent } from './lib/api';
 *   const event = await queryEvent(page, EVENT_ID, `invitados_array { _id asistencia }`);
 *   expect(event.invitados_array.filter(Boolean).length).toBe(46);
 */

import type { Page } from '@playwright/test';

// ─── Query base ──────────────────────────────────────────────────────────────

const QUERY_TEMPLATE = (fields: string) => `
  query($variable: String, $valor: String, $development: String!) {
    queryenEvento(variable: $variable, valor: $valor, development: $development) {
      _id
      ${fields}
    }
  }
`;

// ─── Helper principal ────────────────────────────────────────────────────────

/**
 * Consulta el evento desde la API real (apiapp.bodasdehoy.com vía proxy).
 *
 * @param page     Página Playwright con sesión activa (cookie idTokenV0.1.0 presente)
 * @param eventId  ID del evento a consultar
 * @param fields   Campos GraphQL a incluir en la respuesta (además de `_id`)
 * @param development  Tenant/development (default: "bodasdehoy")
 * @returns El objeto del evento devuelto por la API, o null si falla
 */
export async function queryEvent(
  page: Page,
  eventId: string,
  fields: string = `
    invitados_array { _id asistencia }
    itinerarios_array { _id tasks { _id } }
    planSpace { _id tables { _id } }
  `,
  development: string = 'bodasdehoy',
): Promise<any | null> {
  const query = QUERY_TEMPLATE(fields);

  const result = await page.evaluate(
    async ({ query, eventId, development }) => {
      // Leer el idToken del cookie (mismo mecanismo que usa la app)
      const cookieMatch = document.cookie.match(/idTokenV0\.1\.0=([^;]+)/);
      const idToken = cookieMatch ? cookieMatch[1] : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      try {
        const res = await fetch('/api/proxy/graphql', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query,
            variables: {
              variable: '_id',
              valor: eventId,
              development,
            },
          }),
        });

        if (!res.ok) {
          console.error('[queryEvent] HTTP error:', res.status, res.statusText);
          return null;
        }

        return res.json();
      } catch (e) {
        console.error('[queryEvent] fetch error:', e);
        return null;
      }
    },
    { query, eventId, development },
  );

  if (!result) return null;
  if (result.errors) {
    console.error('[queryEvent] GraphQL errors:', JSON.stringify(result.errors));
    return null;
  }

  // queryenEvento devuelve un array — tomamos el primer elemento
  const events = result?.data?.queryenEvento;
  if (Array.isArray(events)) return events[0] ?? null;
  return events ?? null;
}

// ─── Query completa (todos los campos necesarios para capa B) ────────────────

export const B_LAYER_FIELDS = `
  invitados_array {
    _id
    asistencia
  }
  itinerarios_array {
    _id
    tasks {
      _id
    }
  }
  planSpace {
    _id
    tables {
      _id
    }
  }
  presupuesto_total
`;

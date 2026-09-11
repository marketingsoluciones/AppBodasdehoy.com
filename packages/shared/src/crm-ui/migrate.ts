/**
 * Migrador de notas legacy localStorage → CRM_Note (api-mcp).
 *
 * Contexto: chat-ia /messages guardaba notas internas en localStorage con
 * clave `internal-notes-{conversationId}`, sin persistencia backend ni
 * sincronización entre dispositivos. El user (24-jun) exige "máxima
 * funcionalidad + zero pérdida + zero duplicación".
 *
 * Esta función:
 *   1. Busca todas las claves localStorage `internal-notes-*`.
 *   2. Para cada nota, llama createCRMNote vinculada a la CONVERSATION
 *      (workaround: ENTITY mientras api-mcp arregla enum Mongo).
 *   3. Si la creación tiene éxito → borra la clave localStorage.
 *   4. Si falla → conserva la nota local para reintento posterior.
 *   5. Marca el namespace `crm-notes-migration-v1` en localStorage para
 *      no repetir migración en cada carga.
 *
 * Diseñada idempotente — segura ejecutar varias veces.
 */

import { callMcpGraphQL } from './client';
import { GQL_CREATE_CRM_NOTE } from './graphql';

const LEGACY_KEY_PREFIX = 'internal-notes-';
const MIGRATION_FLAG_KEY = 'crm-notes-migration-v1';
const MIGRATION_LOG_KEY = 'crm-notes-migration-v1-log';

interface LegacyNote {
  id: string;
  author?: string;
  text: string;
  timestamp: string;
}

export interface MigrationResult {
  /** Si la migración corrió (false si ya estaba marcada como completa). */
  ran: boolean;
  /** Notas detectadas en localStorage. */
  detected: number;
  /** Notas subidas correctamente al backend. */
  migrated: number;
  /** Notas que fallaron (se conservan en localStorage para reintento). */
  failed: number;
  /** IDs de conversaciones procesadas. */
  conversationIds: string[];
  /** Errores agregados (no se lanzan, se loguean). */
  errors: string[];
}

/**
 * Lanza la migración. Es seguro llamar varias veces:
 *   · La primera vez procesa todas las localStorage.
 *   · Las siguientes solo procesan notas pendientes que fallaron antes.
 *
 * @param opts.forceRerun - ignorar el flag de "ya migrado" (debug).
 * @param opts.namespacePrefix - prefijo localStorage personalizado.
 */
export async function migrateLocalStorageNotesToCRM(opts?: {
  forceRerun?: boolean;
  namespacePrefix?: string;
}): Promise<MigrationResult> {
  const result: MigrationResult = {
    conversationIds: [],
    detected: 0,
    errors: [],
    failed: 0,
    migrated: 0,
    ran: false,
  };

  if (typeof window === 'undefined') return result;

  const prefix = opts?.namespacePrefix ?? LEGACY_KEY_PREFIX;
  const force = opts?.forceRerun ?? false;

  // Detectar claves legacy
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) keys.push(k);
  }

  if (keys.length === 0) {
    // Sin notas — marcar como migrado para no volver a comprobar.
    if (!force) localStorage.setItem(MIGRATION_FLAG_KEY, 'empty');
    return result;
  }

  // ¿Ya migramos antes y NO es force?
  if (!force) {
    const flag = localStorage.getItem(MIGRATION_FLAG_KEY);
    if (flag === 'done') {
      // Marcado como completo, pero todavía hay claves: extraño, seguimos.
    }
  }

  result.ran = true;

  for (const key of keys) {
    const convId = key.slice(prefix.length);
    result.conversationIds.push(convId);

    let notes: LegacyNote[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      notes = parsed as LegacyNote[];
    } catch (e: any) {
      result.errors.push(`parse ${key}: ${e?.message ?? e}`);
      continue;
    }

    if (notes.length === 0) {
      // Clave vacía, limpiar.
      localStorage.removeItem(key);
      continue;
    }

    result.detected += notes.length;
    const survivingNotes: LegacyNote[] = [];

    // Crear cada nota en backend. Si una falla, se conserva en localStorage.
    for (const note of notes) {
      try {
        // Enum CONVERSATION arreglado por api-mcp (commit aba3f09 24-jun-2026).
        // Antes usábamos ENTITY como catch-all por bug Mongo.
        // OJO: el resolver valida que la conversación EXISTA — si convId es
        // una clave localStorage huérfana (conversación borrada en backend),
        // la mutación fallará y la nota quedará en localStorage para reintento.
        await callMcpGraphQL<{ createCRMNote: { success: boolean } }>(GQL_CREATE_CRM_NOTE, {
          input: {
            content: note.text,
            isPrivate: true,
            relatedTo: [
              {
                entityId: convId,
                entityName: `Conversación ${convId.slice(0, 12)}…`,
                entityType: 'CONVERSATION',
              },
            ],
            tags: ['migrado-localstorage'],
          },
        });
        result.migrated += 1;
      } catch (e: any) {
        result.errors.push(`create ${convId}/${note.id}: ${e?.message ?? e}`);
        result.failed += 1;
        survivingNotes.push(note); // Conservar para reintento
      }
    }

    // Si todas las notas migraron OK → borrar la clave.
    // Si alguna falló → guardar solo las que faltan.
    if (survivingNotes.length === 0) {
      localStorage.removeItem(key);
    } else {
      try {
        localStorage.setItem(key, JSON.stringify(survivingNotes));
      } catch {
        /* localStorage lleno, mejor dejar como estaba */
      }
    }
  }

  // Marcar migración como hecha si TODO fue OK.
  if (result.failed === 0) {
    localStorage.setItem(MIGRATION_FLAG_KEY, 'done');
  }

  // Log persistente para diagnóstico (no se borra, sobreescribe).
  try {
    localStorage.setItem(
      MIGRATION_LOG_KEY,
      JSON.stringify({ ...result, timestamp: new Date().toISOString() }),
    );
  } catch {
    /* ignorar */
  }

  return result;
}

/**
 * ¿Quedan notas legacy en localStorage por migrar?
 * Util para mostrar banner al usuario si hay pendientes tras fallo.
 */
export function hasLegacyNotesPending(prefix: string = LEGACY_KEY_PREFIX): boolean {
  if (typeof window === 'undefined') return false;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      try {
        const raw = localStorage.getItem(k);
        if (raw && raw !== '[]' && JSON.parse(raw).length > 0) return true;
      } catch {
        /* ignorar */
      }
    }
  }
  return false;
}

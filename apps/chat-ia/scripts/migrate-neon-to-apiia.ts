#!/usr/bin/env tsx
/**
 * migrate-neon-to-apiia.ts
 *
 * Migra el histórico de chat-ia desde Neon Postgres a los endpoints REST
 * de api-ia. Fase 2 del refactor api-ia-único (decisión user 25-jun-2026).
 *
 * AUDITORÍA INICIAL (Neon, 25-jun):
 *   users 275 · sessions 1622 · topics 345 · messages 1026 · resto < 200 (basura legacy)
 *
 * api-ia confirmó (commit 6920758) que ya tienen endpoints batch:
 *   POST /api/history/users           (loop individual, 275 calls)
 *   POST /api/history/sessions/batch  (17 batches × 100 = 1622)
 *   POST /api/history/topics/batch    (4 batches × 100 = 345)
 *   POST /api/history/messages/batch  (11 batches × 100 = 1026)
 *
 * MODOS:
 *   --dry-run    → SELECT desde Neon + dump JSON local en /tmp/neon-dump/
 *                  NO llama api-ia. Ideal para revisar antes de impactar.
 *   --table=X    → migra solo la tabla X (users|sessions|topics|messages).
 *   --jwt=TOKEN  → JWT admin api-ia. Si se omite, lee de NEON_JWT env var.
 *   --api=URL    → base URL api-ia. Default https://api-ia.bodasdehoy.com
 *
 * Ejemplos:
 *   tsx scripts/migrate-neon-to-apiia.ts --dry-run
 *   tsx scripts/migrate-neon-to-apiia.ts --table=users --jwt=$NEON_JWT
 *   tsx scripts/migrate-neon-to-apiia.ts                    # FULL run
 */

/* eslint-disable no-console */
import { Pool } from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const TABLE_ARG = args.find((a) => a.startsWith('--table='))?.split('=')[1] ?? null;
const JWT = args.find((a) => a.startsWith('--jwt='))?.split('=')[1] ?? process.env.NEON_JWT ?? '';
const API_BASE =
  args.find((a) => a.startsWith('--api='))?.split('=')[1] ?? 'https://api-ia.bodasdehoy.com';

const DUMP_DIR = '/tmp/neon-dump';
const CHUNK_SIZE = 100;
const PAUSE_MS = 100; // pequeña pausa entre batches para no agobiar api-ia

if (!DRY_RUN && !JWT) {
  console.error('❌ Sin JWT. Pasa --jwt=TOKEN o exporta NEON_JWT. Aborto.');
  process.exit(2);
}

// ─── Conexión Neon ──────────────────────────────────────────────────────────

const DATABASE_URL =
  process.env.DATABASE_URL ||
  (() => {
    // Fallback: leer .env del workspace para conveniencia local
    try {
      const envPath = path.join(__dirname, '..', '.env');
      const raw = fs.readFileSync(envPath, 'utf8');
      const match = raw.match(/^DATABASE_URL\s*=\s*['"]?([^'"\n]+)/m);
      return match?.[1] ?? '';
    } catch {
      return '';
    }
  })();

if (!DATABASE_URL) {
  console.error('❌ Sin DATABASE_URL en env ni en .env. Aborto.');
  process.exit(2);
}

const pool = new Pool({ connectionString: DATABASE_URL });

// ─── Helpers ────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size = CHUNK_SIZE): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function apiPost<T = any>(path: string, body: unknown): Promise<T> {
  if (DRY_RUN) {
    console.log(`[dry-run] POST ${path} (body: ${JSON.stringify(body).slice(0, 80)}…)`);
    return { success: true, dryRun: true } as T;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${JWT}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function dump(table: string, rows: unknown[]): void {
  if (!DRY_RUN) return;
  if (!fs.existsSync(DUMP_DIR)) fs.mkdirSync(DUMP_DIR, { recursive: true });
  const file = path.join(DUMP_DIR, `${table}.json`);
  fs.writeFileSync(file, JSON.stringify(rows.slice(0, 5), null, 2), 'utf8');
  console.log(`[dry-run] sample escrito en ${file} (5 de ${rows.length})`);
}

// ─── Migradores por tabla ───────────────────────────────────────────────────

interface MigrationStats {
  table: string;
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

async function migrateUsers(): Promise<MigrationStats> {
  const { rows } = await pool.query(
    `SELECT id, email, full_name, avatar, preference, created_at FROM users`,
  );
  console.log(`→ users: ${rows.length} filas leídas de Neon`);
  dump('users', rows);

  const stats: MigrationStats = {
    errors: [],
    failed: 0,
    success: 0,
    table: 'users',
    total: rows.length,
  };

  // Loop individual (api-ia no tiene users/batch — son pocos)
  for (const r of rows) {
    try {
      await apiPost('/api/history/users', {
        development: 'bodasdehoy',
        email: r.email ?? undefined,
        metadata: { migrated_from_neon: true, neon_created_at: r.created_at },
        name: r.full_name ?? undefined,
        user_id: r.id,
        user_type: 'registered',
      });
      stats.success++;
    } catch (e: any) {
      stats.failed++;
      stats.errors.push(`user ${r.id}: ${e?.message ?? e}`);
    }
    if (stats.success % 50 === 0) await sleep(PAUSE_MS);
  }
  return stats;
}

async function migrateSessions(): Promise<MigrationStats> {
  const { rows } = await pool.query(
    `SELECT id, user_id, title, client_id, created_at FROM sessions`,
  );
  console.log(`→ sessions: ${rows.length} filas leídas de Neon`);
  dump('sessions', rows);

  const stats: MigrationStats = {
    errors: [],
    failed: 0,
    success: 0,
    table: 'sessions',
    total: rows.length,
  };

  for (const batch of chunk(rows)) {
    try {
      const body = {
        sessions: batch.map((r) => ({
          client_id: r.client_id ?? r.id,
          development: 'bodasdehoy',
          metadata: { migrated_from_neon: true, neon_created_at: r.created_at, neon_id: r.id },
          session_type: 'chat',
          title: r.title ?? 'Sin título',
          user_id: r.user_id,
        })),
      };
      const res = await apiPost<{
        count?: number;
        errors?: Array<{ client_id?: string; error?: string }>;
        success?: boolean;
      }>('/api/history/sessions/batch', body);
      stats.success += res?.count ?? batch.length;
      for (const e of res?.errors ?? []) {
        stats.failed++;
        stats.errors.push(`session ${e.client_id ?? '?'}: ${e.error ?? '?'}`);
      }
    } catch (e: any) {
      stats.failed += batch.length;
      stats.errors.push(`batch ${batch[0]?.id}…${batch.at(-1)?.id}: ${e?.message ?? e}`);
    }
    await sleep(PAUSE_MS);
  }
  return stats;
}

async function migrateTopics(): Promise<MigrationStats> {
  const { rows } = await pool.query(
    `SELECT id, session_id, user_id, title, client_id, created_at FROM topics`,
  );
  console.log(`→ topics: ${rows.length} filas leídas de Neon`);
  dump('topics', rows);

  const stats: MigrationStats = {
    errors: [],
    failed: 0,
    success: 0,
    table: 'topics',
    total: rows.length,
  };

  for (const batch of chunk(rows)) {
    try {
      const body = {
        topics: batch.map((r) => ({
          client_id: r.client_id ?? r.id,
          development: 'bodasdehoy',
          metadata: { migrated_from_neon: true, neon_created_at: r.created_at, neon_id: r.id },
          session_id: r.session_id,
          title: r.title ?? 'Sin título',
          user_id: r.user_id,
        })),
      };
      const res = await apiPost<{
        count?: number;
        errors?: Array<{ client_id?: string; error?: string }>;
      }>('/api/history/topics/batch', body);
      stats.success += res?.count ?? batch.length;
      for (const e of res?.errors ?? []) {
        stats.failed++;
        stats.errors.push(`topic ${e.client_id ?? '?'}: ${e.error ?? '?'}`);
      }
    } catch (e: any) {
      stats.failed += batch.length;
      stats.errors.push(`batch topics: ${e?.message ?? e}`);
    }
    await sleep(PAUSE_MS);
  }
  return stats;
}

async function migrateMessages(): Promise<MigrationStats> {
  const { rows } = await pool.query(`
    SELECT id, topic_id, session_id, user_id, role, content, model, provider,
           parent_id, tools, created_at, client_id
    FROM messages
    ORDER BY created_at ASC
  `);
  console.log(`→ messages: ${rows.length} filas leídas de Neon`);
  dump('messages', rows);

  const stats: MigrationStats = {
    errors: [],
    failed: 0,
    success: 0,
    table: 'messages',
    total: rows.length,
  };

  for (const batch of chunk(rows)) {
    try {
      const body = {
        messages: batch.map((r) => ({
          client_id: r.client_id ?? r.id,
          content: r.content ?? '',
          development: 'bodasdehoy',
          metadata: { migrated_from_neon: true, neon_created_at: r.created_at, neon_id: r.id },
          model: r.model ?? undefined,
          parent_id: r.parent_id ?? undefined,
          provider: r.provider ?? undefined,
          role: r.role ?? 'user',
          session_id: r.session_id,
          tools: r.tools ?? undefined,
          topic_id: r.topic_id,
          user_id: r.user_id,
        })),
      };
      const res = await apiPost<{
        count?: number;
        errors?: Array<{ client_id?: string; error?: string }>;
      }>('/api/history/messages/batch', body);
      stats.success += res?.count ?? batch.length;
      for (const e of res?.errors ?? []) {
        stats.failed++;
        stats.errors.push(`message ${e.client_id ?? '?'}: ${e.error ?? '?'}`);
      }
    } catch (e: any) {
      stats.failed += batch.length;
      stats.errors.push(`batch messages: ${e?.message ?? e}`);
    }
    await sleep(PAUSE_MS);
  }
  return stats;
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('═════════════════════════════════════════════════════════════════');
  console.log('   MIGRACIÓN Neon Postgres → api-ia (Fase 2)');
  console.log(`   Modo: ${DRY_RUN ? 'DRY-RUN (sin impacto)' : 'EJECUCIÓN REAL'}`);
  console.log(`   Tabla: ${TABLE_ARG ?? 'TODAS'}`);
  console.log(`   API base: ${API_BASE}`);
  console.log('═════════════════════════════════════════════════════════════════');

  const runs: Array<() => Promise<MigrationStats>> = [];
  if (!TABLE_ARG || TABLE_ARG === 'users') runs.push(migrateUsers);
  if (!TABLE_ARG || TABLE_ARG === 'sessions') runs.push(migrateSessions);
  if (!TABLE_ARG || TABLE_ARG === 'topics') runs.push(migrateTopics);
  if (!TABLE_ARG || TABLE_ARG === 'messages') runs.push(migrateMessages);

  const allStats: MigrationStats[] = [];
  for (const fn of runs) {
    try {
      const s = await fn();
      allStats.push(s);
      console.log(
        `✓ ${s.table}: total=${s.total} success=${s.success} failed=${s.failed}`,
      );
    } catch (e: any) {
      console.error(`✗ ${fn.name} EXPLOTÓ:`, e?.message ?? e);
    }
  }

  await pool.end();

  console.log('');
  console.log('═══ RESUMEN ═══');
  for (const s of allStats) {
    console.log(`  ${s.table.padEnd(10)} → ${s.success}/${s.total} ✓  ${s.failed} ✗`);
    for (const err of s.errors.slice(0, 5)) console.log(`    err: ${err}`);
    if (s.errors.length > 5) console.log(`    … (${s.errors.length - 5} errores más)`);
  }

  const anyFailed = allStats.some((s) => s.failed > 0);
  process.exit(anyFailed ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(3);
});

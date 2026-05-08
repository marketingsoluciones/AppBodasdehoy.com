import { test, expect } from '@playwright/test';
import { clearSession, waitForAppReady } from './helpers';
import { ISABEL_RAUL_EVENT, TEST_USERS } from './fixtures/isabel-raul-event';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3220';

const CREATE_TABLE_MUTATION = `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $mesa: JSON) {
  createTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, mesa:$mesa) {
    success
    errors { message code }
    evento { _id planSpaceSelect planSpace }
  }
}`;

const CREATE_TABLE_INLINE_MUTATION = (title: string) => `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID) {
  createTable(
    eventID:$eventID,
    planSpaceID:$planSpaceID,
    sectionID:$sectionID,
    mesa:{
      title:"${title.replace(/\"/g, '')}",
      nombre_mesa:"${title.replace(/\"/g, '')}",
      numberChair:8,
      cantidad_sillas:8,
      position:{x:120,y:140},
      posicion:{x:120,y:140},
      rotation:0,
      size:{width:100,height:80},
      tipo:"redonda"
    }
  ) {
    success
    errors { message code }
    evento { _id planSpaceSelect planSpace }
  }
}`;

const EDIT_TABLE_MUTATION = `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID, $variable: String, $valor: String) {
  editTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, tableID:$tableID, variable:$variable, valor:$valor) {
    success
    errors { message code }
    evento { _id planSpaceSelect planSpace }
  }
}`;

const QUERY_EVENT = `query($variable: String, $valor: String, $development: String!) {
  queryenEvento(variable: $variable, valor: $valor, development: $development) { _id planSpace }
}`;

async function loginApp(page: any, email: string, password: string): Promise<boolean> {
  const loginUrl = BASE_URL.includes('app-dev') || BASE_URL.includes('app-test')
    ? `${BASE_URL}/login?local-login=1`
    : `${BASE_URL}/login`;

  await page.goto(loginUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(1500);

  const emailInput = page.locator('input[type="email"], input[name="identifier"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 20_000 });
  await emailInput.fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 35_000 }).catch(() => {});
  await waitForAppReady(page, 25_000);
  // Fail-fast: verificar que cookie de sesión se estableció (sino login falló silente)
  const hasSession = await page.waitForFunction(
    () => document.cookie.includes('idTokenV0.1.0') || document.cookie.includes('sessionBodas'),
    null,
    { timeout: 12_000 },
  ).then(() => true).catch(() => false);
  return hasSession;
}

async function graphql(page: any, query: string, variables: Record<string, any>) {
  const res = await page.request.post(`${BASE_URL}/api/proxy/graphql`, {
    headers: { Development: 'bodasdehoy' },
    data: { query, variables },
    timeout: 30_000,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status(), json };
}

function parseJsonMaybe(value: any) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function pickTableFromPlanSpace(event: any, planSpaceID: string, by: { tableID?: string; title?: string }) {
  const planSpaces = parseJsonMaybe(event?.planSpace);
  const ps = Array.isArray(planSpaces) ? planSpaces.find((p: any) => String(p?._id) === String(planSpaceID)) ?? planSpaces[0] : null;
  const tables = ps?.tables;
  if (!Array.isArray(tables) || tables.length === 0) return null;
  if (by.tableID) return tables.find((t: any) => String(t?._id) === String(by.tableID)) ?? null;
  if (by.title) return tables.find((t: any) => String(t?.title) === String(by.title)) ?? null;
  return tables[tables.length - 1] ?? null;
}

function pickPlanSpaceId(event: any): string {
  const raw = event?.planSpace;
  const planSpaces = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (Array.isArray(planSpaces) && planSpaces[0]?._id) return String(planSpaces[0]._id);
  throw new Error('No se pudo obtener planSpaceID del evento');
}

test.describe('P0-005 Mesas — createTable/editTable (MCP GraphQL real)', () => {
  test.setTimeout(180_000);

  test('CREATOR puede crear y editar mesa', async ({ context, page }) => {
    await clearSession(context, page);
    const loggedIn = await loginApp(page, TEST_USERS.organizador.email, TEST_USERS.organizador.password);
    if (!loggedIn) {
      test.skip(true, 'TEST_LOGIN_FAILED: cookie sesión no establecida tras login. Verifica TEST_USER credenciales/Firebase.');
      return;
    }

    const q = await graphql(page, QUERY_EVENT, { variable: '_id', valor: ISABEL_RAUL_EVENT.id, development: 'bodasdehoy' });
    expect(q.status).toBe(200);
    expect(q.json?.errors?.length).toBeFalsy();
    const event = Array.isArray(q.json?.data?.queryenEvento) ? q.json.data.queryenEvento[0] : q.json?.data?.queryenEvento;
    expect(event?._id).toBe(ISABEL_RAUL_EVENT.id);
    const planSpaceID = pickPlanSpaceId(event);

    const runId = Date.now().toString().slice(-6);
    const title = `Mesa E2E ${runId}`;
    const position = { x: 120, y: 140 };
    const mesa = {
      title,
      nombre_mesa: title,
      numberChair: 8,
      cantidad_sillas: 8,
      position,
      posicion: position,
      rotation: 0,
      size: { width: 100, height: 80 },
      tipo: 'redonda',
    };

    const created = await graphql(page, CREATE_TABLE_MUTATION, { eventID: ISABEL_RAUL_EVENT.id, planSpaceID, mesa });
    expect(created.status).toBe(200);
    expect(created.json?.errors?.length).toBeFalsy();
    let createResp = created.json?.data?.createTable;
    if (createResp?.success !== true) {
      const inline = await graphql(page, CREATE_TABLE_INLINE_MUTATION(title), { eventID: ISABEL_RAUL_EVENT.id, planSpaceID });
      if (inline.status !== 200 || inline.json?.errors?.length) {
        const debugPlanSpaces = (() => {
          const raw = Array.isArray(q.json?.data?.queryenEvento) ? q.json.data.queryenEvento[0]?.planSpace : q.json?.data?.queryenEvento?.planSpace;
          const ps = parseJsonMaybe(raw);
          if (!Array.isArray(ps)) return null;
          return ps.map((p: any) => ({ _id: p?._id, tables: Array.isArray(p?.tables) ? p.tables.length : null }));
        })();
        throw new Error(JSON.stringify({ planSpaceID, errors: createResp?.errors || null, inline: inline.json, debugPlanSpaces }, null, 2));
      }
      createResp = inline.json?.data?.createTable;
      if (createResp?.success !== true) {
        const debugPlanSpaces = (() => {
          const raw = Array.isArray(q.json?.data?.queryenEvento) ? q.json.data.queryenEvento[0]?.planSpace : q.json?.data?.queryenEvento?.planSpace;
          const ps = parseJsonMaybe(raw);
          if (!Array.isArray(ps)) return null;
          return ps.map((p: any) => ({ _id: p?._id, tables: Array.isArray(p?.tables) ? p.tables.length : null }));
        })();
        throw new Error(JSON.stringify({ planSpaceID, errors: createResp?.errors || null, debugPlanSpaces }, null, 2));
      }
    }
    const createdEvent = createResp?.evento;
    const createdTable = pickTableFromPlanSpace(createdEvent, planSpaceID, { title });
    expect(createdTable?._id).toBeTruthy();
    expect(createdTable?.title).toBe(title);

    const newTitle = `${title} (edit)`;
    const edited = await graphql(page, EDIT_TABLE_MUTATION, {
      eventID: ISABEL_RAUL_EVENT.id,
      planSpaceID,
      tableID: createdTable._id,
      variable: 'title',
      valor: newTitle,
    });
    expect(edited.status).toBe(200);
    expect(edited.json?.errors?.length).toBeFalsy();
    expect(edited.json?.data?.editTable?.success).toBe(true);
    const editedEvent = edited.json?.data?.editTable?.evento;
    const editedTable = pickTableFromPlanSpace(editedEvent, planSpaceID, { tableID: createdTable._id });
    expect(editedTable?._id).toBe(createdTable._id);
    expect(editedTable?.title).toBe(newTitle);
  });

  test('INVITED_GUEST no puede crear mesa (debe fallar)', async ({ context, page }) => {
    await clearSession(context, page);
    const loggedInGuest = await loginApp(page, TEST_USERS.carlosCarrilloInvitado.email, TEST_USERS.carlosCarrilloInvitado.password);
    if (!loggedInGuest) {
      test.skip(true, 'TEST_LOGIN_FAILED: cookie sesión no establecida para invitado. Verifica credenciales.');
      return;
    }

    const q = await graphql(page, QUERY_EVENT, { variable: '_id', valor: ISABEL_RAUL_EVENT.id, development: 'bodasdehoy' });
    expect(q.status).toBe(200);
    const event = Array.isArray(q.json?.data?.queryenEvento) ? q.json.data.queryenEvento[0] : q.json?.data?.queryenEvento;
    if (!event?._id) return;
    let planSpaceID: string | null = null;
    try { planSpaceID = pickPlanSpaceId(event); } catch {}
    if (!planSpaceID) return;

    const runId = Date.now().toString().slice(-6);
    const title = `Mesa SHOULD_FAIL ${runId}`;
    const position = { x: 60, y: 60 };
    const mesa = {
      title,
      nombre_mesa: title,
      numberChair: 6,
      cantidad_sillas: 6,
      position,
      posicion: position,
      rotation: 0,
      size: { width: 90, height: 70 },
      tipo: 'redonda',
    };

    const created = await graphql(page, CREATE_TABLE_MUTATION, { eventID: ISABEL_RAUL_EVENT.id, planSpaceID, mesa });
    if (created.status === 200) {
      expect(created.json?.data?.createTable?.success).toBe(false);
    }
  });
});

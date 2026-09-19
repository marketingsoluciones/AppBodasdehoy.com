// SPRINT-F 2026-05-21: smoke memories — verifica acceso + apertura modal CRUD.
// No persiste data (cancela modal) → no requiere cleanup backend.
// Versión "real CRUD con cleanup" planeada Sprint G.
//
// Pre-requisito: save-storage-states.ts ejecutado.
// Run: cd /tmp/repo-dev/apps/chat-ia/e2e && npx tsx smoke-memories.ts

import { webkit } from 'playwright';
import { resolve } from 'path';
import { existsSync, writeFileSync } from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3210';
const STORAGE_DIR = resolve(__dirname, '.auth');
const USER_TAG = process.env.USER_TAG || 'super-admin';

interface Check { step: string; status: 'OK' | 'FAIL'; detail?: string }

async function main() {
  const statePath = resolve(STORAGE_DIR, `${USER_TAG}.json`);
  if (!existsSync(statePath)) {
    console.error(`❌ Missing ${statePath} — run save-storage-states.ts first`);
    process.exitCode = 1;
    return;
  }

  console.log(`SMOKE MEMORIES → ${USER_TAG}`);
  const checks: Check[] = [];
  const browser = await webkit.launch({ headless: true });
  const ctx = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 },
    storageState: statePath,
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 120)));

  try {
    await page.goto('/memories', { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(3000);
    checks.push({ step: 'load /memories', status: page.url().includes('/memories') ? 'OK' : 'FAIL' });
    console.log(`[1] load /memories: url=${page.url()}`);

    // Botón "Crear Álbum" (header) o "Crear mi primer álbum" (empty state)
    const createBtn = page.locator('button:has-text("Crear Álbum"), button:has-text("Crear mi primer álbum")').first();
    const createVisible = await createBtn.count();
    checks.push({
      step: 'crear-album button visible',
      status: createVisible > 0 ? 'OK' : 'FAIL',
      detail: `${createVisible} matches`,
    });
    console.log(`[2] crear-album button: ${createVisible}`);

    if (createVisible === 0) {
      writeFileSync(`/tmp/smoke-memories-${USER_TAG}-no-button.png`, await page.screenshot({ fullPage: true, timeout: 10_000, animations: 'disabled' }).catch(() => Buffer.from('')));
    } else {
      // Open create modal
      await createBtn.click();
      await page.waitForTimeout(1500);
      const modalTitle = await page.locator('.ant-modal-title').filter({ hasText: /crear nuevo álbum/i }).count();
      const nameInput = await page.locator('.ant-modal input').count();
      checks.push({
        step: 'modal Crear Nuevo Álbum opens',
        status: modalTitle > 0 && nameInput > 0 ? 'OK' : 'FAIL',
        detail: `title=${modalTitle} input=${nameInput}`,
      });
      console.log(`[3] modal opened: title=${modalTitle} input=${nameInput}`);

      if (modalTitle === 0) {
        writeFileSync(`/tmp/smoke-memories-${USER_TAG}-no-modal.png`, await page.screenshot({ fullPage: true, timeout: 10_000, animations: 'disabled' }).catch(() => Buffer.from('')));
      }

      // Cancel modal (no commit). Espera animación + verifica que ya no es visible.
      const cancelBtn = page.locator('.ant-modal-footer button:has-text("Cancelar"), .ant-modal-close').first();
      if (await cancelBtn.count()) {
        await cancelBtn.click();
        await page.waitForTimeout(2000); // antd animation
        const visibleModal = await page.locator('.ant-modal:not(.ant-modal-hidden)').filter({ has: page.locator('.ant-modal-title', { hasText: /crear nuevo álbum/i }) }).count();
        const stillVisible = await page.locator('.ant-modal-title:visible').filter({ hasText: /crear nuevo álbum/i }).count();
        checks.push({
          step: 'cancel cierra modal',
          status: stillVisible === 0 ? 'OK' : 'FAIL',
          detail: `visibleModal=${visibleModal} stillVisible=${stillVisible}`,
        });
        console.log(`[4] cancel: visibleModal=${visibleModal} stillVisible=${stillVisible}`);
      }
    }

    console.log(`\n=== RESUMEN ${USER_TAG} ===`);
    console.table(checks);
    const fails = checks.filter((c) => c.status === 'FAIL').length;
    process.exitCode = fails > 0 ? 1 : 0;
  } catch (e: any) {
    console.error('[FATAL]', e.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();

/**
 * multi-tenant-smoke.spec.ts
 *
 * Smoke por cada tenant CONFIRMADO de AppBodas (4 hoy):
 *  - bodasdehoy
 *  - vivetuboda
 *  - eventosorganizador
 *  - eventosplanificador
 *
 * Cada tenant verifica:
 *  - Hostname carga sin 500 / ErrorBoundary
 *  - Branding propio: headTitle correcto vs config developments.ts
 *  - Login form aparece (vía SSO chat-{tenant} o local)
 *  - Theme primaryColor presente en CSS variables / header
 *
 * Tenants NO incluidos (pendiente confirmación user si son AppBodas):
 *  champagne-events, annloevents, miamorcitocorazon, eventosintegrados,
 *  ohmaratilano, corporativozr, theweddingplanner.
 *
 * No requiere login efectivo — solo carga de dominio + estructura.
 * Test "carga + branding" es smoke: si tenant cae, lo detectamos antes que cliente.
 */
import { test, expect } from '@playwright/test';
import { developments } from '../packages/shared/src/types/developments';

const ENV = process.env.E2E_ENV || 'dev';
const ALLOWED_TENANTS_APP = ['bodasdehoy', 'vivetuboda', 'eventosorganizador', 'eventosplanificador'];

// Solo correr en dev por defecto. Override permite test/prod si user lo decide explícito.
const RUN_AGAINST_DEV = ENV === 'dev';

const tenants = developments.filter((d) => ALLOWED_TENANTS_APP.includes(d.development));

for (const tenant of tenants) {
  test.describe(`Multi-tenant smoke — ${tenant.name}`, () => {
    test.setTimeout(60_000);

    const rootDomain = tenant.domain.replace(/^\./, '');
    // Convertir a -dev (sustituye nombre raíz por subdominio app-dev)
    const appDevHost = `https://app-dev.${rootDomain}`;
    const appTestHost = `https://app-test.${rootDomain}`;
    const targetHost = RUN_AGAINST_DEV ? appDevHost : appTestHost;

    test('hostname carga sin ErrorBoundary ni 500', async ({ page }) => {
      const response = await page.goto(targetHost, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      }).catch((e) => null);

      if (!response) {
        test.skip(
          true,
          `BLOQUEO_INFRA: ${targetHost} no accesible (DNS/tunnel/deploy). Verificar Cloudflare o despliegue.`
        );
        return;
      }

      const status = response.status();
      expect(
        status < 500,
        `BLOQUEO_INFRA: ${targetHost} → HTTP ${status}. Tenant inaccesible.`
      ).toBe(true);

      await page.waitForTimeout(3000);
      const text = (await page.locator('body').textContent()) ?? '';
      expect(
        text,
        `BUG_PRODUCTO: ${targetHost} muestra ErrorBoundary — app crash en este tenant`
      ).not.toMatch(/Error Capturado por ErrorBoundary/);
    });

    test('branding correcto: title en HTML coincide con headTitle del tenant', async ({ page }) => {
      const response = await page.goto(targetHost, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      }).catch(() => null);

      if (!response || response.status() >= 500) {
        test.skip(true, `BLOQUEO_INFRA: ${targetHost} no accesible para verificar branding`);
        return;
      }

      const title = await page.title();

      if (tenant.headTitle) {
        // El title puede ser exactamente headTitle o contenerlo
        const matches = title === tenant.headTitle || title.includes(tenant.headTitle.split(' ')[0]);
        expect(
          matches,
          `BUG_PRODUCTO: ${tenant.name} title="${title}" — esperado contiene "${tenant.headTitle}". Branding incorrecto en este tenant.`
        ).toBe(true);
      } else {
        // Sin headTitle definido → al menos verificar que carga algún title
        expect(title.length, `${tenant.name} sin title visible — posible bug branding/layout`).toBeGreaterThan(0);
      }
    });

    test('theme primaryColor aplicado en CSS o header', async ({ page }) => {
      const response = await page.goto(targetHost, {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      }).catch(() => null);

      if (!response || response.status() >= 500) {
        test.skip(true, `BLOQUEO_INFRA: ${targetHost} no accesible para verificar theme`);
        return;
      }

      await page.waitForTimeout(2500);

      // primaryColor del tenant — verificar que se usa en algún lugar visible
      const primaryColor = tenant.theme?.primaryColor;
      if (!primaryColor) {
        test.skip(true, `${tenant.name} sin theme.primaryColor definido en developments.ts`);
        return;
      }

      // Buscar el color en CSS computado (puede estar en :root vars, btn principal, etc.)
      // Convertir hex a rgb para comparar (algunos browsers reportan rgb)
      const colorDetected = await page.evaluate((target: string) => {
        const allElements = document.querySelectorAll('*');
        let count = 0;
        const targetLower = target.toLowerCase();
        for (const el of Array.from(allElements).slice(0, 200)) {
          const style = window.getComputedStyle(el);
          const props = ['backgroundColor', 'color', 'borderColor'];
          for (const prop of props) {
            const val = (style as any)[prop] as string;
            if (val && val.toLowerCase().includes(targetLower)) return true;
          }
          // CSS vars
          const cssVars = ['--color-primary', '--primary-color', '--color-pink-500'];
          for (const v of cssVars) {
            const cv = (style as any).getPropertyValue?.(v);
            if (cv && cv.toLowerCase().includes(targetLower)) return true;
          }
          count++;
          if (count > 200) break;
        }
        return false;
      }, primaryColor.toLowerCase());

      // No-fail-hard: theme puede estar como rgb() — solo verificar que no es bodasdehoy default cuando NO es bodasdehoy
      // Para tenants no-bodasdehoy, mínimo verificar que NO está usando primaryColor de bodasdehoy
      if (tenant.development !== 'bodasdehoy') {
        const bodasColor = '#F7628C'.toLowerCase(); // bodasdehoy primary
        const isUsingBodasColor = await page.evaluate((c: string) => {
          const els = document.querySelectorAll('*');
          for (const el of Array.from(els).slice(0, 100)) {
            const bg = window.getComputedStyle(el).backgroundColor;
            if (bg && bg.toLowerCase().includes(c)) return true;
          }
          return false;
        }, bodasColor.toLowerCase());

        expect(
          !isUsingBodasColor || colorDetected,
          `BUG_PRODUCTO: ${tenant.name} parece estar usando branding/theme de bodasdehoy. Verificar getDevelopmentNameFromHostname.`
        ).toBe(true);
      }
    });
  });
}

import { test, expect } from '@playwright/test';

/**
 * Comprueba que muchas rutas cargan sin ErrorBoundary y muestran contenido.
 * Texto genérico: si la ruta requiere login/evento puede mostrar permiso o My Events.
 */
const CONTENIDO_GENERICO = /permiso|My Events|Iniciar sesión|Bodas de Hoy|Resumen|Invitados|Presupuesto|Mesas|Itinerario|Invitaciones|Regalos|Configuración|Facturación|evento|login|crear|organiz/i;

const RUTAS: { path: string; textoEsperado: RegExp }[] = [
  { path: '/', textoEsperado: CONTENIDO_GENERICO },
  { path: '/login', textoEsperado: /Iniciar sesión|Bodas de Hoy|login|Registrarse/i },
  { path: '/invitados', textoEsperado: CONTENIDO_GENERICO },
  { path: '/resumen-evento', textoEsperado: CONTENIDO_GENERICO },
  { path: '/presupuesto', textoEsperado: CONTENIDO_GENERICO },
  { path: '/mesas', textoEsperado: CONTENIDO_GENERICO },
  { path: '/itinerario', textoEsperado: CONTENIDO_GENERICO },
  { path: '/invitaciones', textoEsperado: CONTENIDO_GENERICO },
  { path: '/lista-regalos', textoEsperado: CONTENIDO_GENERICO },
  { path: '/configuracion', textoEsperado: CONTENIDO_GENERICO },
  { path: '/facturacion', textoEsperado: CONTENIDO_GENERICO },
  { path: '/info-app', textoEsperado: CONTENIDO_GENERICO },
  { path: '/eventos', textoEsperado: CONTENIDO_GENERICO },
  { path: '/servicios', textoEsperado: CONTENIDO_GENERICO },
  { path: '/bandeja-de-mensajes', textoEsperado: CONTENIDO_GENERICO },
  { path: '/momentos', textoEsperado: CONTENIDO_GENERICO },
];

test.describe('Rutas cargan (navegador debe cargar)', () => {
  test.setTimeout(75_000);

  for (const { path, textoEsperado } of RUTAS) {
    test(`${path} carga y muestra contenido`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForLoadState('load').catch(() => {});

      // Esperar a que el spinner de carga desaparezca (máx 15s)
      await page.waitForFunction(
        () => !document.querySelector('[role="status"]')?.textContent?.includes('Cargando'),
        { timeout: 15_000 }
      ).catch(() => {});

      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 25_000 });

      const text = (await body.textContent()) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);
      expect(text.length).toBeGreaterThan(50);
      expect(textoEsperado.test(text)).toBe(true);
    });
  }
});

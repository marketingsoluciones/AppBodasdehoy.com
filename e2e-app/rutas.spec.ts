import { test, expect } from '@playwright/test';

/**
 * Comprueba que muchas rutas cargan sin ErrorBoundary y muestran contenido.
 * Las rutas sin textoEsperado solo verifican: no ErrorBoundary + texto > 50 chars.
 * Las rutas con textoEsperado verifican contenido específico.
 */
const RUTAS: { path: string; textoEsperado?: RegExp }[] = [
  { path: '/' },
  { path: '/login', textoEsperado: /Iniciar sesión|Bodas de Hoy|Registrarse|Email|contraseña/i },
  { path: '/invitados', textoEsperado: /Invitados|invitado|Lista|Añadir|Permiso|Iniciar sesión/i },
  { path: '/resumen-evento', textoEsperado: /Resumen|evento|Presupuesto|Fecha|Iniciar sesión/i },
  { path: '/presupuesto', textoEsperado: /Presupuesto|categoría|gasto|Añadir|Iniciar sesión/i },
  { path: '/mesas', textoEsperado: /Mesas|mesa|plano|asiento|Iniciar sesión/i },
  { path: '/itinerario', textoEsperado: /Itinerario|tarea|servicio|Iniciar sesión/i },
  { path: '/invitaciones', textoEsperado: /Invitaciones|Email|WhatsApp|enviar|Iniciar sesión/i },
  { path: '/lista-regalos', textoEsperado: /Regalos|regalo|lista|Añadir|Iniciar sesión/i },
  { path: '/configuracion', textoEsperado: /Configuración|perfil|cuenta|Iniciar sesión/i },
  { path: '/facturacion', textoEsperado: /Facturación|plan|saldo|pago|Iniciar sesión/i },
  { path: '/info-app' },
  { path: '/eventos', textoEsperado: /eventos|Mi boda|Crear|Iniciar sesión/i },
  { path: '/servicios', textoEsperado: /Tareas|Tasks|servicio|Kanban|Iniciar sesión/i },
  { path: '/bandeja-de-mensajes' },
  { path: '/momentos' },
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
      expect(text.length, `Ruta ${path} tiene contenido insuficiente`).toBeGreaterThan(50);
      if (textoEsperado) {
        expect(
          textoEsperado.test(text),
          `Ruta ${path} no muestra texto esperado. Texto actual: ${text.slice(0, 200)}`,
        ).toBe(true);
      }
    });
  }
});

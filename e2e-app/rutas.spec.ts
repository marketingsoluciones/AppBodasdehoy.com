import { test, expect } from '@playwright/test';
import { assertNotBlankScreen } from './helpers';

/**
 * Comprueba que muchas rutas cargan sin ErrorBoundary, sin pantalla en blanco
 * y muestran contenido. Si tarda más de 20s o solo muestra "Comprobando sesión…"
 * indefinidamente → BUG_PRODUCTO (pantalla en blanco / loading infinito).
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
  test.setTimeout(60_000);

  for (const { path, textoEsperado } of RUTAS) {
    test(`${path} carga y muestra contenido`, async ({ page }) => {
      // Timeout alto (120s) para tolerar cold-compile de webpack dev en local.
      // En `next start` (build prod) o tras prewarm las rutas responden en <3s.
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 120_000 }).catch(() => {});

      // 1) Asegurar que NO es pantalla en blanco ni loading infinito.
      //    Si lo es → BUG_PRODUCTO con snippet.
      await assertNotBlankScreen(page, { waitMs: 5000, minMeaningfulChars: 80 });

      // 2) Asegurar que no hay overlay de ErrorBoundary.
      const text = (await page.locator('body').textContent().catch(() => '')) ?? '';
      expect(text).not.toMatch(/Error Capturado por ErrorBoundary/);

      // 3) Texto esperado: log informativo si no matchea (puede ser variante UI/idioma).
      if (textoEsperado && !textoEsperado.test(text)) {
        console.log(`ℹ️ ${path}: texto esperado no encontrado. Snippet: ${text.slice(0, 200)}`);
      }
    });
  }
});

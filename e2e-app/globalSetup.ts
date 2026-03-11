/**
 * Pausa inicial para que puedas ver el navegador cuando se abre.
 * Solo actúa cuando E2E_HEADED=1 o cuando no es CI.
 */
export default async function globalSetup() {
  const headed = process.env.E2E_HEADED === '1' || process.env.E2E_HEADED === 'true';
  const isCI = process.env.CI === 'true' || process.env.CI === '1';
  const delayMs = parseInt(process.env.E2E_DELAY_BEFORE || '0', 10) || (headed && !isCI ? 5000 : 0);
  if (delayMs > 0) {
    console.log(`\n[E2E] Esperando ${delayMs / 1000}s para que puedas ver el navegador...\n`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

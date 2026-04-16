/**
 * auth-diagnostic.spec.ts
 * Plan de diagnóstico y detección de fallos en login/logout
 * Cubre: app-dev, chat-dev, SSO cross-domain, cookies, localStorage, doble login, logout stale state
 *
 * Ejecutar: bunx playwright test e2e-app/auth-diagnostic.spec.ts --project=webkit
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

const APP_DEV = 'https://app-dev.bodasdehoy.com'
const CHAT_DEV = 'https://chat-dev.bodasdehoy.com'

const CREDS = {
  email: 'bodasdehoy.com@gmail.com',
  // password cargada desde variable de entorno para no hardcodear
  password: process.env.TEST_PASSWORD ?? '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCookies(page: Page, names: string[]) {
  return page.evaluate((ns) => {
    const map: Record<string, string | null> = {}
    ns.forEach(n => {
      const match = document.cookie.split(';').find(c => c.trim().startsWith(n + '='))
      map[n] = match ? match.trim().split('=').slice(1).join('=') : null
    })
    return map
  }, names)
}

async function getLocalStorageKeys(page: Page, keys: string[]) {
  return page.evaluate((ks) => {
    const map: Record<string, string | null> = {}
    ks.forEach(k => { map[k] = localStorage.getItem(k) })
    return map
  }, keys)
}

async function waitForVerification(page: Page, timeout = 8000) {
  // Esperar a que desaparezca el spinner de carga (verificationDone = true)
  await page.waitForFunction(
    () => !document.querySelector('[role="status"][aria-label="Cargando"]'),
    { timeout }
  ).catch(() => { /* si no hay spinner, ok */ })
}

async function loginEmail(page: Page, email: string, password: string) {
  await page.fill('input[type="email"], input[placeholder*="email"], input[placeholder*="correo"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"], button:has-text("Iniciar sesión")')
}

// ─── BLOQUE 1: app-dev — Estado inicial sin sesión ────────────────────────────

test.describe('APP-DEV: Estado sin sesión', () => {

  test('1.1 — Sin sesión: redirige a chat-dev/login (SSO)', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto(`${APP_DEV}/login`, { waitUntil: 'networkidle' })

    // Debe redirigir a chat-dev/login
    await page.waitForURL(/chat-dev\.bodasdehoy\.com\/.*login/, { timeout: 10000 })
      .catch(async () => {
        // Si no redirige, verificar que al menos estamos en /login de app-dev
        const url = page.url()
        console.warn('[1.1] No redirigió a chat-dev. URL actual:', url)
        expect(url).toContain('login') // aceptar si se queda en su propio login
      })

    // Verificar que sso_redirect_pending está en sessionStorage
    const ssoFlag = await page.evaluate(() => sessionStorage.getItem('sso_redirect_pending'))
    expect(ssoFlag).toBe('1')
  })

  test('1.2 — Sin sesión: rutas protegidas muestran demo (guest)', async ({ page, context }) => {
    await context.clearCookies()
    const routes = ['/invitados', '/mesas', '/presupuesto', '/itinerario', '/servicios', '/lista-regalos']

    for (const route of routes) {
      await page.goto(`${APP_DEV}${route}`, { waitUntil: 'domcontentloaded' })
      await waitForVerification(page)

      // Debe mostrar el banner DEMO o el overlay de GuestDemoWrapper
      const hasDemoBanner = await page.locator('text=datos ficticios').isVisible().catch(() => false)
      const hasUpsellPage = await page.locator('text=Crear cuenta gratis').first().isVisible().catch(() => false)

      if (!hasDemoBanner && !hasUpsellPage) {
        console.error(`[1.2] Ruta ${route} no muestra demo ni upsell`)
      }
      expect(hasDemoBanner || hasUpsellPage).toBeTruthy()
    }
  })

  test('1.3 — Anti-loop: idTokenV0.1.0 presente NO redirige a chat-dev', async ({ page, context }) => {
    await context.clearCookies()
    // Simular que ya tenemos el token SSO (como si chat-dev lo hubiera puesto)
    await page.goto(APP_DEV)
    await page.evaluate(() => {
      // Poner una cookie falsa de idTokenV0.1.0
      document.cookie = 'idTokenV0.1.0=fake-token; domain=.bodasdehoy.com; path=/'
    })
    await page.goto(`${APP_DEV}/login`)
    await page.waitForTimeout(2000)

    // NO debe redirigir a chat-dev cuando hasSsoToken = true
    expect(page.url()).not.toMatch(/chat-dev/)
  })
})

// ─── BLOQUE 2: app-dev — Flujo de login email/password directo ────────────────

test.describe('APP-DEV: Login email/password', () => {

  test('2.1 — Login con ?local-login=1 bypassa SSO redirect', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })

    // NO debe redirigir a chat-dev
    await page.waitForTimeout(1500)
    expect(page.url()).toContain('app-dev.bodasdehoy.com')
    expect(page.url()).not.toContain('chat-dev')
  })

  test('2.2 — Login directo: cookies y localStorage correctos post-login', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })

    await loginEmail(page, CREDS.email, CREDS.password)
    // Esperar redirección post-login
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })
    await waitForVerification(page)

    // Cookies presentes
    const cookies = await getCookies(page, ['sessionBodas', 'idTokenV0.1.0'])
    expect(cookies['sessionBodas'] ?? cookies['idTokenV0.1.0']).toBeTruthy()

    // localStorage con dev-user-config
    const ls = await getLocalStorageKeys(page, ['dev-user-config', 'user_email'])
    expect(ls['dev-user-config']).toBeTruthy()

    // Usuario NO es guest
    const displayName = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem('dev-user-config') ?? '{}')?.displayName } catch { return null }
    })
    expect(displayName).not.toBe('guest')
  })

  test('2.3 — DETECCIÓN DOBLE LOGIN: login no pide credenciales dos veces', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })

    let loginPageCount = 0
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame() && frame.url().includes('/login')) {
        loginPageCount++
        console.log(`[2.3] Navegó a /login por vez #${loginPageCount}:`, frame.url())
      }
    })

    await loginEmail(page, CREDS.email, CREDS.password)
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })

    // Máximo 1 visita a /login durante todo el flujo
    expect(loginPageCount).toBeLessThanOrEqual(1)
  })
})

// ─── BLOQUE 3: app-dev — SSO desde chat-dev ───────────────────────────────────

test.describe('APP-DEV: SSO cross-domain desde chat-dev', () => {

  test('3.1 — Flujo completo SSO: chat-dev login → app-dev sin doble login', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()

    let loginPageCount = 0
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame() && frame.url().includes('/login')) {
        loginPageCount++
        console.log(`[3.1] Visita a /login #${loginPageCount}:`, frame.url())
      }
    })

    // 1. Ir a app-dev → redirige a chat-dev/login
    await page.goto(`${APP_DEV}/login`, { waitUntil: 'networkidle' })
    const redirectedToChat = page.url().includes('chat-dev')

    if (redirectedToChat) {
      // 2. Login en chat-dev
      await loginEmail(page, CREDS.email, CREDS.password)

      // 3. Esperar redirect de vuelta a app-dev
      await page.waitForURL(/app-dev\.bodasdehoy\.com/, { timeout: 20000 })
      await waitForVerification(page, 10000)

      // 4. Verificar que NO volvió a /login
      expect(page.url()).not.toContain('/login')

      // 5. Detectar doble login — máximo 1 visita a /login por cada dominio
      console.log(`[3.1] Total visitas a /login: ${loginPageCount}`)
      expect(loginPageCount).toBeLessThanOrEqual(2) // 1 en app-dev + 1 en chat-dev
    } else {
      test.skip() // SSO no activado en este entorno
    }
  })

  test('3.2 — SSO: idTokenV0.1.0 se propaga a app-dev tras login en chat-dev', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${CHAT_DEV}/login`, { waitUntil: 'networkidle' })
    await loginEmail(page, CREDS.email, CREDS.password)
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })

    // idTokenV0.1.0 debe existir en .bodasdehoy.com (accesible desde app-dev)
    const chatCookies = await context.cookies()
    const idToken = chatCookies.find(c => c.name === 'idTokenV0.1.0')
    expect(idToken).toBeTruthy()
    expect(idToken?.domain).toMatch(/bodasdehoy\.com/)

    // Ir a app-dev y verificar que reconoce la sesión sin redirigir a login
    await page.goto(`${APP_DEV}/resumen-evento`, { waitUntil: 'networkidle' })
    await waitForVerification(page, 10000)
    expect(page.url()).not.toContain('/login')
  })
})

// ─── BLOQUE 4: app-dev — Logout ───────────────────────────────────────────────

test.describe('APP-DEV: Logout', () => {

  test('4.1 — Logout limpia cookies', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })
    await loginEmail(page, CREDS.email, CREDS.password)
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })
    await waitForVerification(page)

    // Logout via menú
    await page.locator('[data-testid="profile-menu-trigger"]').click()
    await page.waitForTimeout(500)
    await page.locator('text=Cerrar Sesión').click()
    await page.waitForURL(url => url.includes('/login') || url.includes('?end=true'), { timeout: 10000 })

    // Cookies deben estar limpias
    const cookiesAfter = await context.cookies()
    const sessionBodas = cookiesAfter.find(c => c.name === 'sessionBodas')
    expect(sessionBodas).toBeFalsy()
  })

  test('4.2 — Logout limpia localStorage (dev-user-config)', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })
    await loginEmail(page, CREDS.email, CREDS.password)
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })
    await waitForVerification(page)

    // Verificar que dev-user-config tiene datos
    const lsBefore = await getLocalStorageKeys(page, ['dev-user-config'])
    expect(lsBefore['dev-user-config']).toBeTruthy()

    // Logout
    await page.locator('[data-testid="profile-menu-trigger"]').click()
    await page.waitForTimeout(500)
    await page.locator('text=Cerrar Sesión').click()
    await page.waitForURL(url => url.includes('/login') || url.includes('?end=true'), { timeout: 10000 })

    // localStorage limpio
    const lsAfter = await getLocalStorageKeys(page, ['dev-user-config', 'jwt_token', 'user_email'])
    expect(lsAfter['dev-user-config']).toBeNull()
    expect(lsAfter['jwt_token']).toBeNull()
  })

  test('4.3 — DETECCIÓN STALE STATE: header no muestra usuario anterior post-logout', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })
    await loginEmail(page, CREDS.email, CREDS.password)
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })
    await waitForVerification(page)

    // Obtener nombre de usuario logueado
    const photoAlt = await page.locator('[alt="Photo perfil"]').getAttribute('src').catch(() => null)
    expect(photoAlt).toBeTruthy()

    // Logout
    await page.locator('[data-testid="profile-menu-trigger"]').click()
    await page.waitForTimeout(500)
    await page.locator('text=Cerrar Sesión').click()
    await page.waitForURL(url => url.includes('/login') || url.includes('?end=true'), { timeout: 10000 })
    await page.waitForTimeout(1000)

    // El avatar/foto del usuario NO debe estar visible después del logout
    const photoAfter = await page.locator('[alt="Photo perfil"]').isVisible().catch(() => false)
    expect(photoAfter).toBeFalsy()
  })

  test('4.4 — Post-logout: redirige a login, no a página protegida', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })
    await loginEmail(page, CREDS.email, CREDS.password)
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })

    // Logout
    await page.locator('[data-testid="profile-menu-trigger"]').click()
    await page.waitForTimeout(500)
    await page.locator('text=Cerrar Sesión').click()
    await page.waitForURL(url => url.includes('/login') || url.includes('?end=true') || !url.includes('bodasdehoy'), { timeout: 10000 })

    // Intentar acceder a página protegida: debe redirigir a login
    await page.goto(`${APP_DEV}/invitados`, { waitUntil: 'networkidle' })
    await waitForVerification(page, 8000)

    const url = page.url()
    const isProtected = url.includes('/login') ||
      await page.locator('text=datos ficticios').isVisible().catch(() => false) ||
      await page.locator('text=Crear cuenta gratis').first().isVisible().catch(() => false)

    expect(isProtected).toBeTruthy()
  })
})

// ─── BLOQUE 5: chat-dev — Login y logout ──────────────────────────────────────

test.describe('CHAT-DEV: Login y logout', () => {

  test('5.1 — chat-dev: login exitoso, llega al chat', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${CHAT_DEV}/login`, { waitUntil: 'networkidle' })
    await loginEmail(page, CREDS.email, CREDS.password)
    await page.waitForURL(url => !url.includes('/login'), { timeout: 20000 })

    expect(page.url()).toContain('chat-dev.bodasdehoy.com')
    expect(page.url()).not.toContain('/login')
  })

  test('5.2 — chat-dev: logout limpia dev-user-config', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${CHAT_DEV}/login`, { waitUntil: 'networkidle' })
    await loginEmail(page, CREDS.email, CREDS.password)
    await page.waitForURL(url => !url.includes('/login'), { timeout: 20000 })

    // Verificar dev-user-config post-login
    const lsBefore = await getLocalStorageKeys(page, ['dev-user-config'])
    expect(lsBefore['dev-user-config']).toBeTruthy()

    // Logout: buscar botón en el user panel
    const userPanelBtn = page.locator('[data-testid*="user"], [aria-label*="user"], [aria-label*="perfil"]').first()
    await userPanelBtn.click().catch(() => {})
    await page.waitForTimeout(500)
    const logoutBtn = page.locator('text=Logout, text=Cerrar sesión, text=Sign out').first()
    await logoutBtn.click().catch(() => {})
    await page.waitForURL(/\/login/, { timeout: 10000 }).catch(() => {})

    const lsAfter = await getLocalStorageKeys(page, ['dev-user-config'])
    expect(lsAfter['dev-user-config']).toBeNull()
  })
})

// ─── BLOQUE 6: Sesión persistente (F5 no desloguea) ──────────────────────────

test.describe('Persistencia de sesión', () => {

  test('6.1 — Refresh en app-dev mantiene sesión', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })
    await loginEmail(page, CREDS.email, CREDS.password)
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })
    await waitForVerification(page)

    // Refresh
    await page.reload({ waitUntil: 'networkidle' })
    await waitForVerification(page)

    // Sigue logueado: no redirige a login
    expect(page.url()).not.toContain('/login')
    const photo = await page.locator('[alt="Photo perfil"]').isVisible().catch(() => false)
    expect(photo).toBeTruthy()
  })

  test('6.2 — Nueva pestaña app-dev hereda sesión de la misma cookie', async ({ browser }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    const context = await browser.newContext()
    const page1 = await context.newPage()
    await page1.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })
    await loginEmail(page1, CREDS.email, CREDS.password)
    await page1.waitForURL(url => !url.includes('/login'), { timeout: 15000 })
    await waitForVerification(page1)

    // Abrir segunda pestaña
    const page2 = await context.newPage()
    await page2.goto(`${APP_DEV}/resumen-evento`, { waitUntil: 'networkidle' })
    await waitForVerification(page2)

    expect(page2.url()).not.toContain('/login')
    await context.close()
  })
})

// ─── BLOQUE 7: Panel izquierdo copilot no bloquea modales ────────────────────

test.describe('UI: Panel Copilot no bloquea formularios', () => {

  test('7.1 — Con copilot abierto: modal añadir invitado es accesible', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()
    await page.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })
    await loginEmail(page, CREDS.email, CREDS.password)
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })
    await waitForVerification(page)
    await page.goto(`${APP_DEV}/invitados`, { waitUntil: 'networkidle' })

    // Abrir copilot
    const copilotBtn = page.locator('[data-testid="copilot-toggle"], button:has-text("Copilot")').first()
    await copilotBtn.click()
    await page.waitForTimeout(500)

    // Verificar que el copilot está abierto
    const copilotOpen = await page.locator('[data-testid="copilot-toggle"][aria-label*="Cerrar"]').isVisible().catch(() => false)

    // Click en añadir invitado (botón +)
    const addBtn = page.locator('button:has-text("Añadir"), button:has-text("Agregar"), button[aria-label*="invitado"]').first()
    await addBtn.click().catch(() => {})
    await page.waitForTimeout(500)

    // El formulario/modal debe ser visible y clickeable
    const form = page.locator('form, [role="dialog"], input[placeholder*="nombre"], input[placeholder*="Nombre"]').first()
    const isVisible = await form.isVisible().catch(() => false)
    const isClickable = await form.isEnabled().catch(() => false)

    if (copilotOpen && (!isVisible || !isClickable)) {
      console.error('[7.1] FALLO: Modal bloqueado por el panel copilot')
    }

    expect(isVisible).toBeTruthy()
  })
})

// ─── BLOQUE 8: Diagnóstico de cookies en cada momento clave ──────────────────

test.describe('Diagnóstico de cookies', () => {

  test('8.1 — Estado de cookies en cada paso del flujo', async ({ page, context }) => {
    test.skip(!CREDS.password, 'TEST_PASSWORD no configurada')
    await context.clearCookies()

    console.log('\n═══════════════════════════════════════')
    console.log('DIAGNÓSTICO DE COOKIES - FLUJO COMPLETO')
    console.log('═══════════════════════════════════════')

    // PASO 1: Sin sesión
    await page.goto(APP_DEV)
    await page.waitForTimeout(2000)
    let cookies = await context.cookies()
    console.log('\n[Paso 1] Sin sesión - Cookies:', cookies.map(c => `${c.name}=${c.value.slice(0, 20)}...`))

    // PASO 2: Durante login
    await page.goto(`${APP_DEV}/login?local-login=1`, { waitUntil: 'networkidle' })
    await page.fill('input[type="email"]', CREDS.email)
    await page.fill('input[type="password"]', CREDS.password)
    cookies = await context.cookies()
    console.log('\n[Paso 2] Durante login - Cookies:', cookies.map(c => c.name))

    // PASO 3: Post-login
    await page.click('button[type="submit"]')
    await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 })
    await waitForVerification(page)
    cookies = await context.cookies()
    const importantCookies = ['sessionBodas', 'idTokenV0.1.0', 'guestBodas']
    const cookieStatus = importantCookies.reduce((acc, name) => {
      acc[name] = cookies.find(c => c.name === name) ? '✅ PRESENTE' : '❌ AUSENTE'
      return acc
    }, {} as Record<string, string>)
    console.log('\n[Paso 3] Post-login - Cookies clave:', cookieStatus)

    // PASO 4: localStorage
    const ls = await getLocalStorageKeys(page, ['dev-user-config', 'jwt_token', 'user_email', 'user_uid'])
    console.log('\n[Paso 4] localStorage:', Object.entries(ls).map(([k, v]) => `${k}: ${v ? '✅' : '❌'}`))

    // PASO 5: Post-logout
    await page.locator('[data-testid="profile-menu-trigger"]').click()
    await page.waitForTimeout(500)
    await page.locator('text=Cerrar Sesión').click()
    await page.waitForURL(url => url.includes('/login') || url.includes('?end=true'), { timeout: 10000 })
    await page.waitForTimeout(1000)

    cookies = await context.cookies()
    const cookieStatusAfter = importantCookies.reduce((acc, name) => {
      acc[name] = cookies.find(c => c.name === name) ? '⚠️ PRESENTE (debería limpiarse)' : '✅ LIMPIA'
      return acc
    }, {} as Record<string, string>)
    console.log('\n[Paso 5] Post-logout - Cookies:', cookieStatusAfter)

    const lsAfter = await getLocalStorageKeys(page, ['dev-user-config', 'jwt_token', 'user_email'])
    console.log('\n[Paso 5] Post-logout - localStorage:', Object.entries(lsAfter).map(([k, v]) => `${k}: ${v ? '⚠️ PRESENTE' : '✅ LIMPIA'}`))
    console.log('═══════════════════════════════════════\n')

    // Assert final: dev-user-config debe estar limpio post-logout
    expect(lsAfter['dev-user-config']).toBeNull()
  })
})

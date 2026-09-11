from playwright.sync_api import sync_playwright
import os
import sys
import time

print("SMOKE TEST - Migracion MCP")
with sync_playwright() as p:
    browser = p.webkit.launch(headless=True)
    ctx = browser.new_context(ignore_https_errors=True)
    page = ctx.new_page()
    page.set_default_navigation_timeout(120000)

    email = os.getenv("TEST_EMAIL") or os.getenv("TEST_USER_EMAIL") or ""
    password = os.getenv("TEST_PASSWORD") or os.getenv("TEST_USER_PASSWORD") or ""
    if not email or not password:
        print("Faltan credenciales: TEST_EMAIL/TEST_PASSWORD o TEST_USER_EMAIL/TEST_USER_PASSWORD")
        sys.exit(2)

    # Login
    print("1. Login...")
    page.goto("http://localhost:3210/login", wait_until="domcontentloaded")
    page.wait_for_timeout(6000)
    page.locator('input[type="email"]').first.fill(email)
    page.locator('input[type="password"]').first.fill(password)
    page.get_by_role("button", name="Iniciar sesión").first.click()
    page.wait_for_timeout(15000)
    print(f"   URL: {page.url[:100]}")

    # App eventos
    print("2. Cargando eventos...")
    page.goto("http://localhost:3220/", wait_until="domcontentloaded")
    page.wait_for_timeout(10000)

    body = page.content()
    print(f"   HTML: {len(body)} chars")
    print(f"   'evento': {'SI' if 'evento' in body.lower() else 'NO'}")
    print(f"   'Invitados': {'SI' if 'Invitados' in body else 'NO'}")
    print(f"   'Mesas': {'SI' if 'Mesas' in body else 'NO'}")
    print(f"   'Presupuesto': {'SI' if 'Presupuesto' in body else 'NO'}")
    print(f"   'Servicios': {'SI' if 'Servicios' in body else 'NO'}")

    # Error banner?
    has_error = "No se pudieron cargar" in body or "error" in body.lower()
    print(f"   Banner error: {'SI' if has_error else 'NO'}")

    # Errores de pagina
    errs = []
    page.on("pageerror", lambda e: errs.append(e.message))
    page.wait_for_timeout(3000)
    gql_errs = [e for e in errs if "graphql" in e.lower()]
    print(f"   Errores GraphQL en pagina: {len(gql_errs)}")

    page.screenshot(path="smoke-app-eventos.png")
    print("\nScreenshots: smoke-app-eventos.png")
    browser.close()

# E2E: Preguntas y filtros (navegador)

Tests que simulan un usuario haciendo preguntas en el Copilot y comprueban los **filtros** (barra de filtro, navegación automática).

## Qué cubren

1. **Preguntas a todos los eventos**: listar eventos, cuántos tengo (sin evento concreto).
2. **Preguntas al evento "Raúl Isabel"**: seleccionar ese evento por nombre y preguntar por invitados, mesas, presupuesto, resumen.
3. **Filtros**: preguntas que deben activar `filter_view` (“quiero ver la mesa 1”, “muéstrame invitados confirmados”, etc.) y comprobar que aparece la barra de filtro y/o se navega a la sección correcta.

## Cómo ejecutar (en navegador para ver y confirmar)

**App-test (dominios):**
```bash
pnpm test:e2e:app:preguntas-filtros
```

**Local (app en 8080, chat en 3210):**  
Conviene tener la app ya levantada (`pnpm dev` en otra terminal) para evitar que Playwright arranque el servidor y aparezcan errores EMFILE (too many open files). Playwright reutiliza el servidor si 8080 está en uso.
```bash
pnpm test:e2e:app:preguntas-filtros:local
```

**Con otro nombre de evento:**
```bash
TEST_EVENT_NAME="Mi Boda" pnpm test:e2e:app:preguntas-filtros
```

Los tests se ejecutan en **modo headed** (se abre el navegador). Hay que revisar en pantalla:

- Que el login y la selección de evento funcionen.
- Que el Copilot responda a las preguntas.
- Que al pedir “ver la mesa X” o “invitados confirmados” aparezca la **barra de filtro** (texto tipo “Filtro: …” y botón ✕) y, si aplica, que la app navegue a `/mesas` o `/invitados`.

## Si el evento "Raúl Isabel" no existe

Los tests que usan ese evento hacen `test.skip()` y dejan un mensaje en consola. Crea un evento con ese nombre (o uno que contenga “Raúl” e “Isabel”) en la cuenta de prueba, o ejecuta con:

```bash
TEST_EVENT_NAME="Nombre de tu evento" pnpm test:e2e:app:preguntas-filtros
```

## Credenciales

Por defecto usan **`e2e-app/fixtures.ts`**:
- **Usuario:** `bodasdehoy.com@gmail.com` (o `TEST_USER_EMAIL`)
- **Clave:** `lorca2012M*+` (o `TEST_USER_PASSWORD`)

Para override:
```bash
TEST_USER_EMAIL=tu@email.com TEST_USER_PASSWORD=tupass pnpm test:e2e:app:preguntas-filtros
```

**Más detalle y otros tests E2E que funcionan:** ver **`docs/E2E-USUARIO-Y-TESTS-QUE-FUNCIONAN.md`**.

## Archivos

- **Spec:** `e2e-app/preguntas-filtros-usuario.spec.ts`
- **Helper:** `e2e-app/helpers.ts` → `loginAndSelectEventByName(page, email, password, baseUrl, eventName)`

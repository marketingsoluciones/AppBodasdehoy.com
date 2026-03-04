# Login automático en pruebas con navegador

**⚠️ CUIDADO: si haces muchos intentos de login o vas rápido, Firebase/Google pueden bloquear la cuenta.** Hay que hacerlo **muy despacio**: abres la pantalla de login, esperas, escribes carácter a carácter con pausa entre cada uno, y solo cuando todo esté listo das a Iniciar sesión.

**Flujo seguro recomendado:** el usuario hace el **login manual** en el navegador; cuando confirme aquí que ya está logueado, el agente solo usa la sesión ya abierta (Copilot, preguntas) sin tocar el formulario de login.

---

Cuando *sí* se automatice el login, hay que cumplir esto **sin saltarse pasos**:

## 1. Abrir la pantalla de login y esperar

- Navegar a `/login` y **no tocar nada** hasta que la página esté totalmente cargada.
- Esperar a que se vea el formulario (campos de email y contraseña visibles).
- **Esperar 20 segundos** después de que cargue, sin escribir ni hacer clic. Si no esperas, Firebase puede detectar bot y bloquear.

## 2. Escribir usuario y clave carácter a carácter (5 s entre cada carácter)

- **Usuario (email):** carácter a carácter, con **5 segundos entre cada tecla**. No rellenar el campo de golpe.
- **Contraseña:** igual, carácter a carácter, **5 segundos entre cada carácter**. Muy despacio para no bloquear la cuenta.
- En Playwright: `page.type(selector, text, { delay: 5000 })` (5000 ms por carácter).
- En Cursor MCP: escribir letra a letra con pausa de **5 s** entre cada una.

## 3. Enviar solo cuando todo esté escrito

- **Solo cuando** el usuario y la clave estén completos en los campos, hacer clic en Iniciar sesión / Enviar.
- No apretar Enviar antes de tiempo.

## Resumen

| Paso | Qué hacer |
|------|-----------|
| Cargar | Ir a `/login` y esperar a que se vea el formulario. |
| Espera inicial | **Esperar 20 segundos** sin tocar nada. |
| Email | Escribir **carácter a carácter, 5 s entre cada tecla**. |
| Clave | Escribir **carácter a carácter, 5 s entre cada tecla**. |
| Enviar | Solo cuando todos los caracteres estén listos, clic en Iniciar sesión. |

Si aun así falla o Firebase bloquea, hacer el login manual y confirmar aquí cuando esté hecho.

**Recordatorio:** Si haces muchos logins o vas rápido, Firebase/Google **bloquean la cuenta**. Regla: abres login → esperas **20 s** → escribes **carácter a carácter con 5 s entre cada uno** → cuando todo esté listo, clic en Login. No automatizar el login de forma agresiva; en duda, que un humano haga el login y luego seguir con el resto de pruebas.

## Selectores del formulario (FormLogin)

- Email: `input[name="identifier"]` o `input[type="email"]`.
- Contraseña: `input[name="password"]`.

## Credenciales de prueba

No commitear credenciales. Usar variables de entorno o el archivo de configuración local que use el equipo (por ejemplo las que referencian los scripts en `scripts/`).

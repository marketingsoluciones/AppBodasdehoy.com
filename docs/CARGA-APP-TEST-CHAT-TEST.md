# Carga inicial – app-test y chat-test

## Dónde aparece "Cargando... Si ves esto, la app está respondiendo"

### app-test.bodasdehoy.com (appEventos)
- **Archivo:** `apps/appEventos/context/AuthContext.tsx`
- **Cuándo:** Mientras se verifica la sesión (Firebase + sessionCookie / API). Se muestra hasta que `verificationDone === true`.
- **Texto:** "Cargando..." + "Si ves esto, la app está respondiendo (máx. 1.5 s)" (el "máx. 1.5 s" es orientativo; en condiciones normales suele ser menos).
- **Cambio:** Timeout de seguridad de **8 s**: si a los 8 segundos la verificación no ha terminado, se fuerza `verificationDone = true` para no dejar la app en carga infinita (p. ej. si la API no responde).

### chat-test.bodasdehoy.com (chat-ia)
- **Archivo:** `apps/chat-ia/src/app/[variants]/loading/Client/Content.tsx`
- **Cuándo:** En las fases de carga inicial (Initializing, InitUser, GoToChat) antes de entrar al chat.
- **Texto:** "Cargando..." + desde esta revisión también **"Si ves esto, la app está respondiendo"** (mismo mensaje tranquilizador que en app-test, sin el "máx. 1.5 s").

## Resumen
- **app-test:** Pantalla de carga con mensaje tranquilizador + timeout 8 s para evitar carga infinita.
- **chat-test:** Pantalla de carga con el mismo mensaje tranquilizador; flujo de stages (Init, DB, etc.) sin timeout extra porque suele ser breve.

Si el usuario ve "Cargando..." más de unos segundos en app-test, tras 8 s verá la app de todas formas (aunque la sesión no se haya resuelto del todo). En chat-test, si se queda atascado, conviene revisar consola del navegador y que el backend esté respondiendo.

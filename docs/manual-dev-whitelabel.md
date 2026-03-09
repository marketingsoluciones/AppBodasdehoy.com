# Manual: Cambiar whitelabel en entorno de desarrollo

> Para el equipo de desarrollo de AppBodasdehoy.com

---

## ¿Qué es el whitelabel y por qué importa?

La plataforma sirve a **11 marcas distintas** (bodasdehoy, vivetuboda, champagne-events...) desde
un único despliegue en Vercel. La marca activa se detecta automáticamente por el dominio.

Cuando desarrollas en local o en un subdominio de test, el sistema no sabe qué marca quieres y cae
al valor por defecto (`bodasdehoy`). Esta guía explica cómo forzar la que necesites.

---

## Escenarios y solución para cada uno

### Escenario A — Trabajas en local (`localhost`)

**Situación:** Tienes el servidor arrancado en `localhost:8080` o `localhost:3210`.

**Solución:** Variable de entorno en `.env.local` (no se sube a git nunca).

**Pasos:**

1. Busca el archivo en `apps/web/.env.development.local.example` y cópialo:
   ```bash
   cp apps/web/.env.development.local.example apps/web/.env.development.local
   ```

2. Edita `apps/web/.env.development.local` y descomenta la última línea:
   ```
   NEXT_PUBLIC_DEV_WHITELABEL=vivetuboda
   ```
   Cambia `vivetuboda` por la marca que necesites probar (ver lista abajo).

3. Reinicia el servidor de desarrollo — **es obligatorio** (Next.js carga env vars al arrancar):
   ```bash
   pnpm --filter web dev
   ```

4. Listo. Mientras esa línea esté activa, el servidor siempre usará ese whitelabel,
   independientemente del hostname.

**Para cambiar de marca:** edita `.env.local`, cambia el valor, reinicia el servidor.

**Para desactivar** (volver a detección automática): comenta la línea con `#` y reinicia.

---

### Escenario B — Trabajas en un subdominio de test compartido

**Situación:** Accedes a la app desde `chat-test.bodasdehoy.com`, `app-test.bodasdehoy.com`
u otro subdominio similar que apunta mediante Cloudflare Tunnel a tu máquina local.

**La detección automática** en estos subdominios ya funciona: como el hostname incluye el nombre
del tenant (`bodasdehoy`), detecta `bodasdehoy` automáticamente.

Si necesitas probar **otro tenant diferente al del subdominio** (ej: probar `vivetuboda` desde
`chat-test.bodasdehoy.com`):

**Opción 1 — Variable de entorno** (igual que Escenario A):
```
# apps/web/.env.development.local
NEXT_PUBLIC_DEV_WHITELABEL=vivetuboda
```
→ Reiniciar el servidor. Válido para cualquier subdominio.

**Opción 2 — localStorage** (sin reinicio, útil para pruebas rápidas en el navegador):
Abre la consola del navegador y ejecuta:
```javascript
// Activar un whitelabel concreto:
localStorage.__dev_domain = 'vivetuboda'; location.reload()

// Desactivar (vuelve a detección automática):
localStorage.removeItem('__dev_domain'); location.reload()
```
> Este cambio dura hasta que lo elimines o borres el localStorage. No afecta a otros compañeros.

---

### Escenario C — Pre-producción con dominio real del tenant

**Situación:** Existe un entorno staging/pre-producción desplegado en el dominio real
del tenant: `vivetuboda.com`, `champagne-events.com.mx`, etc.

**No necesitas hacer nada.** La detección automática por hostname funciona perfectamente:
- `vivetuboda.com` → detecta `vivetuboda` ✓
- `champagne-events.com.mx` → detecta `champagne-events` ✓

El `NEXT_PUBLIC_DEV_WHITELABEL` en el servidor de pre-producción **no debe estar definido**
(Vercel tiene sus propias variables de entorno, y esta no se incluye en los deployments).

---

## Lista de marcas disponibles

| Valor para la variable | Marca |
|---|---|
| `bodasdehoy` | Bodas de Hoy (España) |
| `eventosplanificador` | Eventos Planificador |
| `eventosorganizador` | Eventos Organizador |
| `vivetuboda` | Vive Tu Boda (México) |
| `champagne-events` | Champagne Events |
| `annloevents` | Annlo Events |
| `miamorcitocorazon` | Mi Amorcito Corazón |
| `eventosintegrados` | Eventos Integrados |
| `ohmaratilano` | Oh Mara Tilano |
| `corporativozr` | Corporativo ZR |
| `theweddingplanner` | The Wedding Planner |

---

## Preguntas frecuentes

**¿El `.env.local` se sube al repositorio?**
No. Git lo ignora automáticamente (está en `.gitignore`). Cada desarrollador tiene el suyo propio.

**¿Afecta a producción?**
No. Vercel no usa `.env.local`; usa las variables configuradas en su dashboard. Esta variable
no está definida allí, por lo que en producción la detección siempre es automática por dominio.

**¿Necesito reiniciar el servidor al cambiar la variable?**
Sí, siempre que cambies `.env.local`. Si no quieres reiniciar, usa la opción de `localStorage`
del Escenario B.

**¿Qué pasa si pongo un valor que no existe en la lista?**
La variable se ignora y el sistema cae al valor por defecto (`bodasdehoy`).

**Estoy en `chat-test.bodasdehoy.com` pero quiero probar `vivetuboda`. ¿Funciona el login?**
El login de Firebase necesita el proyecto Firebase de `vivetuboda`. Debes tener sesión activa
en ese tenant. Habla con el administrador del proyecto para obtener credenciales de prueba de
cada tenant que necesites probar.

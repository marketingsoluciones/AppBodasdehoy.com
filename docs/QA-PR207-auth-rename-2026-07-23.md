# QA — dev (PR #207): rename + fix móvil + FIX RAÍZ AUTH + des-mocking + Cowork

- **Fecha:** 2026-07-23
- **Entorno:** `chat-dev.bodasdehoy.com` + `app-dev.bodasdehoy.com`
- **Build chat-dev:** `w10tocPv67TAFwhIMlAlZ` (= dev `f04c87ba`, PR #207 mergeado)

## Contexto

Se mergeó a dev un lote grande:
1. **Rename** `/chat`→`/asistente` y `/messages`→`/bandeja`.
2. **FIX RAÍZ de auth** (`isSignedIn`) que arregla que usuarios **LOGUEADOS aparecían como "Visitante"**.
3. **Fixes de móvil** (flecha back + pestaña Bandeja + `/agentes` nav).
4. **Des-mocking** de billing por día + contador "Pendientes IA".
5. **Cowork** toggle activo/pausado per-agente.

## Entorno y reglas

- Navegador: **WebKit / Safari**. Móvil: **Safari iOS real** o modo responsive.
- **SIEMPRE en incógnito** (hay Service Worker que cachea builds viejos).
- Probar con **2 cuentas**: una **CON SALDO** y una **FREE/prepago**.
- Reportar por caso: esperado vs real, captura, URL, cuenta usada, y cualquier
  error de consola (con `trace_id` si aparece).

---

## 🔴 BATERÍA 1 — FIX DE AUTH (P0 · lo más importante del lote)

| # | Paso | Esperado |
|---|---|---|
| A1 | Login normal (email+contraseña) en `chat-dev/login` | Entra al asistente. Cabecera/sidebar muestra **TU usuario** (nombre/avatar/inicial), **NO "Visitante"** ni "Iniciar sesión". |
| A2 | Ir a `/bandeja` estando logueado | Se ven conversaciones/inbox **Y la cabecera sigue siendo TU usuario** (NO "Visitante"). *(Antes: datos reales pero cabecera "Visitante" — bug P0.)* |
| A3 | Recargar (Ctrl+R / pull-to-refresh) logueado | Sigue mostrando tu usuario (no parpadea a Visitante y se queda). |
| A4 | SSO desde appEventos: abrir el Copilot / "abrir completo" desde app-dev | Al llegar a chat-dev ya estás logueado, cabecera con tu usuario. |
| A5 | Logout | Vuelve a `/login`, y AHORA sí aparece "Visitante"/"Iniciar sesión". |
| A6 | Repetir A1–A5 con la **CUENTA FREE** | Mismo comportamiento (logueado = tu usuario, no Visitante), aunque haya gates de saldo agotado. |

**✗ REPORTAR** si en cualquier caso sale "Visitante" estando logueado, o si el login se rompe (no entra).

## 🔴 BATERÍA 2 — MÓVIL (P0 · era el bug del usuario)

| # | Paso | Esperado |
|---|---|---|
| M1 | chat-dev en móvil (incógnito), logueado | Aterrizas en el Asistente. |
| M2 | Pulsar la flecha "‹" arriba-izquierda | Va a la LISTA + **APARECE barra inferior**: Asistente · Bandeja · Yo. **FALLO** si la flecha no hace nada o no aparece la barra. |
| M3 | Tocar "Bandeja" | Se ven las conversaciones + badge de no-leídos. |
| M4 | Pestaña "Bandeja" logueado | DEBE aparecer (antes se ocultaba a usuarios Bodas). |
| M5 | Entrar a `/agentes` en móvil | También sale la barra inferior. |

## 🟠 BATERÍA 3 — RENAME (R1)

| # | Paso | Esperado |
|---|---|---|
| R1 | `/asistente` | carga (200) |
| R2 | `/bandeja` | carga (200) |
| R3 | `/chat` (viejo) | redirige a `/asistente` |
| R4 | `/messages` (viejo) | redirige a `/bandeja` |
| R5 | `/messages/whatsapp` | → `/bandeja/whatsapp` (conserva sub-ruta) |
| R6 | Raíz `/` | aterriza en el Asistente |
| R7 | Menús (móvil+desktop) | dicen "Asistente" y "Bandeja" — NO "Chat IA"/"Mensajes" |

## 🟠 BATERÍA 4 — COPILOT EMBEBIDO (appEventos) · CRÍTICO no romper

| # | Paso | Esperado |
|---|---|---|
| C1 | En app-dev, abrir evento + desplegar Copilot | carga (no blanco/404) |
| C2 | Escribir "Hola" | responde con normalidad |
| C3 | En Network, el iframe | carga `/bodasdehoy/asistente` (o redirige) sin 404 |
| C4 | Tools del Copilot (filtrar vista, contexto de evento) | siguen OK |

## 🟡 BATERÍA 5 — DES-MOCKING + COWORK

| # | Paso | Esperado |
|---|---|---|
| D1 | Bandeja: chip "Pendientes IA" | número REAL (si la cuenta tiene borradores IA pendientes), no siempre 0. Al filtrar, la lista se acota. |
| D2 | Admin › Billing: sección "por día" | desglose diario (fechas/coste), no vacío si la cuenta tiene consumo. Chart vacío en cuenta sin datos = esperado. |
| D3 | `/agentes`: toggle Activo/Pausado | persiste tras recargar (backend PATCH `/chat/sessions`). Los "canales" siguen mock (pendiente api-ia). |

## 🟢 BATERÍA 6 — REGRESIÓN

| # | Paso | Esperado |
|---|---|---|
| G1 | Login normal | entra sin error |
| G2 | Abrir conversación WhatsApp | hilo visible |
| G3 | Enviar mensaje/plantilla WhatsApp | llega |
| G4 | Cambiar de sesión/agente | OK |
| G5 | Campana de notificaciones | llegan + marcar leídas |
| G6 | Logout | `/login` limpio |
| G7 | Consola | 0 errores nuevos de "module not found"/404 de rutas/"Cannot read property". *(Los de Firebase securetoken son PRE-EXISTENTES, no de este lote.)* |

---

## Prioridad y reporte

- **P0:** Batería 1 (auth) y Batería 2 (móvil) — es lo que este lote arregla.
- **P0:** Batería 4 (Copilot embebido) — no debe romperse con el rename.
- Reportar cada fallo con **batería+caso** (ej. A2), esperado vs real, captura, cuenta.

> **Lo estrella es la Batería 1 (auth):** es el fix de raíz que arregla el "Visitante"
> logueado y, de rebote, el problema de móvil (misma causa `isSignedIn`).

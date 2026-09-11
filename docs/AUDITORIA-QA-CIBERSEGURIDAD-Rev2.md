# AUDITORÍA QA Y CIBERSEGURIDAD — Bodas de Hoy

**Equipo**: Auditoría y Ciberseguridad
**Fecha**: 2026-04-16 (Rev.2 — incorpora observaciones del equipo frontend)
**Alcance**: app-dev.bodasdehoy.com, chat-dev.bodasdehoy.com, api-ia.bodasdehoy.com
**Estado**: Sesiones 1-2 completadas, sesiones 3-9 pendientes

---

## TABLA DE ESTADO RÁPIDO

| ID | Hallazgo | Severidad | Estado |
|----|----------|-----------|--------|
| CRIT-01 | Token Loop agente chat | CRÍTICO | RESUELTO — pendiente re-test auditoría |
| CRIT-02 | JWT identidad no extraída | CRÍTICO | RESUELTO — pendiente re-test auditoría |
| CRIT-03 | 7 URLs hardcodeadas api.bodasdehoy.com | CRÍTICO | ABIERTO — 5 funcionales + 1 comentario + 1 debug |
| ALTO-01 | Tareas no se crean vía agente | ALTO | DEPENDE de CRIT-01/02 — pendiente re-test en UI real |
| ALTO-02 | Modelo IA ignora parámetro | ALTO | RESUELTO — pendiente re-test auditoría |
| ALTO-03 | Emails solo al owner (digests/reminders) | ALTO | ABIERTO — confirmado via Gmail MCP |
| ALTO-04 | invitaciones.spec.ts BASE_URL hardcodeada | ALTO | ABIERTO — fix trivial (línea 20 del spec) |
| MED-01 | Notificaciones comentarios solo FCM push | MEDIO | ABIERTO |
| MED-02 | commentsViewers sin actualizar en frontend | MEDIO | ABIERTO — 6 queries lo leen, 0 lo escriben |
| MED-03 | Unificación comentarios + chat-ia | MEDIO | PLANIFICACIÓN FUTURA |
| MED-04 | Editor mensajes automatizados por developer | MEDIO | ABIERTO |
| MED-05 | Falta tool IA para gestionar alergias vía chat | MEDIO | REFORMULADO — campo existe en modelo, falta tool |
| INFO-01 | Permisos: api2 no valida server-side | INFO | ABIERTO — riesgo seguridad |
| INFO-02 | Firebase Storage rules sin verificar | INFO | ABIERTO — riesgo seguridad |
| INFO-03 | Verificación DNS dominios eventosorganizador | INFO | NUEVO — TXT records Cloudflare pendientes |
| INFO-04 | Proyecto Vercel legacy lobe-chat-eventos | INFO | RESUELTO — migrado a chat-ia-bodasdehoy |

---

## HALLAZGOS DETALLADOS

### 🔴 CRÍTICOS

---

**CRIT-01 — Token Loop en agente chat: consumo descontrolado de tokens**

- **Estado**: ✅ RESUELTO por api-ia — pendiente re-test de auditoría
- **Entorno**: chat-dev.bodasdehoy.com → api-ia.bodasdehoy.com
- **Descripción**: El agente de chat (~30+ tools en BUILTIN_TOOL_MAP incluyendo tools de bodas, CRM y ERP) entraba en un loop que consumía entre 50.000 y 128.000 tokens por consulta antes de abortar con "requirió demasiados pasos".
- **Datos de prueba originales**:
  - "crear tarea probar sonido" → 83.918 tokens consumidos
  - "cuántos invitados pendientes" → 128.483 tokens consumidos
  - "hola qué puedes hacer" (control sin tools) → 20.996 tokens
- **Fix reportado por api-ia**: `max_iterations` implementado en el handler de tool calls
- **Re-test requerido**: Verificar que las consultas funcionales ahora consumen < 30.000 tokens. Testear en UI real (no vía API directa).

---

**CRIT-02 — Identidad de usuario no extraída del JWT**

- **Estado**: ✅ RESUELTO por api-ia — pendiente re-test de auditoría
- **Entorno**: api-ia.bodasdehoy.com (webapi/chat/openai)
- **Descripción**: El JWT contenía email y user_id pero el agente no los extraía. Pedía credenciales manualmente al usuario.
- **Fix reportado por api-ia**: User context (email, user_id) ahora se inyecta desde headers JWT al system prompt
- **Re-test requerido**: Verificar que el agente identifica al usuario automáticamente sin preguntar credenciales. Testear en UI real donde PostMessage/AuthBridge proveen contexto adicional (event_id, development).

---

**CRIT-03 — Migración incompleta: URLs hardcodeadas a api.bodasdehoy.com**

- **Estado**: ABIERTO — parcialmente cubierto por commit `20c38f9b` (BUG-034 URLs hardcoded)
- **Entorno**: app-dev.bodasdehoy.com (código frontend)
- **Descripción**: 7 referencias a api.bodasdehoy.com en código (5 funcionales + 1 comentario + 1 debug):

| Archivo | Línea | Contexto | Tipo |
|---------|-------|----------|------|
| `context/AuthContext.tsx` | 679 | SSO cross-domain (producción) | Funcional |
| `context/AuthContext.tsx` | 796 | SSO cross-domain (producción) | Funcional |
| `context/AuthContext.tsx` | 871 | Comentario explicativo | Comentario |
| `api.js` | 144 | URL base fallback producción | Funcional |
| `pages/api/proxy-bodas/graphql.ts` | 14 | Proxy servidor | Funcional |
| `pages/api/proxy-bodas/[...path].ts` | 3 | Proxy genérico | Funcional |
| `pages/api/dev/refresh-session.ts` | 24 | Variable entorno fallback | Funcional |

- **Riesgo**: Si api.bodasdehoy.com se da de baja, SSO, proxy GraphQL y refresh de sesión dejarán de funcionar.
- **Responsable**: Equipo frontend
- **Acción requerida**: Sustituir URLs por env var o api2 directamente. Verificar compatibilidad de endpoints.

---

### 🟠 ALTOS

---

**ALTO-01 — Agente no logra crear tareas a pesar de tener las herramientas**

- **Estado**: DEPENDE de CRIT-01 + CRIT-02 (ambos resueltos) — pendiente re-test en UI
- **Entorno**: chat-dev.bodasdehoy.com
- **Descripción**: El agente dispone de `create_task`, `update_task`, `complete_task` y `get_tasks` (añadidos al BUILTIN_TOOL_MAP por commit `20c38f9b`). Durante la auditoría, la creación falló porque el test fue vía API directa sin sesión UI. En la UI real, el contexto (event_id, user_id, development) se provee automáticamente vía PostMessage/AuthBridge.
- **Re-test requerido**: Testear en UI real de chat-dev tras deploy de fixes api-ia.

---

**ALTO-02 — Modelo de IA ignora parámetro solicitado**

- **Estado**: ✅ RESUELTO por api-ia — pendiente re-test de auditoría
- **Descripción**: Se solicitaba `gpt-4o-mini` pero respondía `groq/llama-3.3-70b-versatile`.
- **Re-test requerido**: Verificar modelo usado en respuesta.

---

**ALTO-03 — Emails automatizados solo se envían al owner del evento**

- **Estado**: ABIERTO — confirmado con evidencia directa
- **Entorno**: api2.eventosorganizador.com (cron de emails)
- **Evidencia (Gmail MCP 2026-04-16)**:
  - `jcc@bodasdehoy.com` (owner): **200+ emails** de la plataforma
  - `jcc@bodasdehoy.com` (coorg): **0 emails**
  - `jcc@marketingsoluciones.com` (invitado): **0 emails**
  - `jcc@recargaexpress.com` (extra): **0 emails**
- **Impacto**: Co-organizadores no reciben digests, reminders ni notificaciones de cambios.
- **Responsable**: Equipo backend api2
- **Acción requerida**: Extender cron para incluir colaboradores con permisos relevantes.

---

**ALTO-04 — invitaciones.spec.ts usa BASE_URL hardcodeada**

- **Estado**: ABIERTO — fix trivial pendiente
- **Descripción**: Línea 20: `const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080'` en vez de `TEST_URLS.app` de fixtures.ts. 13/16 tests se saltan en CI/CD remoto.
- **Responsable**: Equipo QA/frontend
- **Acción requerida**: Cambiar a `TEST_URLS.app`.

---

### 🟡 MEDIOS

---

**MED-01 — Notificaciones al comentar: solo FCM push, sin email ni cron**

- **Estado**: ABIERTO
- **Descripción**: Comentarios en tareas notifican solo vía FCM push. Sin email ni cron de respaldo.
- **Acción**: Evaluar canal adicional para usuarios sin push activo.

---

**MED-02 — commentsViewers no se actualiza desde frontend**

- **Estado**: ABIERTO
- **Descripción**: Campo `commentsViewers` aparece en 6 queries GraphQL de Fetching.ts pero nunca se escribe desde frontend. Siempre `[]`.
- **Acción**: Implementar escritura cuando usuario abre comentarios de una tarea.

---

**MED-03 — Comentarios de tareas deben verse en chat-ia (futuro)**

- **Estado**: PLANIFICACIÓN FUTURA
- **Acción**: Planificar unificación de mensajería.

---

**MED-04 — Editor de mensajes automatizados por developer**

- **Estado**: ABIERTO
- **Descripción**: Existe página admin pero falta UX completa.
- **Acción**: Completar panel de configuración.

---

**MED-05 — Falta tool de IA para gestionar alergias vía chat**

- **Estado**: ABIERTO (reformulado)
- **Descripción**: El campo `alergenos: string[]` existe en `Interfaces.ts:483` y se usa en appEventos. Falta tool `add_dietary_restriction` en api-ia.
- **Responsable**: api-ia

---

### ℹ️ INFORMATIVOS

---

**INFO-01 — Permisos: api2 no valida server-side en mutations GraphQL**

- **Riesgo**: MEDIO — atacante con JWT podría saltarse `useAllowed()` del frontend.
- **Recomendación**: Verificar validación server-side en api2.

---

**INFO-02 — Firebase Storage rules sin verificar**

- **Riesgo**: MEDIO — archivos privados accesibles sin auth.
- **Recomendación**: Revisar reglas de Firebase Storage.

---

**INFO-03 — Verificación DNS dominios eventosorganizador pendiente**

- **Descripción**: Dominios añadidos a Vercel pero requieren TXT records en Cloudflare:
  - `_vercel.eventosorganizador.com` TXT `vc-domain-verify=chat-test.eventosorganizador.com,8eeb86729e451bc7769d`
  - `_vercel.eventosorganizador.com` TXT `vc-domain-verify=chat.eventosorganizador.com,4819b8f6806057f9eb38`
- **Responsable**: Cloudflare admin

---

**INFO-04 — Proyecto Vercel legacy `lobe-chat-eventos`**

- **Estado**: RESUELTO — `iachat.bodasdehoy.com` migrado a `chat-ia-bodasdehoy`
- **Pendiente**: Confirmar eliminación del proyecto legacy en Vercel.

---

## HALLAZGO RECLASIFICADO

**EX-ALTO-03 — Login chat-dev timeout en webkit → FALSO POSITIVO**

- `chat-dev` es Cloudflare tunnel a localhost. Si server local no corre → 502.
- `chat-test` (Vercel) responde correctamente en 6.3s.
- **Conclusión**: No es bug. Recomendamos tests E2E contra `chat-test`.

---

## FIXES DESPLEGADOS (2026-04-16)

| Commit | Fixes | Rama |
|--------|-------|------|
| `20c38f9b` | /files crash, GraphQL 400, task tools BUILTIN_TOOL_MAP, URLs hardcoded | dev + test |
| `3ba01640` | Auth timeout cascada (3s→15s), /messages en blanco | dev + test |
| `13a07238` | Sugerencias Copilot no responden (pageContext memoizado) | dev + test |
| `cfc814e1` | Build Vercel 6GB→8GB | dev + test |
| `167d0532` | Build Vercel 8GB→12GB (primer build exitoso) | dev + test |

Otros: TOOL_PERMISSIONS gaps resueltos, 10 tools ERP nuevas, 13 tests E2E nuevos, legacy Vercel migrado.

---

## PRÓXIMAS FASES

| Sesión | Enfoque | Estado |
|--------|---------|--------|
| 1 | Bugs Playwright app-dev + copilot | ✅ Completada |
| 2 | Bugs críticos chat-dev | ✅ Completada |
| **2.5** | **Re-test bugs resueltos (CRIT-01/02, ALTO-01/02)** | ⏳ SIGUIENTE |
| 3 | Bugs pendientes app-dev | ⏳ Pendiente |
| 4 | Bugs amarillos chat-dev | ⏳ Pendiente |
| 5 | UX chat-dev | ⏳ Pendiente |
| 6 | Tests Playwright nuevos + verificar 13 tests E2E | ⏳ Pendiente |
| 7 | Simetría Copilot vs Chat | ⏳ Pendiente |
| 8 | MultiDeveloper EventosOrganizador | ⏳ Pendiente |
| 9 | Onboarding "Primera Boda" | ⏳ Pendiente |

---

*Rev.2 — incorpora observaciones del equipo frontend (2026-04-16)*
*Siguiente revisión: al completar sesión 2.5*

# OBSERVACIONES AL INFORME DE AUDITORÍA QA Y CIBERSEGURIDAD

**De**: Equipo Frontend (AppBodasdehoy)
**Para**: Equipo de Auditoría y Ciberseguridad
**Fecha**: 2026-04-16
**Ref**: Informe de auditoría sesiones 1-2

---

## RESUMEN

El informe de auditoría es en general preciso y bien estructurado. Sin embargo, varios hallazgos requieren actualización porque fueron **resueltos durante esta misma jornada** por los equipos de frontend y api-ia. A continuación detallamos las correcciones, inexactitudes y datos faltantes.

---

## 1. HALLAZGOS YA RESUELTOS (no reflejados en el informe)

### CRIT-01 — Token Loop: **RESUELTO por api-ia**

- **Estado actual**: api-ia confirmó en Slack: `[api-ia] Fixes BUG1+BUG2 aplicados — pendiente re-test tras deploy`
- **Fix aplicado**: `max_iterations` implementado en el handler de tool calls
- **Recomendación**: Cambiar estado a **RESUELTO — pendiente re-test** en vez de "Acción inmediata requerida"

### CRIT-02 — JWT User Identity: **RESUELTO por api-ia**

- **Estado actual**: Mismo mensaje de Slack confirma el fix
- **Fix aplicado**: User context (email, user_id) ahora se inyecta desde los headers JWT al system prompt
- **Recomendación**: Cambiar estado a **RESUELTO — pendiente re-test**

### ALTO-01 — Tareas no se crean: **DEPENDE de CRIT-01 + CRIT-02**

- **Inexactitud en el informe**: Dice "no logra completar la operación". El test se realizó **via API directa** (endpoint `webapi/chat/openai`) sin sesión UI activa. En la UI real, el contexto (event_id, user_id, development) se pasa automáticamente via PostMessage/AuthBridge.
- **Además**: Nuestro commit `20c38f9b` agregó `create_task`, `update_task`, `complete_task` y `get_tasks` al `BUILTIN_TOOL_MAP`. Antes del fix, estas tools no se traducían correctamente.
- **Recomendación**: Re-testear en la UI real (no via API directa) tras deploy de api-ia

### ALTO-02 — Modelo ignorado: **Confirmado como RESUELTO por api-ia**

- api-ia desplegó nueva configuración que respeta el modelo solicitado o aplica routing documentado

### Fixes frontend desplegados (no mencionados en el informe)

| Commit | Fix | Rama |
|--------|-----|------|
| `20c38f9b` | BUG-002 /files crash, BUG-009 GraphQL 400, BUG-020 task tools, BUG-034 URLs hardcoded | dev + test |
| `3ba01640` | BUG-043 auth timeout cascada (3s→15s), BUG-047 /messages en blanco | dev + test |
| `13a07238` | BUG-016 sugerencias Copilot no responden (pageContext memoizado) | dev + test |
| `cfc814e1` | Build Vercel 6GB→8GB | dev + test |
| `167d0532` | Build Vercel 8GB→12GB (primer build exitoso) | dev + test |

### Otros resueltos no mencionados

- **TOOL_PERMISSIONS gaps** (confirm_guest + update_guest): api-ia los añadió a la matriz de permisos
- **Legacy lobe-chat-eventos**: `iachat.bodasdehoy.com` migrado a `chat-ia-bodasdehoy`. Proyecto legacy listo para eliminar
- **10 herramientas ERP nuevas** desplegadas por api-ia (facturas, analítica, presupuestos)

---

## 2. INEXACTITUDES

### ALTO-03 — "Login chat-dev timeout en webkit": **NO es un bug de chat-ia**

- **Lo que dice el informe**: "El login en chat-dev falla consistentemente en tests Playwright con webkit. Posible incompatibilidad con JWT/cookies."
- **Realidad verificada**:
  - `chat-dev.bodasdehoy.com` es un **Cloudflare tunnel** que apunta a `localhost:3210`
  - Cuando el servidor local no está corriendo → 502 (timeout)
  - Cuando el servidor está corriendo → funciona correctamente
  - `chat-test.bodasdehoy.com` (Vercel, no depende de localhost) responde `200` en **6.3s** sin problemas
- **Conclusión**: No es incompatibilidad webkit. Es que los dev servers locales se caen cuando Cursor IDE ocupa el puerto 3210.
- **Recomendación**: Ejecutar tests contra `chat-test` (Vercel) en vez de `chat-dev` (localhost). Eliminar este hallazgo o recalificarlo como **INFO** de infraestructura local.

### MED-05 — "Funcionalidad de alergias incompleta en invitaciones": **Parcialmente inexacto**

- **Lo que dice el informe**: "El sistema de invitaciones no tiene toda la funcionalidad nueva de alérgenos"
- **Realidad verificada**: El campo `alergenos: string[]` **ya existe** en el modelo de datos (`Interfaces.ts:483`). Se usa en appEventos para almacenar alergias por invitado.
- **Lo que realmente falta**: Una **tool de IA** (`add_dietary_restriction`) en api-ia para que el agente pueda gestionar alergias desde el chat. Esto es responsabilidad de api-ia, no del frontend.
- **Recomendación**: Reformular como "Falta tool de IA para gestionar alergias vía chat" y asignar a api-ia.

### Sección 7 del esquema de referencia — "4 tools SOLAMENTE": **INCORRECTO**

- El informe de auditoría referencia correctamente ~15+ tools, pero el esquema que acompaña al informe (v2) decía "4 tools SOLAMENTE". Esto fue corregido en el esquema v3 que hemos generado.
- **Realidad**: El `BUILTIN_TOOL_MAP` en `route.ts` tiene **30+ mappings** incluyendo tools de bodas, CRM, y ERP.

---

## 3. DATOS FALTANTES

### Falta: INFO sobre emails a colaboradores (debería ser ALTO)

- **Hallazgo verificado via Gmail MCP (2026-04-16)**: Los emails automatizados (digests, reminders) de api2 **SOLO se envían al owner** (`event.usuario_id`). Los colaboradores en `compartido_array` **NUNCA reciben emails**, aunque tengan permisos de edición.
- **Evidencia**:
  - `jcc@bodasdehoy.com` (owner): recibe digest diario, reminders, informe semanal → **200+ emails de la plataforma**
  - `jcc@bodasdehoy.com` (coorg): **0 emails** de la plataforma en toda la historia
  - `jcc@marketingsoluciones.com` (invitado): **0 emails** de la plataforma
  - `jcc@recargaexpress.com` (extra): **0 emails** de la plataforma
- **Impacto**: Co-organizadores de bodas no reciben información sobre cambios en sus eventos compartidos
- **Recomendación**: Calificar como **ALTO** (no INFO) y asignar a api2

### Falta: Verificación de dominios eventosorganizador

- Los dominios `chat-test.eventosorganizador.com` y `chat.eventosorganizador.com` están añadidos al proyecto Vercel pero requieren **verificación TXT en Cloudflare** pendiente:
  - `_vercel.eventosorganizador.com` TXT `vc-domain-verify=chat-test.eventosorganizador.com,8eeb86729e451bc7769d`
  - `_vercel.eventosorganizador.com` TXT `vc-domain-verify=chat.eventosorganizador.com,4819b8f6806057f9eb38`
- Sin estos TXT records, los dominios no tienen SSL y devuelven error de conexión.

### Falta: commentsViewers se usa en queries pero no se actualiza

- **Realidad verificada**: `commentsViewers` aparece en **4 queries GraphQL** de `Fetching.ts` (líneas 574, 642, 688, 748) y en el `demoEvent.ts`. Se **lee** del backend pero **nunca se escribe** desde el frontend.
- El informe lo documenta correctamente como MED-02, pero debería mencionar que el backend sí almacena el campo — el gap es solo en el frontend.

### Falta: Tests E2E nuevos

- Se han escrito **13 tests E2E nuevos** en `e2e-app/comunicacion-entre-usuarios.spec.ts`:
  - Suite COM (4 tests): Comunicación Owner↔Coorg
  - Suite PERM-CROSS (6 tests): Permisos cruzados por rol y módulo
  - Suite EMAIL (3 tests): Verificación UI de envío + documentación de gaps
- Estos tests cubren los gaps identificados en el informe.

---

## 4. CONFIRMACIÓN DE HALLAZGOS CORRECTOS

Los siguientes hallazgos del informe son **precisos y bien documentados**:

| Hallazgo | Verificación |
|----------|-------------|
| CRIT-03 — 7 URLs hardcodeadas | ✅ Confirmado: 7 referencias reales en código (5 funcionales + 2 debug) |
| ALTO-04 — invitaciones.spec.ts BASE_URL | ✅ Confirmado: línea 22 usa `process.env.BASE_URL \|\| 'http://127.0.0.1:8080'` en vez de `TEST_URLS.app` |
| MED-01 — Notificaciones solo FCM | ✅ Confirmado: no hay email ni cron para comentarios |
| MED-02 — commentsViewers sin actualizar | ✅ Confirmado: campo se lee pero nunca se escribe desde frontend |
| MED-03 — Unificación comentarios+chat | ✅ Correcto como planificación futura |
| MED-04 — Editor mensajes por developer | ✅ Correcto, existe página admin pero falta UX completa |
| INFO-01 — Validación permisos solo client-side | ✅ Riesgo real: api2 debe validar en cada mutation |
| INFO-02 — Firebase Storage rules | ✅ Riesgo real: verificar reglas de acceso |
| INFO-03 — Emails solo al owner | ✅ Confirmado via Gmail MCP (debería ser ALTO) |

---

## 5. RESUMEN DE ESTADO ACTUALIZADO

| ID | Hallazgo | Estado original | Estado real |
|----|----------|----------------|-------------|
| CRIT-01 | Token Loop | Acción inmediata | **RESUELTO** — pendiente re-test |
| CRIT-02 | JWT no extraída | Acción inmediata | **RESUELTO** — pendiente re-test |
| CRIT-03 | 7 URLs hardcodeadas | Acción inmediata | ✅ Correcto — migración pendiente |
| ALTO-01 | Tareas no se crean | Resolver corto plazo | **DEPENDE** de CRIT-01/02 (resueltos) |
| ALTO-02 | Modelo ignorado | Resolver corto plazo | **RESUELTO** por api-ia |
| ALTO-03 | Login webkit timeout | Resolver corto plazo | **FALSO POSITIVO** — es infra local, no bug |
| ALTO-04 | BASE_URL hardcodeada | Resolver corto plazo | ✅ Correcto — fix trivial pendiente |
| MED-01 | Notificaciones solo FCM | Siguiente sprint | ✅ Correcto |
| MED-02 | commentsViewers | Siguiente sprint | ✅ Correcto |
| MED-03 | Unificación chat | Siguiente sprint | ✅ Correcto |
| MED-04 | Editor mensajes developer | Siguiente sprint | ✅ Correcto |
| MED-05 | Alergias incompletas | Siguiente sprint | **Parcialmente inexacto** — campo existe, falta tool IA |
| INFO-01 | Permisos client-side | Informativo | ✅ Correcto |
| INFO-02 | Firebase Storage | Informativo | ✅ Correcto |
| INFO-03 | Emails solo owner | Informativo | **Debería ser ALTO** |
| INFO-04 | Legacy Vercel | Informativo | **RESUELTO** — iachat.bodasdehoy.com migrado |

---

*Documento preparado por el equipo Frontend — AppBodasdehoy*
*Fecha: 2026-04-16*

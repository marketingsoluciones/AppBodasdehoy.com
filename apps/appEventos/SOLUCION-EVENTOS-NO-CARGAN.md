# Solución: Eventos No Cargan Después de Migración Monorepo

**Fecha:** 11 de Febrero de 2026
**Problema:** Después de migrar al monorepo, login funciona pero los eventos no cargan

---

## 🔍 Análisis del Problema

### Síntoma
- ✅ Login exitoso (idToken cookie establecida)
- ❌ Eventos no cargan (lista vacía)
- ❌ Error 400: `Cannot query field "queryenEvento" on type "Query"`
- ❌ Otros errores de campos inexistentes: `menus_array`, `invitados_array`, etc.

### Causa Raíz

Durante la migración del monorepo, se configuraron **incorrectamente** los endpoints de API:

1. **En `.env.local` (Desarrollo)**:
   ```bash
   # ❌ ANTES (INCORRECTO):
   NEXT_PUBLIC_BASE_URL=https://api3-mcp-graphql.eventosorganizador.com

   # ✅ AHORA (CORRECTO):
   NEXT_PUBLIC_BASE_URL=https://apiapp.bodasdehoy.com
   ```

2. **En `EventsGroupContext.tsx`**:
   ```typescript
   // ❌ CAMBIO INCORRECTO que hicimos:
   fetchApiBodas({  // Llama a api.bodasdehoy.com (API de Auth)
     query: queries.getEventsByID,
     ...
   })

   // ✅ CORRECTO (como era antes):
   fetchApiEventos({  // Llama a apiapp.bodasdehoy.com (API de Eventos)
     query: queries.getEventsByID,
     ...
   })
   ```

3. **En `Fetching.ts` query `getEventsByID`**:
   ```graphql
   # ❌ CAMBIO INCORRECTO:
   query {
     queryenUser(...) {  # API de auth/users

   # ✅ CORRECTO:
   query {
     queryenEvento(...) {  # API de eventos
   ```

---

## 🏗️ Arquitectura Correcta de APIs

AppBodasdehoy debe usar **3 APIs diferentes** para distintos propósitos:

| API | URL | Propósito | Variables de Entorno |
|-----|-----|-----------|---------------------|
| **API Eventos** | `https://apiapp.bodasdehoy.com` | Gestión de eventos, invitados, presupuestos, itinerarios | `NEXT_PUBLIC_BASE_URL` |
| **API Bodas** | `https://api.bodasdehoy.com` | Autenticación, usuarios, sesiones | `NEXT_PUBLIC_BASE_API_BODAS` |
| **API MCP GraphQL** | `https://api3-mcp-graphql.eventosorganizador.com/graphql` | Planes/suscripción (no es API de eventos) | `NEXT_PUBLIC_API_MCP_GRAPHQL_URL` |

### Queries Disponibles por API

#### apiapp.bodasdehoy.com (API Eventos)
```
✅ queryenEvento
✅ queryenEvento_id
✅ getPsTemplate
✅ updateActivity
✅ getAllEvents
✅ getPGuestEvent
```

#### api.bodasdehoy.com (API Bodas/Auth)
```
✅ queryenUser
✅ getUser
✅ getUsers
✅ auth (mutation)
✅ whatsappGetAllSessions
```

#### api3-mcp-graphql.eventosorganizador.com/graphql (MCP GraphQL)
```
⚠️ No usar como API de eventos (solo planes/suscripción)
✅ getEventos
✅ getEventosByUsuario
✅ getEventosCompartidos
```

---

## 🔧 Correcciones Aplicadas

### 1. Corregir `.env.local`

**Archivo:** `apps/web/.env.local`

```diff
- NEXT_PUBLIC_BASE_URL=https://api3-mcp-graphql.eventosorganizador.com
+ NEXT_PUBLIC_BASE_URL=https://apiapp.bodasdehoy.com
```

**Impacto:** Ahora todas las llamadas a `fetchApiEventos` van al API correcto de eventos.

### 2. Revertir Cambio en EventsGroupContext

**Archivo:** `apps/web/context/EventsGroupContext.tsx:116-124`

```diff
- // INCORRECTO: Usar ApiBodas para eventos
- fetchApiBodas({
+ // CORRECTO: Usar ApiEventos para eventos
+ fetchApiEventos({
    query: queries.getEventsByID,
-   variables: { variable: "usuario_id", valor: userIdToUse, development: config?.development },
-   development: config?.development
+   variables: { variable: "usuario_id", valor: userIdToUse, development: config?.development },
  })
```

**Impacto:** La carga de eventos usa la función correcta que llama a `apiapp.bodasdehoy.com`.

### 3. Restaurar Query GraphQL Correcto

**Archivo:** `apps/web/utils/Fetching.ts:1850-1851`

```diff
  getEventsByID: `query ($variable: String, $valor: String, $development: String!) {
-   queryenUser( variable:$variable, valor:$valor, development:$development){
+   queryenEvento( variable:$variable, valor:$valor, development:$development){
```

**Impacto:** El query usa el campo correcto que existe en la API de eventos.

### 4. Restaurar Campos Eliminados

**Archivo:** `apps/web/utils/Fetching.ts:2110-2182`

Restaurados los campos que fueron eliminados incorrectamente:
- ✅ `menus_array`
- ✅ `presupuesto_objeto` (con todos sus subcampos)
- ✅ `showChildrenGuest`

**Impacto:** El query completo ahora coincide con el schema de `apiapp.bodasdehoy.com`.

---

## 📋 Funciones y Sus APIs

### fetchApiEventos
- **Llama a:** `apiapp.bodasdehoy.com`
- **Variable:** `NEXT_PUBLIC_BASE_URL`
- **Usa proxy:** `/api/proxy/graphql` (en desarrollo)
- **Para:**
  - Cargar eventos del usuario (`queryenEvento`)
  - Gestionar invitados, presupuestos, itinerarios
  - Plantillas de plan de espacio (`getPsTemplate`)
  - Actividades de usuario (`updateActivity`)

### fetchApiBodas
- **Llama a:** `api.bodasdehoy.com`
- **Variable:** `NEXT_PUBLIC_BASE_API_BODAS`
- **Usa proxy:** `/api/proxy-bodas/graphql` (en desarrollo)
- **Para:**
  - Autenticación (`auth` mutation)
  - Datos de usuarios (`queryenUser`, `getUsers`)
  - Información de perfil
  - Sesiones de WhatsApp

### ❌ fetchApiViewConfig (Legacy)
- **NO SE USA** en ningún flujo actual
- **Se puede eliminar** según documentación en `api.js`

---

## ✅ Estado Final

### Configuración de Entorno
```bash
# apps/web/.env.local
NEXT_PUBLIC_BASE_URL=https://apiapp.bodasdehoy.com  # ✅ API Eventos
NEXT_PUBLIC_BASE_API_BODAS=https://api.bodasdehoy.com  # ✅ API Auth
```

### Flujo de Carga de Eventos
1. Usuario hace login → `fetchApiBodas` → `api.bodasdehoy.com` → mutation `auth`
2. App carga eventos → `fetchApiEventos` → `apiapp.bodasdehoy.com` → query `queryenEvento`
3. Eventos se muestran correctamente ✅

---

## 🧪 Cómo Probar

1. **Reiniciar servidor:**
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Acceder a app:**
   ```
   http://app-test.bodasdehoy.com:8080
   ```

3. **Hacer login con usuario de prueba**

4. **Verificar en consola del navegador:**
   ```
   [EventsGroup] Buscando eventos para usuario_id: <uid>
   [EventsGroup] ✅ Eventos obtenidos en XXXms, total: N
   ```

5. **Verificar en logs del servidor:**
   ```bash
   tail -f /tmp/apps-web.log | grep "API Proxy"

   # Debería mostrar:
   [API Proxy] Proxying request to: https://apiapp.bodasdehoy.com/graphql
   [API Proxy] Query: query ($variable: String, $valor: String, $development: String!) { queryenEvento(
   ```

---

## 📚 Referencias

- **Arquitectura APIs Backend:** `/ARQUITECTURA_APIS_BACKEND_2026-02-10.md`
- **Listado Llamadas MCP:** `/docs/LISTADO-LLAMADAS-MCP-AUDITORIA.md`
- **Informe APIs:** `/docs/INFORME_APIS_APPBODASDEHOY.md`

---

## ⚠️ Lecciones Aprendidas

1. **Nunca asumir que el schema cambió** - Primero verificar qué API estamos llamando
2. **Documentar claramente** el propósito de cada API y sus variables de entorno
3. **Mantener .env.local sincronizado** con .env.production en estructura (no valores)
4. **Probar después de cambios de configuración** - Los errores de API pueden parecer bugs del backend
5. **AppBodasdehoy NO debe usar API2** - Solo Copilot/LobeChat (y eventualmente migrar a api-ia)

---

## 🎯 Próximos Pasos

- [ ] Documentar otras queries faltantes: `getPsTemplate`, `updateActivity`
- [ ] Verificar que `.env.production.local` también usa `apiapp.bodasdehoy.com`
- [ ] Crear tests de integración para validar APIs correctas
- [ ] Auditar todos los usos de `fetchApiBodas` vs `fetchApiEventos`

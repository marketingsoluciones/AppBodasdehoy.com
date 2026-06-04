# 📩 PARA api-mcp — solicitud de COORD-AppEventos

> Pegar este bloque en el hilo Slack apropiado.
> Dos temas separados: (1) Cat C apiapp, (2) P0 conexión eventos.

---

## 1) Categoría C — implementar ops faltantes para apagar `apiapp.bodasdehoy.com`

```
DE: COORD-AppEventos
PARA: API-MCP
DRI: api_mcp_oncall
ASUNTO: Categoría C — 13+ ops faltantes (apagar apiapp)

═══════════════════════════════════════════════════════════
📊 CONTEXTO
═══════════════════════════════════════════════════════════

Sprint 1+2+3 cerrado 2026-05-17: 8/8 dominios del front migrados a api-mcp.
Queda apagar el droplet apiapp.bodasdehoy.com. Para ello necesitamos que
api-mcp implemente ops que apiapp tenía y vosotros no.

Front YA tiene adapter MCP_ADAPTERS (Fetching.ts:179) con fallback automático
a apiapp para estas ops, así que mientras no estén, no se rompe — solo no
podemos apagar el droplet legacy.


═══════════════════════════════════════════════════════════
🔴 PRIORIDAD ALTA — verificadas live (probe → "Cannot query field")
═══════════════════════════════════════════════════════════

Pagos boda (4 ops — pagos individuales dentro de una boda, NO Stripe SaaS)

  mutation nuevoPago(evento_id: ID!, gasto_id: ID!, pago: PagoInput!)
    → EventoResponse { success, errors, evento { _id, presupuesto_objeto } }

  mutation editPago(evento_id: ID!, gasto_id: ID!, pago_id: ID!, datos: JSON!)
    → EventoResponse

  mutation borraPago(evento_id: ID!, gasto_id: ID!, pago_id: ID!)
    → EventoResponse

  mutation deletepayment(...)
    Alias legacy. Posiblemente fundible con borraPago.

  Call-sites front: apps/appEventos/components/Presupuesto/BlockPagos/
                    TablaDatosPagos.tsx, SubComponentePagos.tsx,
                    FormAddPago.tsx, FormEditarPago.tsx

Directorio (2 ops)

  query getAllBusinesses(filter: BusinessFilter, pag: Pagination, dev: String)
    → { total: Int, results: [Business] }

  query getAllProducts(grupo: String, pag: Pagination, dev: String)
    → { total: Int, results: [Product], currency: String }

  Nota getAllProducts:
   - getAllProducts(grupo:"app") en facturacion.tsx es DEAD CODE (PlanesAPI2
     ya usa getSubscriptionPlans canonical). Lo eliminamos del front.
   - getAllProducts sin grupo se usa en VentasEntradas.tsx, EntradasGratis.tsx
     para tickets de eventos. ESA SÍ se necesita.

PDF / utilidades (2 ops)

  query generatePdf(template: String!, data: JSON!) → { url: String }
    Exportar invitaciones / itinerario a PDF.

  query getGeoInfo() → { ip: String, ipcountry: String, city: String, region: String }
    Detectar país del visitante (Currencies, idioma default).

Plan space (2 ops)

  query getPlanSpaceSelect() → [PlanSpaceTemplate]
    Dropdown selección de plan space al crear evento.

  query getPsTemplate(id: ID!) → PlanSpaceTemplate
    Template plan space (estructura de mesas predefinida).

Itinerario lectura (2 ops)

  query getItinerario(eventId: ID!) → Itinerario
    LECTURA. El write (crearItinerario / actualizar / eliminar) SÍ existe ya
    en api-mcp.

  mutation duplicateItinerario(eventoId: ID!, itinerarioId: ID!, datos: JSON!)
    → EventoResponse

Tareas (1 op)

  mutation updateTasksOrder(eventId: ID!, itinerarioId: ID!, taskIds: [ID!]!)
    → ItinerarioResponse


═══════════════════════════════════════════════════════════
🟡 POR VERIFICAR 1 A 1 (inferidas por keyword, pueden estar renombradas)
═══════════════════════════════════════════════════════════

Stripe wedding
  getInvoices()  — ¿el getInvoice(id) actual cubre el listado history?
  getCustomer()  — ¿getMySubscription cubre los campos name/line1/postal/city/country?

Emails templates
  getEmailTemplate(id), getPreviewsEmailTemplates(), getVariableEmailTemplate(),
  getGalerySvgs()

WhatsApp
  whatsappGetAllSessions(), createWhatsappTemplate(...)
  Nota: /api/whatsapp/messages/template ya usa ?development= query param
  (no header X-Development).

Compartir evento
  updateCompartition(eventId, userId, permisos)
  deleteCompartition(eventId, userId)
  getLinkInvitation(eventId)
  enviaInvitacion(eventId, emails[])
  (addCompartition ya existe verificado vía smoke)

Otros
  getEmailValid(email), getPreregister(uid)
  editPresupuesto, duplicatePresupuesto, nuevoItemGasto, editItemGasto,
  borraItemsGastos
  editEvento(guardarListaRegalos)
  createUserWithPassword(...)


═══════════════════════════════════════════════════════════
🎯 RESPUESTA QUE NECESITAMOS
═══════════════════════════════════════════════════════════

1. Plan + fecha para los 13 PRIORIDAD ALTA verificados.
2. Lista de renombramientos: ¿alguna de la sección "Por verificar" ya existe
   con otro nombre? Necesitamos saberlo para no duplicar implementación.
3. Stripe wedding vs Stripe SaaS (ERP/CRM): ¿dominios separados o
   intercambiables?
4. ¿Algún Cat C ya está en sprint y no lo sabemos?

DRI: api_mcp → responder en hilo Slack.

═══════════════════════════════════════════════════════════
⚠️ DEPENDENCIA — esto asume P0 conexión eventos RESUELTO
═══════════════════════════════════════════════════════════

Las mutations Cat C tocan la colección eventos. Si la conexión Mongo sigue
flapeando (P0 abierto desde 2026-05-28), las mutations heredan el problema.
Ver el otro mensaje (P0 conexión eventos).
```

---

## 2) P0 — Conexión MongoDB `eventos` INTERMITENTE

```
DE: COORD-AppEventos
PARA: API-MCP
DRI: api_mcp_oncall
ASUNTO: 🚨 P0 — Conexión MONGODB_DBEVENT_URI flapping (estado al 04-jun)

═══════════════════════════════════════════════════════════
📊 SÍNTOMA
═══════════════════════════════════════════════════════════

La conexión MONGODB_DBEVENT_URI → DB prueba1 → colección `eventos` en api-mcp
flapea (sube y baja). Verificado live:

  2026-05-27       🟢 OK    getEventosByUsuario → 158, getEventos → 228, estable
  2026-05-28 03:37 🔴 FAIL  8/8 queries → MongoNotConnectedError
  logs SSH         🔴 256 errores "MongoNotConnectedError: Client must be connected"

Afecta TODO eventos (reads + mutations) de forma intermitente. No es auth
(token válido pasa resolveDualAuth). Es gestión de conexión Mongoose que no
reconecta cuando se cae el socket.


═══════════════════════════════════════════════════════════
🎯 IMPACTO
═══════════════════════════════════════════════════════════

1. E2E inestables — un test pasa, 30s después falla "DB no conectada".
2. UX usuario — carga /mis-eventos y a veces ve lista vacía
   (query devuelve error que front trata como []).
3. Bloqueador Cat C — añadir nuevoPago/editPago heredarían el mismo
   problema. En mutations puede perder writes.
4. No podemos declarar Sprint 3 "100% migrado" mientras esto fluctúa.


═══════════════════════════════════════════════════════════
🐛 BUGS DERIVADOS (probablemente del mismo síntoma)
═══════════════════════════════════════════════════════════

✅ RESUELTO 2026-06-03/04: agregarInvitadosBatch (smoke COORD con JWT real OK)
✅ funciona: removerInvitadosBatch, borraMesa, borraMenu, borraPago, borraPlanSpace
🟡 pendiente: removerInvitado no-op
   Fix 1 línea en evento-mutations.resolver.ts:707 — filtra por .id en vez
   de ._id. Slack ts 1779920471.
🟡 pendiente: agregarInvitado sin _id cliente → doc orphan


═══════════════════════════════════════════════════════════
🔍 DIAGNÓSTICO SOLICITADO
═══════════════════════════════════════════════════════════

A) Estado actual

  SSH a api-mcp y:
    pm2 logs api-mcp | grep -E "MongoNotConnected|disconnected|reconnect" | tail -100

  ¿Cuántos errores en últimas 24h?
  ¿Cuándo fue el último?

B) Config Mongoose

  Esperado en código:
    mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      maxPoolSize: 50,
      minPoolSize: 5,
      retryWrites: true,
    });

    mongoose.connection.on('disconnected', () => { /* log + reconnect */ });

  Confirmad configuración actual.

C) Healthcheck real

  ¿/health verifica conexión Mongo de verdad (ping al admin db) o solo
  responde 200 sin tocar la BD?

  Ejemplo robusto:
    app.get('/health', async (req, res) => {
      try {
        await mongoose.connection.db.admin().ping();
        res.json({ ok: true, mongo: 'connected' });
      } catch (err) {
        res.status(503).json({ ok: false, error: err.message });
      }
    });


═══════════════════════════════════════════════════════════
💡 MITIGACIÓN PROPUESTA (mientras se arregla)
═══════════════════════════════════════════════════════════

(a) Middleware que verifique mongoose.connection.readyState === 1 antes de
    queries. Si !==1, intentar mongoose.connect() antes de continuar.

(b) PM2 health_check_grace_period apuntando a /health real. Si conexión
    muere, PM2 reinicia proceso (workaround, no fix).

(c) Alerta Slack si en 5min hay > 10 MongoNotConnectedError.


═══════════════════════════════════════════════════════════
🎯 PLAN VERIFICACIÓN TRAS FIX
═══════════════════════════════════════════════════════════

1. Backend aplica fix + redeploy.
2. Smoke desde COORD (10x getEventosByUsuario con pausa 30s, esperar 10/10 OK):

   curl -X POST https://api-mcp.eventosorganizador.com/graphql \
     -H "Authorization: Bearer $JWT" \
     -H "X-Development: bodasdehoy" \
     -H "Content-Type: application/json" \
     -d '{"query":"query{ getEventosByUsuario(uid:\"upSETrmXc7ZnsIhrjDjbHd7u2up1\", pag:{page:1,limit:10}, dev:\"bodasdehoy\"){ total results{ _id nombre } } }"}'

3. Batería Playwright E2E con datos reales. Esperar 0 MongoNotConnectedError
   durante el run.

4. Monitoreo 24h con alerta Slack. 0 incidentes en 24h → declarar P0 cerrado.


═══════════════════════════════════════════════════════════
🎯 RESPUESTA QUE NECESITAMOS
═══════════════════════════════════════════════════════════

1. Estado actualizado a 04-jun (último estado conocido es 2026-05-28).
2. ¿Fix aplicado? ¿Qué hace exactamente?
3. ¿Logs nuevos muestran reducción?
4. ¿Cuándo podemos esperar "conexión estable 24h"?

Mientras esto siga abierto, NO podemos avanzar Cat C y NO podemos certificar
migración Sprint 1+2+3 como funcional.

DRI: api_mcp → reporte estado en hilo Slack 1779939514 (escalación original).
```

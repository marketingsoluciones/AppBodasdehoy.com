# 📚 INFORME CONSOLIDADO — Migración cliente AppEventos → api-mcp

> **Fecha**: 2026-05-15 (actualizado)
> **Autor**: COORD-AppBodas (Claude Opus 4.7)
> **Objetivo**: dar al equipo api-mcp TODA la información para que cliente AppEventos deje de usar
> `apiapp.bodasdehoy.com` y `api.bodasdehoy.com` (backends viejos en desaparición) y use solo
> `api-mcp.eventosorganizador.com` + `api-ia.eventosorganizador.com` (canónicos).
>
> **Incluye**: análisis de gaps reales + Site Builder (editor webs boda) + Subscriptions/Stripe.

---

## 0. TL;DR

```
Cliente AppEventos envía:          98 ops únicas (105 alias en Fetching.ts)
api-mcp.eventosorganizador.com:   ~237 ops (PROD, queries + mutations)

DESGLOSE FINAL:
  ✅ Ya implementadas en api-mcp:           79 (80.6%)
  🔧 Cliente debe MIGRAR a schema nuevo:    3 (createCheckoutSession, getCheckoutItems, getAllProducts)
                                              → equivalente ya existe (subscribeToPlan, getInvoice, getSubscriptionPlans)
  ❌ Backend api-mcp debe IMPLEMENTAR:      16
     - 14 endpoints viejos sin equivalente (WhatsApp, FB media, EventTicket, Guests, etc.)
     - 2 nuevos identificados (updateBillingAddress + createStripeBillingPortalSession)

TIEMPO ESTIMADO:
  Backend api-mcp:    4-6 horas (16 endpoints + 3 fixes schema)
  Cliente AppEventos: 1 día (migrar 3 callsites + Site Builder integration)
```

---

## 1. Metodología

```
PASO 1 — Identificar todos los backends activos
  Comando: dig + curl + introspection HTTP
  Resultado: 4 backends GraphQL + 1 REST

PASO 2 — SSH a cada backend
  ✓ 137.184.148.28 (api-bodas)         → /root/api-bodas (api.bodasdehoy.com)
  ✓ 143.198.62.113 (api-v2/testapi2)   → /root/api-test (api-mcp TEST)
  ✓ 178.104.209.139 (api3-mcp-graphql) → /var/www/api-production (api-mcp PROD)
  ✓ 164.92.81.153 (api-ia-chat)        → API IA backend Python
  ✗ 45.55.44.46 (APP-GestionBodas)     → SSH cerrado por firewall DigitalOcean
                                          (= apiapp.bodasdehoy.com origin)

PASO 3 — Dump schemas
  - api.bodasdehoy:   typeDefs literales desde /root/api-bodas/db/schemas/*.js
  - apiapp:           introspection HTTP (introspection habilitada)
  - api-mcp PROD:     dump del código TS desde /var/www/api-production/dist-production
  - cliente:          regex sobre apps/appEventos/utils/Fetching.ts +
                      apps/appEventos/hooks/usePlanLimits.ts

PASO 4 — Análisis específico Site Builder + Subscriptions
  - Lectura packages/wedding-creator/src/
  - Lectura apps/appEventos/components/Facturacion/
  - Lectura apps/appEventos/hooks/usePlanLimits.ts
  - Cruce con módulos billing/subscription/stripe en api-mcp PROD
```

---

## 2. Infraestructura

### 2.1 Droplets DigitalOcean

```
Name                          IP                Rol                                Estado SSH
─────────────────────────────────────────────────────────────────────────────────────────
api-ia-chat                   164.92.81.153    API IA (chat, memories, leads)     ✓ accesible
api-v2-ts-graphql-mcp         143.198.62.113   api-mcp TEST                       ✓ accesible
API-DIRECTORIO-BODAS-DE-HOY   137.184.148.28   api.bodasdehoy.com (legacy)        ✓ accesible
APP-GestionBodas              45.55.44.46      apiapp.bodasdehoy.com (legacy)     ✗ firewall
[server api-mcp PROD]         178.104.209.139  api-mcp PROD (api3-mcp-graphql)    ✓ accesible
```

### 2.2 Dominios y mapping canónico

```
CANÓNICOS (deben quedar):
  api-mcp.eventosorganizador.com   → 143.198.62.113 + 178.104.209.139  (GraphQL)
  api-ia.eventosorganizador.com    → 164.92.81.153                    (REST)

LEGACY (deben desaparecer):
  api.bodasdehoy.com               → 137.184.148.28                  (GraphQL)
  apiapp.bodasdehoy.com            → 45.55.44.46                     (GraphQL)
  api-ia.bodasdehoy.com            → alias deprecado
  api3-ia.eventosorganizador.com   → URL muerta (DNS NXDOMAIN)
```

---

## 3. Cliente AppEventos — qué envía

```
Archivo principal:           apps/appEventos/utils/Fetching.ts
Hook subscriptions:          apps/appEventos/hooks/usePlanLimits.ts
Keys del objeto queries:     105 (algunas alias del mismo endpoint real)
Operaciones únicas:          98

Categorías principales:
  Eventos (crearEvento, editEvento, queryenEvento, ...)
  Invitados (creaInvitado, editInvitado, borraInvitados, ...)
  Mesas (createTable, editTable, deleteTable, createPsTemplate, ...)
  Presupuesto (nuevoCategoria, nuevoGasto, nuevoPago, editPresupuesto, ...)
  Itinerario/Tareas (createItinerario, createTask, ...)
  Notificaciones (createNotifications, getNotifications, ...)
  WhatsApp/Email templates
  Stripe/Billing  ← estado MIXTO (parte ya migrado, parte legacy)
  Compartir evento (addCompartition, ...)
  Auth (auth, createUser, ...)
```

---

## 4. Cruce exhaustivo cliente vs api-mcp

### 4.1 Ya implementadas en api-mcp (79 ops — orden alfabético)

```
addCompartition, addTaskAttachments, addWeddingPlannerIngreso, auth, borraCategoria,
borraGasto, borraInvitados, borraItemsGastos, borraMenu, borraMesa, borraPago,
borrarEvento, creaGrupo, creaInvitado, creaMenu, crearEvento, createElement,
createEmailTemplate, createGalerySvgs, createItinerario, createNotifications,
createPsTemplate, createTable, createTask, createUser, deleteCompartition,
deleteElement, deleteEmailTemplate, deleteTable, deleteTaskAttachment,
deleteWeddingPlannerIngreso, duplicateItinerario, duplicatePresupuesto,
editCategoria, editElement, editEvento, editGasto, editInvitado, editItemGasto,
editItinerario, editMesa, editPago, editPresupuesto, editTable, editTask,
editTotalStimatedGuests, editVisibleColumns, getEmailTemplate, getGalerySvgs,
getMySubscription, getNotifications, getPlanSpaceSelect, getPreregister,
getPreviewsEmailTemplates, getPsTemplate, getSubscriptionPlans, getUser, getUsers,
getVariablesTemplatesInvitaciones, nuevoCategoria, nuevoGasto, nuevoItemGasto,
nuevoPago, queryenEvento, queryenEvento_id, setPlanSpaceSelect, signOut,
singleUpload, status, subscribeToPlan, testInvitacion, updateActivity,
updateActivityLink, updateCompartition, updateEmailTemplate, updateNotifications,
updateUser, whatsappCreateSession, whatsappDisconnectSession, whatsappGetSession,
whatsappRegenerateQR, whatsappSendMessage
```

### 4.2 Cliente debe MIGRAR (3 ops — reemplazo ya existe en api-mcp)

```
SCHEMA VIEJO (cliente actual)            SCHEMA NUEVO (api-mcp ya tiene)
────────────────────────────────────     ──────────────────────────────────────────
createCheckoutSession(items, urls...)    subscribeToPlan(plan_id, billing_period,
                                                         success_url, cancel_url, metadata)
                                          → SubscribePlanCheckoutResponse

getCheckoutItems(unique: ID)             getInvoice(invoiceId: ID)
                                          o getSubscriptionBillingPeriods(...)

getAllProducts(grupo: String)            getSubscriptionPlans(development, is_public: true)
                                          + getSubscriptionPlan(plan_id)
```

**Acción**: cliente AppEventos refactoriza `apps/appEventos/components/Facturacion/Productos.tsx` y `HistorialFacturacion.tsx` para consumir el schema nuevo. Backend NO necesita implementar nada — solo el cliente migra.

### 4.3 Backend api-mcp debe IMPLEMENTAR (16 ops)

#### A. Mutations/queries del backend viejo SIN equivalente en api-mcp (14)

```
🎨 Templates/SVG (1):
   deleteGalerySvg(evento_id, icon_id)

🎫 EventTicket (1):
   getEventTicket(args: inputEventTicket, sort, skip, limit)

🏢 Directorio (2):
   getAllBusinesses(searchCriteria, sort, skip, limit, development!)
   (getAllProducts ya cubierto por getSubscriptionPlans)

👤 Auth/User (3):
   createUserWithPassword(email, password)
   getEmailValid(email)
   getVariableEmailTemplate(evento_id, template_id, selectVariable)

👥 Guests (1):
   getPGuestEvent(p: String)

📱 WhatsApp Templates (4):
   createWhatsappInvitationTemplate(evento_id, data)
   updateWhatsappInvitationTemplate(evento_id, template_id, data)
   deleteWhatsappInvitationTemplate(evento_id, template_id)
   getWhatsappInvitationTemplates(evento_id)

📱 Facebook Media (2):
   uploadMediaToFacebook(fileName!, fileBuffer!, fileType!, development)
   uploadBase64MediaToFacebook(base64Image!, fileName!, development)
```

#### B. Endpoints NUEVOS identificados en este análisis (2)

```
💳 Stripe (2):
   updateBillingAddress(input: BillingAddressInput!): BillingAddressResponse!
       → reemplazo de updateCustomer viejo
       → actualiza dirección facturación en Stripe + Mongo

   createStripeBillingPortalSession(returnUrl: String!): StripePortalSession!
       → self-service usuario (gestionar suscripción/tarjeta/facturas en Stripe)
       → internamente: stripe.billingPortal.sessions.create(...)
```

#### C. Fixes en schema existente (3 bugs reportados por el propio equipo)

```
PlanPricing            → AÑADIR field `currency: String!`
UserSubscription       → AÑADIR field `plan_name: String` (alias) o cliente lee `plan.name`
SubscriptionBilling    → AÑADIR field `current_period_end: Date`
```

---

## 5. ANÁLISIS LÍNEA 1 — Site Builder (editor de webs)

### 5.1 Lo que tiene HOY el cliente AppEventos (wedding-creator)

```
packages/wedding-creator/                ← package compartido
  src/wedding-site/
    WeddingSiteRenderer.tsx              ← RENDERER principal
    ThemeProvider.tsx                    ← paletas + fonts
    PublishModal.tsx                     ← publicar / subdominio
    sections/                            ← 7 BLOQUES wedding-específicos
      HeroSection      (con CountdownTimer)
      InfoSection      (info pareja)
      ScheduleSection  (cronograma evento)
      GallerySection   (galería fotos)
      LocationSection  (mapa + venue)
      RSVPSection      (confirmar asistencia)
      RegistrySection  (lista de regalos)
    styles/palettes.ts                   ← 6 paletas
                                          (romantic/elegant/modern/rustic/beach/classic)
    types.ts                             ← Palette/CoupleInfo/Wedding/Hero/Schedule/Venue
  hooks/useWeddingWeb.ts                 ← estado del editor

apps/editor-web/                          ← app standalone que monta el renderer
apps/chat-ia/.../wedding-creator/         ← misma feature dentro del chat IA
apps/appEventos/pages/mi-web-creador.tsx  ← redirige a Copilot wedding-creator

PERSISTENCIA ACTUAL: NO encontré queries GraphQL en Fetching.ts para wedding_webs
                     (probable: localStorage o endpoint REST aparte que no localicé)
```

### 5.2 Lo que propone backend api-mcp (Site Builder genérico)

```
Schema nuevo `sites` (NO modifica wedding_webs existente):

Mutations (8):
  createSite(input: CreateSiteInput!): SiteResponse!
  updateSite(siteId: ID!, input: UpdateSiteInput!): SiteResponse!
  addPage(siteId: ID!, input: PageInput!): PageResponse!
  updateSitePage(siteId: ID!, pageId: ID!, data: JSON!): PageResponse!
  deletePage(siteId: ID!, pageId: ID!): SiteResponse!
  publishSite(siteId: ID!, subdomain: String): SiteResponse!
  unpublishSite(siteId: ID!): SiteResponse!
  duplicatePage(siteId: ID!, pageId: ID!): PageResponse!

Queries (5):
  getSite(siteId: ID!): SiteResponse!                     # privada
  getSiteBySlug(slug: String!): SiteResponse!             # privada
  listMySites: [Site!]!                                   # privada
  getPublicSitePage(siteSlug, path): Page                 # PÚBLICA
  checkSubdomainAvailability(slug): Boolean!              # PÚBLICA

Storage: nueva colección Mongo `sites`
Page.data = JSON opaco (Block[] tree, cliente decide cómo interpretarlo)
```

### 5.3 Encaje AppEventos wedding-creator ↔ Site Builder

**SÍ encajan perfectamente — pero hay que entender el reparto**:

```
SITE BUILDER (api-mcp)                    WEDDING CREATOR (cliente AppEventos)
────────────────────                      ──────────────────────────────────
- Persiste estado (colección sites)       - Renderea blocks/sections
- CRUD pages                              - Define tipos de blocks
- Publish/unpublish + subdomain           - Aplica tema/paleta visual
- Page.data: JSON opaco                   - Interpreta Page.data como Block[] wedding
- Sirve getPublicSitePage al SSR público  - UI editor drag/drop
```

El cliente serializa los 7 blocks wedding como JSON en `Page.data` y persiste vía Site Builder.
Backend NO sabe ni le importa qué hay dentro de cada block. Si mañana hay sites de proveedores B2B,
el cliente cambia las sections renderizadas, backend no cambia.

### 5.4 Gaps identificados en propuesta Site Builder

**❌ Falta vínculo con `evento`**:
- Cliente AppEventos asocia el wedding-site con un `evento_id` (la boda específica).
- Sin FK al evento, no se puede saber qué wedding-site corresponde a qué evento.

```graphql
# AÑADIR al modelo Site:
type Site {
  _id: ID!
  slug: String!
  name: String!
  evento_id: ID                    # ← FK opcional al evento (wedding case)
  template: String                 # ← id de template usado
  palette: String                  # ← id paleta seleccionada (wedding case)
  pages: [Page!]!
  published: Boolean!
  publishedAt: Date
  whitelabel_id: ID!
  ...
}

# AÑADIR endpoints:
getSiteByEvento(eventoId: ID!): SiteResponse
linkSiteToEvent(siteId: ID!, eventoId: ID!): SiteResponse!
```

**❌ Falta templates precargados**:
- Sin templates el usuario crea un site vacío y debe añadir 7 secciones a mano.
- Templates wedding deberían venir precargados (romantic/elegant/modern/etc.).

```graphql
createSiteFromTemplate(templateId: String!, input: CreateSiteInput!): SiteResponse!
getSiteTemplates(category: String): [SiteTemplate!]!
```

**❌ Page.blockTypes para SEO/preview**:
- `Page.data` JSON opaco impide indexar/previsualizar sin parsear.

```graphql
type Page {
  ...
  data: JSON!
  blockTypes: [String!]   # ← ["hero", "info", "rsvp", "gallery", ...]
}
```

### 5.5 Decisiones a tomar

1. **¿`Site` apunta a `evento_id` como FK opcional?** Recomendado: SÍ.
2. **¿Templates precargados (createSiteFromTemplate + getSiteTemplates)?** Recomendado: SÍ.
3. **¿Migración wedding_webs legacy → sites?** Depende de cuántos hay en `wedding_webs` actual.

---

## 6. ANÁLISIS LÍNEA 2 — Subscriptions / Stripe (estado MIXTO en cliente)

### 6.1 Hallazgo crítico — cliente está a medias

El cliente AppEventos ya consume PARTE del schema nuevo + PARTE del schema viejo:

```
✅ YA USA SCHEMA NUEVO (api-mcp):
   apps/appEventos/hooks/usePlanLimits.ts:
     - getMySubscription { plan { name }, current_period_end, plan_id, status }
     - getSubscriptionPlans(development, is_public: true)

❌ AÚN USA SCHEMA VIEJO (api.bodasdehoy.com):
   apps/appEventos/utils/Fetching.ts:
     - updateCustomer(args: inputCustomer)        ← form facturación Stripe
     - createCheckoutSession(items, email, urls)  ← checkout viejo
     - getCheckoutItems(unique: ID)               ← items del checkout
     - getAllProducts(grupo: String)              ← listado productos viejo
```

**Conclusión**: NO es un problema de "schema con bugs", es **migración incompleta del cliente** +
**1 gap real de Stripe address que no tiene equivalente en api-mcp**.

### 6.2 Mapping schema viejo → nuevo

```
SCHEMA VIEJO (cliente actual)            SCHEMA NUEVO (api-mcp)              ACCIÓN
──────────────────────────────────────   ─────────────────────────────────   ──────────────
getAllProducts(grupo)                    getSubscriptionPlans(...is_public)  ✅ migrar cliente
                                          + getSubscriptionPlan(plan_id)

createCheckoutSession(items, urls...)    subscribeToPlan(plan_id, ...)       ✅ migrar cliente
                                          → SubscribePlanCheckoutResponse
                                          (devuelve URL Stripe Checkout)

getCheckoutItems(unique)                 getInvoice(invoiceId)               ✅ migrar cliente
                                          o getSubscriptionBillingPeriods

updateCustomer(args: inputCustomer)      ❌ NO HAY equivalente directo       🔴 GAP REAL
                                          → AÑADIR updateBillingAddress
```

### 6.3 Endpoints NUEVOS necesarios en api-mcp

```graphql
# 1) Reemplazo de updateCustomer (Stripe billing address)
mutation updateBillingAddress(input: BillingAddressInput!): BillingAddressResponse!

input BillingAddressInput {
  name: String
  email: String
  line1: String
  line2: String
  postalCode: String
  city: String
  country: String
}

type BillingAddressResponse {
  success: Boolean!
  customer: StripeCustomerInfo
  error: String
}

# Internamente:
# stripe.customers.update(stripeCustomerId, { name, email, address: {...} })


# 2) Stripe Customer Portal (self-service del usuario)
mutation createStripeBillingPortalSession(returnUrl: String!): StripePortalSession!

type StripePortalSession {
  url: String!           # URL al Stripe Customer Portal
  expiresAt: Int!
}

# Internamente:
# stripe.billingPortal.sessions.create({
#   customer: stripeCustomerId,
#   return_url: returnUrl,
# })
```

**Beneficio del portal**: usuario gestiona suscripción / actualiza tarjeta / ve facturas EN STRIPE.
Cliente NO implementa UI compleja, solo redirige.

### 6.4 Lo que YA EXISTE en api-mcp para suscripciones (verificado vía SSH)

```
Subscription Plans (admin):
  getSubscriptionPlans(development, module?, tier?, plan_type?, is_public?)
  getSubscriptionPlan(plan_id)
  createSubscriptionPlan(input) / updateSubscriptionPlan / deleteSubscriptionPlan

User Subscriptions (lifecycle):
  getMySubscription / getMySubscriptions
  getUserSubscription(user_id, development)        # admin
  getAllSubscriptions(...)                          # admin
  projectMonthlyCost(user_id, development)
  calculateCurrentBilling(user_id, development)
  subscribeToPlan(plan_id, billing_period, success_url, cancel_url, metadata)
      → SubscribePlanCheckoutResponse (URL Stripe Checkout)
  cancelMySubscription(immediate?)
  updateUserSubscription(user_id, development, input)   # upgrade/downgrade
  applyCustomPricing(...)
  resetUsage(...)
  setSubUserQuotaLimit(...)

Billing periods + Invoices:
  getSubscriptionBillingPeriods(whitelabelId, limit?)
  getInvoice(invoiceId)
  getServicePriceForCustomer(input)

Stripe integration interna:
  services/stripe-billing.service.ts (clase StripeBillingService):
    - getStripeClient(development)
    - syncProduct / syncPrice
    - reportUsage / reportAIUsage (metered billing)
    - handleWebhookEvent (active/canceled/invoice.paid/payment_failed)
  routes/stripe-webhook.ts (handler completo + Meta CAPI server-side)
```

### 6.5 Lo que el cliente AppEventos tiene que migrar

```diff
apps/appEventos/utils/Fetching.ts:

-  updateCustomer:                            // ❌ schema viejo
-  createCheckoutSession:                     // ❌ schema viejo
-  getCheckoutItems:                          // ❌ schema viejo
-  getAllProducts:                            // ❌ schema viejo

+  updateBillingAddress:                      // ✅ nuevo (cuando backend lo implemente)
+  subscribeToPlan:                           // ✅ ya existe api-mcp
+  getSubscriptionPlans:                      // ✅ ya existe api-mcp
+  createStripeBillingPortalSession:          // ✅ nuevo (cuando backend lo implemente)

apps/appEventos/components/Facturacion/:
   - Planes.tsx → revisar shape de getSubscriptionPlans vs el que devuelve api-mcp
   - Productos.tsx → MIGRAR a SubscriptionPlan structure
   - InformacionFacturacion.tsx → MIGRAR de updateCustomer a updateBillingAddress
   - MetodosDePago.tsx → MIGRAR a Stripe Customer Portal (1 botón redirige)
   - HistorialFacturacion.tsx → MIGRAR de getCheckoutItems a getInvoice
```

---

## 7. RESUMEN POR DOMINIO — Detalle de los 16 endpoints faltantes

### 🎨 Templates/SVG

#### `mutation deleteGalerySvg(evento_id: ID, icon_id: ID)` ← apiapp.bodasdehoy.com
```graphql
mutation ($evento_id: ID, $icon_id: ID) {
  deleteGalerySvg(evento_id: $evento_id, icon_id: $icon_id)
}
```

### 🎫 EventTicket

#### `query getEventTicket` ← api.bodasdehoy.com
```graphql
query ($args:inputEventTicket, $sort:sortCriteriaEventTicket, $skip:Int, $limit:Int) {
  getEventTicket(args:$args, sort:$sort, skip:$skip, limit:$limit) {
    total
    results { _id title createdAt updatedAt }
  }
}
```
Resolver original:
```javascript
getEventTicket: async (_, { args, sort, skip, limit }) => {
  const resp = await ModeloEventTicket.find(args).sort(sort).skip(skip).limit(limit)
  return { total: await ModeloEventTicket.count(args), results: resp }
}
```

### 🏢 Directorio

#### `query getAllBusinesses` ← api.bodasdehoy.com
```graphql
query ($criteria:searchCriteriaBusiness, $sort:sortCriteriaBusiness,
       $skip:Int, $limit:Int, $development:String!) {
  getAllBusinesses(searchCriteria:$criteria, sort:$sort,
                   skip:$skip, limit:$limit, development:$development) {
    total
    results { _id city businessName slug content imgMiniatura { i1024 i800 i640 i320 } }
  }
}
```
Resolver original:
```javascript
getAllBusinesses: async (_, { searchCriteria = {}, sort = {}, skip, limit, development }) => {
  if (Object.keys(sort).length < 1) sort = { createdAt: -1 }
  for (const key in searchCriteria) {
    if (key === "cities") {
      searchCriteria["city"] = { $in: searchCriteria[key] }
      delete searchCriteria[key]
    }
    if (key === "coordinates" && searchCriteria[key].maxDistance > 0) {
      searchCriteria[key] = { $near: { $geometry: {...}, $maxDistance: ... } }
    }
  }
  // ...
}
```

### 👤 Auth/User

#### `mutation createUserWithPassword(email, password)` ← api.bodasdehoy.com
```graphql
mutation($email:String, $password:String) {
  createUserWithPassword(email:$email, password:$password)
}
```
Resolver original:
```javascript
createUserWithPassword: async (_, { email, password }, context) => {
  const { uid } = await getAuth(firebaseApp(context.development)).getUserByEmail(email)
  const valir = await ModeloUser.findOne({ uid })
  const idx = valir?.authDevelopments?.findIndex(elem => elem.title === context.development)
  if (idx > -1) return "apiBodas/email-already-in-use"
  await getAuth(firebaseApp(context.development)).updateUser(uid, { password })
  const customToken = await getAuth(...).createCustomToken(uid)
  return customToken
}
```

#### `query getEmailValid(email)` ← api.bodasdehoy.com
```graphql
query ($email:String) {
  getEmailValid(email:$email) {
    valid
    validators {
      regex { valid reason }
      typo { valid reason }
      disposable { valid reason }
      mx { valid reason }
      smtp { valid reason }
    }
    reason
  }
}
```
Resolver original:
```javascript
getEmailValid: async (_, { email }) => await validate({
  email,
  validateRegex: true, validateMx: true, validateTypo: true,
  validateDisposable: true, validateSMTP: false,
})
```

#### `query getVariableEmailTemplate` ← apiapp.bodasdehoy.com
```graphql
query ($template_id:String, $selectVariable:String) {
  getVariableEmailTemplate(template_id:$template_id, selectVariable:$selectVariable) {
    _id configTemplate { name subject }
    preview html design createdAt updatedAt
  }
}
```

### 👥 Guests

#### `query getPGuestEvent(p)` ← apiapp.bodasdehoy.com
```graphql
query ($p:String) {
  getPGuestEvent(p:$p) {
    _id
    invitados_array {
      _id sexo nombre estatus correo telefono asistencia alergenos
      passesQuantity father nombre_menu grupo_edad
    }
    menus_array { nombre_menu tipo }
  }
}
```

### 📱 WhatsApp Templates

#### `mutation createWhatsappInvitationTemplate(evento_id, data: JSON)` ← apiapp.bodasdehoy.com
```graphql
mutation($evento_id:ID, $data:JSON) {
  createWhatsappInvitationTemplate(evento_id:$evento_id, data:$data)
}
```

#### `mutation updateWhatsappInvitationTemplate(evento_id, template_id, data)` ← apiapp.bodasdehoy.com
```graphql
mutation($evento_id:ID, $template_id:ID, $data:JSON) {
  updateWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id, data:$data) {
    _id
  }
}
```

#### `mutation deleteWhatsappInvitationTemplate(evento_id, template_id)` ← apiapp.bodasdehoy.com
```graphql
mutation($evento_id:ID, $template_id:ID) {
  deleteWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id)
}
```

#### `query getWhatsappInvitationTemplates(evento_id)` ← apiapp.bodasdehoy.com
```graphql
query($evento_id:ID) {
  getWhatsappInvitationTemplates(evento_id:$evento_id)
}
```

### 📱 Facebook Media (Meta API)

#### `mutation uploadMediaToFacebook` ← apiapp.bodasdehoy.com
```graphql
mutation($fileName:String!, $fileBuffer:String!, $fileType:String!, $development:String) {
  uploadMediaToFacebook(fileName:$fileName, fileBuffer:$fileBuffer,
                        fileType:$fileType, development:$development) {
    success handle message error
  }
}
```

#### `mutation uploadBase64MediaToFacebook` ← apiapp.bodasdehoy.com
```graphql
mutation($base64Image:String!, $fileName:String!, $development:String) {
  uploadBase64MediaToFacebook(base64Image:$base64Image, fileName:$fileName,
                              development:$development) {
    success handle message error
  }
}
```

### 💳 Stripe (NUEVOS — identificados en este análisis)

#### `mutation updateBillingAddress(input)` ← NUEVO (reemplazo updateCustomer)
```graphql
mutation($input: BillingAddressInput!) {
  updateBillingAddress(input: $input) {
    success
    customer { id name email address { line1 line2 postalCode city country } }
    error
  }
}

input BillingAddressInput {
  name: String
  email: String
  line1: String
  line2: String
  postalCode: String
  city: String
  country: String
}
```

Resolver de referencia (basado en `updateCustomer` del backend viejo):
```javascript
updateBillingAddress: async (_, { input }, context) => {
  const stripe = getStripeClient(context.development)
  const customer = await stripe.customers.update(
    context.stripeCustomerId,
    {
      name: input.name,
      email: input.email,
      address: {
        line1: input.line1,
        line2: input.line2,
        postal_code: input.postalCode,
        city: input.city,
        country: input.country,
      }
    }
  )
  return { success: true, customer }
}
```

#### `mutation createStripeBillingPortalSession(returnUrl)` ← NUEVO (Stripe self-service)
```graphql
mutation($returnUrl: String!) {
  createStripeBillingPortalSession(returnUrl: $returnUrl) {
    url
    expiresAt
  }
}
```

Resolver de referencia:
```javascript
createStripeBillingPortalSession: async (_, { returnUrl }, context) => {
  const stripe = getStripeClient(context.development)
  const session = await stripe.billingPortal.sessions.create({
    customer: context.stripeCustomerId,
    return_url: returnUrl,
  })
  return { url: session.url, expiresAt: session.expires_at }
}
```

---

## 8. Variables de entorno

```
CANÓNICAS (las únicas válidas):
  API_MCP_GRAPHQL_URL=https://api-mcp.eventosorganizador.com/graphql
  NEXT_PUBLIC_API_MCP_GRAPHQL_URL=https://api-mcp.eventosorganizador.com/graphql
  API_IA_URL=https://api-ia.eventosorganizador.com
  NEXT_PUBLIC_API_IA_URL=https://api-ia.eventosorganizador.com

LEGACY (deben desaparecer cuando backend implemente los 16):
  NEXT_PUBLIC_BASE_URL           → apiapp.bodasdehoy.com
  NEXT_PUBLIC_IMAGES_BASE_URL    → apiapp.bodasdehoy.com
  NEXT_PUBLIC_BASE_API_BODAS     → api.bodasdehoy.com
  NEXT_PUBLIC_BASE_API_BODAS_URL → api.bodasdehoy.com

RETIRADOS hace 2 semanas:
  API_BODAS_URL, NEXT_PUBLIC_API_BODAS_URL
  API3_MCP_GRAPHQL_URL, NEXT_PUBLIC_API3_MCP_GRAPHQL_URL
  API2_URL, NEXT_PUBLIC_API2_URL, API_MCP_URL, GRAPHQL_ENDPOINT
  API3_IA_URL, NEXT_PUBLIC_API3_IA_URL
  PYTHON_BACKEND_URL, BACKEND_URL, BACKEND_INTERNAL_URL, NEXT_PUBLIC_BACKEND_URL

URLs muertas (NXDOMAIN):
  api3-ia.eventosorganizador.com
  api3-mcp-graphql.eventosorganizador.com
```

---

## 9. Plan de acción consolidado

### FASE 0 — Pre-trabajo backend api-mcp (~30 min)

```
Fixes en schema existente (los 3 bugs reportados):
  PlanPricing            → AÑADIR field `currency: String!`
  UserSubscription       → AÑADIR field `plan_name: String` (alias)
  SubscriptionBilling    → AÑADIR field `current_period_end: Date`
```

### FASE 1 — Implementar 16 endpoints faltantes (~4-5h)

```
Prioridad P1 (flujo crítico — 4h):
  💳 Stripe (2 nuevos):
       updateBillingAddress
       createStripeBillingPortalSession
  👤 Auth (2):
       createUserWithPassword
       getEmailValid
  🏢 Directorio (1):
       getAllBusinesses

Prioridad P2 (features secundarias — 1h):
  📱 WhatsApp (4):
       createWhatsappInvitationTemplate, update, delete, getWhatsappInvitationTemplates
  📱 FB Media (2):
       uploadMediaToFacebook, uploadBase64MediaToFacebook
  🎫 EventTicket (1):
       getEventTicket
  👥 Guests (1):
       getPGuestEvent
  🎨 Templates/SVG (2):
       getVariableEmailTemplate, deleteGalerySvg
```

### FASE 2 — Site Builder (línea 1, ~3h)

```
Backend api-mcp:
  - Implementar PR ya en construcción (8 mutations + 5 queries)
  - AÑADIR a la propuesta:
      * evento_id como FK opcional en Site
      * createSiteFromTemplate + getSiteTemplates
      * getSiteByEvento(eventoId): Site
      * Page.blockTypes: [String!]

Cliente AppEventos:
  - Integrar wedding-creator con Site Builder via Page.data JSON
  - Mover persistencia actual de wedding webs a Site Builder
```

### FASE 3 — Cliente AppEventos migra (~1 día)

```
Refactorizar callsites Stripe:
  apps/appEventos/components/Facturacion/Productos.tsx
    getAllProducts → getSubscriptionPlans(is_public: true)
  apps/appEventos/components/Facturacion/HistorialFacturacion.tsx
    getCheckoutItems → getInvoice
  apps/appEventos/components/Facturacion/InformacionFacturacion.tsx
    updateCustomer → updateBillingAddress (cuando backend lo implemente)
  apps/appEventos/components/Facturacion/MetodosDePago.tsx
    UI manual → createStripeBillingPortalSession + redirigir

Limpiar Fetching.ts:
  - Eliminar: updateCustomer, createCheckoutSession, getCheckoutItems, getAllProducts

Limpiar apiEndpoints.ts:
  - Eliminar: DEFAULT_EVENTOS_ORIGIN, DEFAULT_BODAS_AUTH_GRAPHQL_URL
  - Eliminar resolvers: resolveApiEventosOrigin, resolveApiBodasAuthOrigin, etc.
  - Mantener solo: resolveApiBodasGraphqlUrl (api-mcp), resolveApiIaOrigin (api-ia)
```

### FASE 4 — Smoke test E2E (~30 min)

```
- Login + cookies
- Carga de eventos
- CRUD invitados/mesas/presupuesto/itinerario
- Suscripción: cambio de plan + Stripe Checkout
- Stripe Customer Portal (gestión self-service)
- Wedding site editor: crear/editar/publicar
```

### FASE 5 — Apagar backends viejos (~5 min)

```
Cuando smoke pase:
  Droplet API-DIRECTORIO-BODAS-DE-HOY (137.184.148.28) → poweroff
  Droplet APP-GestionBodas (45.55.44.46)               → poweroff

Ahorro: 2 droplets en DigitalOcean.
```

---

## 10. Decisiones que hay que tomar

### Para Site Builder

1. **¿`Site` apunta a `evento_id` como FK opcional?**
   - Mi voto: **SÍ**. Permite UN site asociado a un evento (wedding) o sites independientes (B2B/landing).

2. **¿Templates precargados (createSiteFromTemplate)?**
   - Mi voto: **SÍ**. Sin templates el flujo "crear web boda" requiere 7+ clics manuales.

3. **¿Migración wedding_webs legacy?**
   - Depende de cuántos sites hay en `wedding_webs` actualmente. Si <100, migración script en 1h.

### Para Subscriptions/Stripe

1. **¿updateCustomer → updateBillingAddress nuevo?**
   - Mi voto: **SÍ**. Es la única forma limpia. Sin esto el cliente sigue colgado del backend viejo.

2. **¿Stripe Customer Portal?**
   - Mi voto: **SÍ**. Ahorra desarrollo UI complejo. 1 endpoint en backend, 1 botón en cliente.

3. **¿Quién migra las UIs del cliente AppEventos (Planes/Productos/Historial)?**
   - Cliente front. Cuando backend confirme los 2 endpoints nuevos + 3 fixes, en 1 día se migra.

### Para coordinación general

1. **Schema Subscriptions es COMPARTIDO entre AppEventos (B2C) y CRM (B2B)** → fixes y endpoints nuevos sirven a ambos clientes. No duplicar.

2. **Site Builder es agnóstico** → mismo backend sirve wedding sites (AppEventos) y sites B2B (CRM/proveedores).

---

## 11. Anexos

### 11.1 SSH acceso al backend viejo

Desde server api-mcp PROD (`178.104.209.139`):

```bash
ssh investigate-bodas    # va a api.bodasdehoy.com (137.184.148.28) read-only

# Ver schemas:
ls /root/api-bodas/db/schemas/

# Ver resolver específico:
cat /root/api-bodas/db/schemas/stripe.js          # updateCustomer / checkout / products
cat /root/api-bodas/db/schemas/user.js            # auth / users / createUserWithPassword / getEmailValid
cat /root/api-bodas/db/schemas/business.js        # getAllBusinesses
cat /root/api-bodas/db/schemas/notifications.js   # notifications
cat /root/api-bodas/db/schemas/eventTicket.js     # eventTicket
```

### 11.2 Paquete offline

```bash
cd /tmp && tar xzf api-bodas-export.tar.gz
ls api-bodas-export/db/schemas/
```

### 11.3 Servers SSH (resumen)

```
137.184.148.28  → api-bodas         (api.bodasdehoy.com — legacy)
143.198.62.113  → api-v2/testapi2   (api-mcp TEST)
178.104.209.139 → api3-mcp-graphql  (api-mcp PROD)
164.92.81.153   → api-ia-chat       (API IA Python)
45.55.44.46     → APP-GestionBodas  (apiapp.bodasdehoy.com — SIN ACCESO SSH)
```

### 11.4 Auditorías previas del equipo api-mcp (29-30 abril 2026)

En `/var/www/api-production/`:
```
AUDITORIA_FUNCIONALIDAD_APIAPP_VS_API3.md     365 líneas
ANALISIS_OPERACIONES_FALTANTES.md             271 líneas
APIAPP_SCHEMA_MUTATIONS.json                  schema completo apiapp
ANALISIS_INPUT_TYPES_FALTANTES.md             types faltantes
COMPARACION_APIAPP_VS_API3.md                 comparación
FRONTEND_MUTATIONS_REFERENCE.md               referencia para front
```

---

## 12. Fin del informe

**Bottleneck total**: backend implementa 16 endpoints + 3 fixes (~5h) + cliente migra (~1 día) =
**aprox. 1.5-2 días para apagar definitivamente los 2 backends viejos**.

Cualquier duda sobre un endpoint específico: COORD puede extraer más código vía SSH a
`investigate-bodas` y proporcionarlo en el siguiente turno.

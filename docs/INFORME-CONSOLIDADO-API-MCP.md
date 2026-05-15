# 📚 INFORME CONSOLIDADO — Migración cliente AppEventos → api-mcp

> **Fecha**: 2026-05-15
> **Autor**: COORD-AppBodas (Claude Opus 4.7)
> **Objetivo**: dar al equipo api-mcp TODA la información para que cliente AppEventos deje de usar
> `apiapp.bodasdehoy.com` y `api.bodasdehoy.com` (backends viejos en desaparición) y use solo
> `api-mcp.eventosorganizador.com` + `api-ia.eventosorganizador.com` (canónicos).

---

## 0. TL;DR

```
Cliente AppEventos envía:        98 ops únicas (105 alias en Fetching.ts)
apiapp.bodasdehoy.com tiene:     28 queries + 93 mutations  = 121 ops
api.bodasdehoy.com tiene:        80 queries + 102 mutations = 182 ops
api-mcp.eventosorganizador.com:  81 queries + 156 mutations = 237 ops (PROD)

CRUCE FINAL:
  ✅ EN api-mcp:                 79 / 98  (80.6%)
  ❌ FALTANTES en api-mcp:       18      ← acción concreta
     - de apiapp.bodasdehoy:    9 (WhatsApp/FB media/SVG/guests/templates)
     - de api.bodasdehoy:       9 (Stripe/business/eventTicket/user)
  ❓ Sin localizar:              1

Tiempo estimado api-mcp para implementar los 18: ~4-6 horas
```

---

## 1. Metodología de investigación

```
PASO 1 — Identificar todos los backends activos
  Comando: dig + curl + introspection HTTP
  Resultado: 4 backends GraphQL + 1 REST descubiertos

PASO 2 — SSH a cada backend para acceder al código
  Servers SSH probados:
  ✓ 137.184.148.28 (api-bodas)         → /root/api-bodas (api.bodasdehoy.com)
  ✓ 143.198.62.113 (api-v2/testapi2)   → /root/api-test (api-mcp TEST)
  ✓ 178.104.209.139 (api3-mcp-graphql) → /var/www/api-production (api-mcp PROD)
  ✓ 164.92.81.153 (api-ia-chat)        → API IA backend Python
  ✗ 45.55.44.46 (APP-GestionBodas)     → SSH cerrado por firewall DigitalOcean
                                          (= apiapp.bodasdehoy.com origin)

PASO 3 — Dump schemas
  - api.bodasdehoy:   typeDefs literales desde /root/api-bodas/db/schemas/*.js
  - apiapp:           introspection HTTP (introspection habilitada)
  - api-mcp PROD:     introspection deshabilitada → dump del código TS
                       desde /var/www/api-production/dist-production
  - cliente:          regex sobre apps/appEventos/utils/Fetching.ts

PASO 4 — Cruce de ops
  Python parseo + diff: cliente_uses ∩ backend_viejo → backend_nuevo
```

## 2. Infraestructura descubierta

### 2.1 Droplets DigitalOcean (cuenta DiarioCivi2)

```
Name                          IP                Rol                                Estado SSH
─────────────────────────────────────────────────────────────────────────────────────────
api-ia-chat                   164.92.81.153    API IA (chat, memories, leads)     ✓ accesible
api-v2-ts-graphql-mcp         143.198.62.113   api-mcp TEST                       ✓ accesible
API-DIRECTORIO-BODAS-DE-HOY   137.184.148.28   api.bodasdehoy.com (legacy)        ✓ accesible
APP-GestionBodas              45.55.44.46      apiapp.bodasdehoy.com (legacy)     ✗ firewall
[no en lista]                 178.104.209.139  api-mcp PROD (api3-mcp-graphql)    ✓ accesible
```

### 2.2 Dominios y mapping

```
CANÓNICOS (deben quedar):
  api-mcp.eventosorganizador.com   → 143.198.62.113 + 178.104.209.139  (GraphQL)
  api-ia.eventosorganizador.com    → 164.92.81.153                    (REST)

LEGACY (deben desaparecer):
  api.bodasdehoy.com               → 137.184.148.28                  (GraphQL)
  apiapp.bodasdehoy.com            → 45.55.44.46                     (GraphQL)
  api-ia.bodasdehoy.com            → (alias deprecado, va a desaparecer)
  api3-ia.eventosorganizador.com   → (URL muerta, DNS NXDOMAIN)
```

---

## 3. Cliente AppEventos — qué envía

### 3.1 Resumen

```
Archivo origen:     apps/appEventos/utils/Fetching.ts
Keys del objeto queries: 105 (algunas son alias del mismo endpoint real)
Operaciones únicas:  98
Queries:             ~30
Mutations:           ~68
```

## 4. Cruce exhaustivo cliente vs api-mcp

### 4.1 Ya implementadas en api-mcp (79 ops)

Lista completa (orden alfabético):

```
  addCompartition                      addTaskAttachments                   addWeddingPlannerIngreso           
  auth                                 borraCategoria                       borraGasto                         
  borraInvitados                       borraItemsGastos                     borraMenu                          
  borraMesa                            borraPago                            borrarEvento                       
  creaGrupo                            creaInvitado                         creaMenu                           
  crearEvento                          createElement                        createEmailTemplate                
  createGalerySvgs                     createItinerario                     createNotifications                
  createPsTemplate                     createTable                          createTask                         
  createUser                           deleteCompartition                   deleteElement                      
  deleteEmailTemplate                  deleteTable                          deleteTaskAttachment               
  deleteWeddingPlannerIngreso          duplicateItinerario                  duplicatePresupuesto               
  editCategoria                        editElement                          editEvento                         
  editGasto                            editInvitado                         editItemGasto                      
  editItinerario                       editMesa                             editPago                           
  editPresupuesto                      editTable                            editTask                           
  editTotalStimatedGuests              editVisibleColumns                   getEmailTemplate                   
  getGalerySvgs                        getNotifications                     getPlanSpaceSelect                 
  getPreregister                       getPreviewsEmailTemplates            getPsTemplate                      
  getUser                              getUsers                             getVariablesTemplatesInvitaciones  
  nuevoCategoria                       nuevoGasto                           nuevoItemGasto                     
  nuevoPago                            queryenEvento                        queryenEvento_id                   
  setPlanSpaceSelect                   signOut                              singleUpload                       
  status                               testInvitacion                       updateActivity                     
  updateActivityLink                   updateCompartition                   updateEmailTemplate                
  updateNotifications                  updateUser                           whatsappCreateSession              
  whatsappDisconnectSession            whatsappGetSession                   whatsappRegenerateQR               
  whatsappSendMessage                
```

## 5. Los 18 endpoints FALTANTES en api-mcp

### 5.1 Resumen por categoría

```
  🎨 Templates/SVG: 1 → deleteGalerySvg
  🎫 EventTicket: 1 → getEventTicket
  🏢 Directorio: 2 → getAllBusinesses, getAllProducts
  👤 Auth/User: 3 → getVariableEmailTemplate, createUserWithPassword, getEmailValid
  👥 Guests: 1 → getPGuestEvent
  💳 Stripe/Billing: 4 → updateCustomer, setCheckoutItems, getCheckoutItems, createCheckoutSession
  📱 WhatsApp/FB Media: 6 → getWhatsappInvitationTemplates, createWhatsappInvitationTemplate, updateWhatsappInvitationTemplate, deleteWhatsappInvitationTemplate, uploadMediaToFacebook, uploadBase64MediaToFacebook

  TOTAL: 18
```

### 5.2 Detalle por endpoint

#### 🎨 Templates/SVG

##### `mutation deleteGalerySvg`

**Backend origen**: `apiapp.bodasdehoy.com`

**Llamada del cliente**:

```graphql
mutation ($evento_id: ID, $icon_id: ID) {
    deleteGalerySvg(evento_id: $evento_id, icon_id: $icon_id) 
  }
```

---

#### 🎫 EventTicket

##### `query getEventTicket`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

```
  args: inputEventTicket
  sort: sortCriteriaEventTicket
  skip: Int
  limit: Int
```

**Llamada del cliente**:

```graphql
query ( $args:inputEventTicket, $sort:sortCriteriaEventTicket, $skip:Int, $limit:Int )
  {
    getEventTicket(args:$args, sort:$sort, skip:$skip, limit:$limit ){
      total
      results{
        _id
        title
        createdAt
        updatedAt
      }
    }
  }
```

**Resolver real del backend viejo** (`api.bodasdehoy.com:/root/api-bodas/db/schemas/`):

```javascript
######
--- typedef ---
/root/api-bodas/db/schemas/eventTicket.js-extend type Query {
/root/api-bodas/db/schemas/eventTicket.js:  getEventTicket (args:inputEventTicket, sort:sortCriteriaEventTicket, skip: Int, limit:Int):salidaEventTicket
/root/api-bodas/db/schemas/eventTicket.js-}
/root/api-bodas/db/schemas/eventTicket.js-
/root/api-bodas/db/schemas/eventTicket.js-extend type Mutation {
/root/api-bodas/db/schemas/eventTicket.js-  createEventTicket(args:[inputEventTicket]):salidaEventTicket
/root/api-bodas/db/schemas/eventTicket.js-  updateEventTicket(args:inputEventTicket):sventTicket
--- resolver (primeras 40 lineas) ---
/root/api-bodas/db/schemas/eventTicket.js:    getEventTicket: async (_, { args, sort, skip, limit }, context) => {
/root/api-bodas/db/schemas/eventTicket.js-      const ht = dateAndEndpoint("getEventTicket")
/root/api-bodas/db/schemas/eventTicket.js-      try {
/root/api-bodas/db/schemas/eventTicket.js-        console.time(ht)
/root/api-bodas/db/schemas/eventTicket.js-        const resp = await ModeloEventTicket.find(args).sort(sort).skip(skip).limit(limit)
/root/api-bodas/db/schemas/eventTicket.js-        console.timeEnd(ht)
/root/api-bodas/db/schemas/eventTicket.js-        return {
/root/api-bodas/db/schemas/eventTicket.js-          total: await ModeloEventTicket.count(args),
/root/api-bodas/db/schemas/eventTicket.js-          results: resp
/root/api-bodas/db/schemas/eventTicket.js-        }
/root/api-bodas/db/schemas/eventTicket.js-      } catch (error) {
/root/api-bodas/db/schemas/eventTicket.js-        console.log(error)
/root/api-bodas/db/schemas/eventTicket.js-        console.timeEnd(ht)
/root/api-bodas/db/schemas/eventTicket.js-        return error
/root/api-bodas/db/schemas/eventTicket.js-      }
/root/api-bodas/db/schemas/eventTicket.js-    },
/root/api-bodas/db/schemas/eventTicket.js-  },
/root/api-bodas/db/schemas/eventTicket.js-
/root/api-bodas/db/schemas/eventTicket.js-  Mutation: {
/root/api-bodas/db/schemas/eventTicket.js-    createEventTicket: async (_, { args }, context) => {
/root/api-bodas/db/schemas/eventTicket.js-      const ht = dateAndEndpoint("createEventTicket")
/root/api-bodas/db/schemas/eventTicket.js-      try {
/root/api-bodas/db/schemas/eventTicket.js-        console.time(ht)
/root/api-bodas/db/schemas/eventTicket.js-        const resp = { total: 0, results: [] }
/root/api-bodas/db/schemas/eventTicket.js-        for (let i = 0; i < args.length; i++) {
/root/api-bodas/db/schemas/eventTicket.js-          const
```

---

#### 🏢 Directorio

##### `query getAllBusinesses`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

```
  searchCriteria: searchCriteriaBusiness
  sort: sortCriteriaBusiness
  skip: Int
  limit: Int
  development: String!
```

**Llamada del cliente**:

```graphql
query ($criteria :searchCriteriaBusiness, $sort : sortCriteriaBusiness, $skip :Int, $limit : Int, $development: String!) {
    getAllBusinesses(searchCriteria:$criteria, sort: $sort, skip: $skip, limit: $limit, development: $development){
      total
      results{
         _id
         city
        businessName
        slug
        content
        imgMiniatura{
          i1024
          i800
          i640
          i320
        }
        
      }
    }
  }
```

**Resolver real del backend viejo** (`api.bodasdehoy.com:/root/api-bodas/db/schemas/`):

```javascript
######
--- typedef ---
/root/api-bodas/db/schemas/business.js-    """Todos los argumentos son opcionales: \n ( prop: "", valor: [""], propSort: "createdAt", valorSort: 1, skip: 0, limit: 100 )"""
/root/api-bodas/db/schemas/business.js:    getAllBusinesses (searchCriteria:searchCriteriaBusiness, sort:sortCriteriaBusiness, skip: Int, limit:Int, development: String!): salidaBusinessCms
/root/api-bodas/db/schemas/business.js-    getAllLocalities (categoriesId: [String]) :salidaLocalities
/root/api-bodas/db/schemas/business.js-  }
/root/api-bodas/db/schemas/business.js-
/root/api-bodas/db/schemas/business.js-  extend type Mutation {
/root/api-bodas/db/schemas/business.js-    createBusiness (id:ID, fase: String, inputBusiness: inputBusiness, development: String!): businessCms
--- resolver (primeras 40 lineas) ---
/root/api-bodas/db/schemas/business.js:    getAllBusinesses: async (_, { searchCriteria = {}, sort = {}, skip, limit, development }, context) => {
/root/api-bodas/db/schemas/business.js-      const ht = dateAndEndpoint(context, "getAllBusinesses")
/root/api-bodas/db/schemas/business.js-      try {
/root/api-bodas/db/schemas/business.js-        console.time(ht)
/root/api-bodas/db/schemas/business.js-        if (Object.keys(sort).length < 1) sort = { createdAt: -1 }
/root/api-bodas/db/schemas/business.js-        // Recorrer cada criterio 
/root/api-bodas/db/schemas/business.js-        let valirCoordinates = false
/root/api-bodas/db/schemas/business.js-        let searchCriteriaArr = []
/root/api-bodas/db/schemas/business.js-        for (const key in searchCriteria) {
/root/api-bodas/db/schemas/business.js-          if (key === "cities") {
/root/api-bodas/db/schemas/business.js-            searchCriteria["city"] = { $in: searchCriteria[key] }
/root/api-bodas/db/schemas/business.js-            delete searchCriteria[key]
/root/api-bodas/db/schemas/business.js-          }
/root/api-bodas/db/schemas/business.js-          if (key === "coordinates" && searchCriteria[key].maxDistance > 0) {
/root/api-bodas/db/schemas/business.js-            searchCriteria[key] = { $near: { $geometry: { type: "Point", coordinates: searchCriteria[key].coordinates }, $minDistance: searchCriteria[key].minDistance, $maxDistance: searchCriteria[key].maxDistance } }
/root/api-bodas/db/schemas/business.js-            valirCoordinates = true
/root/api-bodas/db/schemas/business.js-            delete searchCriteria.city
/root/api-bodas/db/schemas/business.js-          }
/root/api-bodas/db/s
```

---

##### `query getAllProducts`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

```
  grupo: String
```

**Llamada del cliente**:

```graphql
query ($grupo:String) {
    getAllProducts(grupo:$grupo){
      currency
      total
      results{
        id
        name
        description
        images
        usage
        subscriptionId
        current_period_start
        current_period_end
        prices{
          id
          currency
          unit_amount
          recurring{
            interval
            trial_period_days
          }
        }
        metadata{
          grupo
          includes
          segmento
          tipo
          caracteristica
        }
      }
    }
  }
```

**Resolver real del backend viejo** (`api.bodasdehoy.com:/root/api-bodas/db/schemas/`):

```javascript
######
--- typedef ---
/root/api-bodas/db/schemas/stripe.js-    testStripe(val1:String):String
/root/api-bodas/db/schemas/stripe.js:    getAllProducts(grupo:String): salidaProducts
/root/api-bodas/db/schemas/stripe.js-    getCheckoutItems(unique:ID):itemsCheckout
/root/api-bodas/db/schemas/stripe.js-    getInvoices:salidaInvoices
/root/api-bodas/db/schemas/stripe.js-    getCustomer:customer
/root/api-bodas/db/schemas/stripe.js-  }
/root/api-bodas/db/schemas/stripe.js-  
--- resolver (primeras 40 lineas) ---
/root/api-bodas/db/schemas/stripe.js:    getAllProducts: async (_, { grupo }, context) => {
/root/api-bodas/db/schemas/stripe.js-      const ht = dateAndEndpoint(context, "getAllProducts")
/root/api-bodas/db/schemas/stripe.js-      try {
/root/api-bodas/db/schemas/stripe.js-        console.time(ht)
/root/api-bodas/db/schemas/stripe.js-        const stripe = context.isProduction ? stripe_production : stripe_dev
/root/api-bodas/db/schemas/stripe.js-        let usageProducts = []
/root/api-bodas/db/schemas/stripe.js-        let stripeCustomersProducts = []
/root/api-bodas/db/schemas/stripe.js-        let currency = null
/root/api-bodas/db/schemas/stripe.js-        if (context?.stripe_id) {
/root/api-bodas/db/schemas/stripe.js-          const stripeCustomer = await ModeloStripeCustomer.findOne({ _id: context?.stripe_id })
/root/api-bodas/db/schemas/stripe.js-          currency = stripeCustomer?.currency
/root/api-bodas/db/schemas/stripe.js-          const subscriptionProducts = stripeCustomer?.subscriptions?.reduce((acc, item) => {
/root/api-bodas/db/schemas/stripe.js-            stripeCustomersProducts = item?.products?.map(el => {
/root/api-bodas/db/schemas/stripe.js-              return {
/root/api-bodas/db/schemas/stripe.js-                id: el,
/root/api-bodas/db/schemas/stripe.js-                subscriptionId: item.id,
/root/api-bodas/db/schemas/stripe.js-                current_period_start: item?.current_period_start,
/root/api-bodas/db/schemas/stripe.js-                current_period_end: item?.current_period_end,
/root/api-bodas/db/schemas/stripe.js-              }
/root/api-bodas/db/schemas/stripe.js-            })
/root/api-bodas/db/schemas/stripe.js-            acc.push(...item.products)
/root/api-bodas/db/schemas/stripe.js-            return acc
/root/api-bodas/db/schemas/stripe.js-          }, [])
/root/api-bodas/db/schemas/stripe.js-          const paymentProducts = stripeCustomer?.payments?.reduce((acc, item) => {
/root/api-bodas/db/sche
```

---

#### 👤 Auth/User

##### `mutation createUserWithPassword`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

```
  email: String
  password: String
```

**Llamada del cliente**:

```graphql
mutation($email:String, $password:String) { 
    createUserWithPassword(email:$email, password:$password)
  }
```

**Resolver real del backend viejo** (`api.bodasdehoy.com:/root/api-bodas/db/schemas/`):

```javascript
######
--- typedef ---
/root/api-bodas/db/schemas/user.js-    createUsersFirebase(emails:[inputEmail]):[newUserFirebase]
/root/api-bodas/db/schemas/user.js:    createUserWithPassword(email:String, password:String):String
/root/api-bodas/db/schemas/user.js-  }
/root/api-bodas/db/schemas/user.js-`
/root/api-bodas/db/schemas/user.js-
/root/api-bodas/db/schemas/user.js-export const resolvers = {
/root/api-bodas/db/schemas/user.js-  Query: {
--- resolver (primeras 40 lineas) ---
/root/api-bodas/db/schemas/user.js:    createUserWithPassword: async (_, { email, password }, context) => {
/root/api-bodas/db/schemas/user.js-      const ht = dateAndEndpoint(context, "createUserWithPassword")
/root/api-bodas/db/schemas/user.js-      try {
/root/api-bodas/db/schemas/user.js-        console.time(ht)
/root/api-bodas/db/schemas/user.js-        // const decryptedData = crypto.privateDecrypt(
/root/api-bodas/db/schemas/user.js-        //   {
/root/api-bodas/db/schemas/user.js-        //     key: privateKey,
/root/api-bodas/db/schemas/user.js-        //     padding: crypto.constants.RSA_PKCS1_PADDING,
/root/api-bodas/db/schemas/user.js-        //     oaepHash: 'sha256',
/root/api-bodas/db/schemas/user.js-        //   },
/root/api-bodas/db/schemas/user.js-        //   Buffer.from(password, "hex")
/root/api-bodas/db/schemas/user.js-        // );
/root/api-bodas/db/schemas/user.js-        // password = decryptedData.toString('utf-8')
/root/api-bodas/db/schemas/user.js-        console.log({ email, password })
/root/api-bodas/db/schemas/user.js-        const { uid } = await getAuth(firebaseApp(context.development)).getUserByEmail(email)
/root/api-bodas/db/schemas/user.js-        const valir = await ModeloUser.findOne({ uid })
/root/api-bodas/db/schemas/user.js-        console.log(uid, valir?.authDevelopments)
/root/api-bodas/db/schemas/user.js-        const idx = valir?.authDevelopments?.findIndex(elem => elem.title === context.development)
/root/api-bodas/db/schemas/user.js-        if (idx > -1) {
/root/api-bodas/db/schemas/user.js-          return "apiBodas/email-already-in-use"
/root/api-bodas/db/schemas/user.js-        }
/root/api-bodas/db/schemas/user.js-        console.log({ idx })
/root/api-bodas/db/schemas/user.js-
/root/api-bodas/db/schemas/user.js-        const userRecord = await getAuth(firebaseApp(context.development)).updateUser(uid, { password })
/root/api-bodas/db/schemas/user.js-        const customToken = await getAuth(firebaseApp(context.development)).createCust
```

---

##### `query getEmailValid`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

```
  email: String
```

**Llamada del cliente**:

```graphql
query ($email :String){
    getEmailValid(email:$email){
      valid
      validators{
        regex{
          valid, reason
        }
        typo{
          valid, reason
        }
        disposable{
          valid, reason
        }
        mx{
          valid, reason
        }
        smtp{
          valid, reason
        }
      }
      reason
    }
  }
```

**Resolver real del backend viejo** (`api.bodasdehoy.com:/root/api-bodas/db/schemas/`):

```javascript
######
--- typedef ---
/root/api-bodas/db/schemas/user.js-    queryenUser (variable: String, valor: String): User!
/root/api-bodas/db/schemas/user.js:    getEmailValid(email:String):emailValid
/root/api-bodas/db/schemas/user.js-  }
/root/api-bodas/db/schemas/user.js-
/root/api-bodas/db/schemas/user.js-  input inputEmail {
/root/api-bodas/db/schemas/user.js-    email: String
/root/api-bodas/db/schemas/user.js-  }
--- resolver (primeras 40 lineas) ---
/root/api-bodas/db/schemas/user.js:    getEmailValid: async (_, { email }, context) => {
/root/api-bodas/db/schemas/user.js-      const ht = dateAndEndpoint(context, "getEmailValid")
/root/api-bodas/db/schemas/user.js-      try {
/root/api-bodas/db/schemas/user.js-        console.time(ht)
/root/api-bodas/db/schemas/user.js-        console.log(email)
/root/api-bodas/db/schemas/user.js-        const resp = await validate({
/root/api-bodas/db/schemas/user.js-          email,
/root/api-bodas/db/schemas/user.js-          validateRegex: true,
/root/api-bodas/db/schemas/user.js-          validateMx: true,
/root/api-bodas/db/schemas/user.js-          validateTypo: true,
/root/api-bodas/db/schemas/user.js-          validateDisposable: true,
/root/api-bodas/db/schemas/user.js-          validateSMTP: false,
/root/api-bodas/db/schemas/user.js-        })
/root/api-bodas/db/schemas/user.js-        console.log(resp)
/root/api-bodas/db/schemas/user.js-        console.timeEnd(ht)
/root/api-bodas/db/schemas/user.js-        return resp
/root/api-bodas/db/schemas/user.js-      } catch (error) {
/root/api-bodas/db/schemas/user.js-        console.log(error)
/root/api-bodas/db/schemas/user.js-        console.timeEnd(ht)
/root/api-bodas/db/schemas/user.js-        return error
/root/api-bodas/db/schemas/user.js-      }
/root/api-bodas/db/schemas/user.js-    },
/root/api-bodas/db/schemas/user.js-    //v2
/root/api-bodas/db/schemas/user.js-    getGeoInfo: async (_, { }, context) => {
/root/api-bodas/db/schemas/user.js-      const ht = dateAndEndpoint(context, "auth")
/root/api-bodas/db/schemas/user.js-      try {
/root/api-bodas/db/schemas/user.js-        return await context.geoInfo
/root/api-bodas/db/schemas/user.js-      } catch (error) {
/root/api-bodas/db/schemas/user.js-        console.log(error)
/root/api-bodas/db/schemas/user.js-        return error
/root/api-bodas/db/schemas/user.js-      }
/root/api-bodas/db/schemas/user.js-    },
/root/api-bodas/db/schemas/user.js-  },
/root/api-bodas/db/schemas/user.js-
/root/api-bodas/db/sch
```

---

##### `query getVariableEmailTemplate`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

```
  evento_id: String
  template_id: String
  selectVariable: String
```

**Llamada del cliente**:

```graphql
query ($template_id:String, $selectVariable:String){
    getVariableEmailTemplate(template_id:$template_id, selectVariable:$selectVariable){
      _id
      configTemplate{
        name
        subject
      }
      preview
      html
      design
      createdAt
      updatedAt
    }
  }
```

---

#### 👥 Guests

##### `query getPGuestEvent`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

```
  p: String
```

**Llamada del cliente**:

```graphql
query($p:String){
    getPGuestEvent(p:$p){
      _id
      invitados_array{
        _id
        sexo
        nombre
        estatus
        correo
        telefono
        asistencia
        alergenos
        passesQuantity
        father
        nombre_menu
        grupo_edad
      }
      menus_array{
        nombre_menu
        tipo
      }
    }
  }
```

---

#### 💳 Stripe/Billing

##### `mutation createCheckoutSession`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

```
  items: [inputItemsCheckout]
  email: String
  cancel_url: String
  mode: String
  success_url: String
```

**Llamada del cliente**:

```graphql
mutation ($items:[inputItemsCheckout], $email:String, $cancel_url:String, $mode:String, $success_url:String){
    createCheckoutSession(items:$items, email:$email, cancel_url:$cancel_url, mode:$mode, success_url:$success_url)
  }
```

**Resolver real del backend viejo** (`api.bodasdehoy.com:/root/api-bodas/db/schemas/`):

```javascript
######
--- typedef ---
/root/api-bodas/db/schemas/stripe.js-    updateCustomer(args:inputCustomer):String
/root/api-bodas/db/schemas/stripe.js:    createCheckoutSession(items:[inputItemsCheckout], email:String, cancel_url:String, mode:String, success_url:String):String
/root/api-bodas/db/schemas/stripe.js-    setCheckoutItems(unique:ID, args:[inputDetailsItemsCheckout]):String
/root/api-bodas/db/schemas/stripe.js-  }
/root/api-bodas/db/schemas/stripe.js-`
/root/api-bodas/db/schemas/stripe.js-
/root/api-bodas/db/schemas/stripe.js-
--- resolver (primeras 40 lineas) ---
/root/api-bodas/db/schemas/stripe.js:    createCheckoutSession: async (_, { items, email, cancel_url, mode = "subscription", success_url = "https://bodasdehoy.com" }, context) => {
/root/api-bodas/db/schemas/stripe.js-      console.log(items)
/root/api-bodas/db/schemas/stripe.js-      const ht = dateAndEndpoint(context, "createCheckoutSession")
/root/api-bodas/db/schemas/stripe.js-      try {
/root/api-bodas/db/schemas/stripe.js-        console.time(ht)
/root/api-bodas/db/schemas/stripe.js-        let customerId = context?.stripeCustomerId
/root/api-bodas/db/schemas/stripe.js-        let _id = context?.stripe_id
/root/api-bodas/db/schemas/stripe.js-        const stripe = context.isProduction ? stripe_production : stripe_dev
/root/api-bodas/db/schemas/stripe.js-        console.log(100054, { customer: customerId, _id })
/root/api-bodas/db/schemas/stripe.js-        if (!customerId && !!context.user) {
/root/api-bodas/db/schemas/stripe.js-          const result = await createCustomer({ context, stripe })
/root/api-bodas/db/schemas/stripe.js-          customerId = result.customerId
/root/api-bodas/db/schemas/stripe.js-          _id = result._id
/root/api-bodas/db/schemas/stripe.js-        }
/root/api-bodas/db/schemas/stripe.js-
/root/api-bodas/db/schemas/stripe.js-        const unique = customAlphabet('1234567890abcdef', 24)()
/root/api-bodas/db/schemas/stripe.js-        success_url = `${success_url}`
/root/api-bodas/db/schemas/stripe.js-
/root/api-bodas/db/schemas/stripe.js-        const qwe = {
/root/api-bodas/db/schemas/stripe.js-          ...(!!customerId && { customer: customerId }),
/root/api-bodas/db/schemas/stripe.js-          ...(!customerId && { customer_email: email }),
/root/api-bodas/db/schemas/stripe.js-          //...(mode !== "subscription" && { customer_creation: "if_required" })
/root/api-bodas/db/schemas/stripe.js-        }
/root/api-bodas/db/schemas/stripe.js-        const zxc =
```

---

##### `query getCheckoutItems`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

```
  unique: ID
```

**Llamada del cliente**:

```graphql
query ( $unique:ID )
  {
    getCheckoutItems(unique:$unique){
      currency
      amount
      name
      price
      quantity
    }
  }
```

**Resolver real del backend viejo** (`api.bodasdehoy.com:/root/api-bodas/db/schemas/`):

```javascript
######
--- typedef ---
/root/api-bodas/db/schemas/stripe.js-    getAllProducts(grupo:String): salidaProducts
/root/api-bodas/db/schemas/stripe.js:    getCheckoutItems(unique:ID):itemsCheckout
/root/api-bodas/db/schemas/stripe.js-    getInvoices:salidaInvoices
/root/api-bodas/db/schemas/stripe.js-    getCustomer:customer
/root/api-bodas/db/schemas/stripe.js-  }
/root/api-bodas/db/schemas/stripe.js-  
/root/api-bodas/db/schemas/stripe.js-  extend type Mutation {
--- resolver (primeras 40 lineas) ---
/root/api-bodas/db/schemas/stripe.js:    getCheckoutItems: async (_, { unique }, context) => {
/root/api-bodas/db/schemas/stripe.js-      const ht = dateAndEndpoint(context, "getCheckoutItems")
/root/api-bodas/db/schemas/stripe.js-      try {
/root/api-bodas/db/schemas/stripe.js-        console.log("context.isProduction", context.isProduction)
/root/api-bodas/db/schemas/stripe.js-        const stripe = context.isProduction ? stripe_production : stripe_dev
/root/api-bodas/db/schemas/stripe.js-        console.time(ht)
/root/api-bodas/db/schemas/stripe.js-        console.log(unique)
/root/api-bodas/db/schemas/stripe.js-        const { items } = await ModeloCheckoutSession.findOne({ unique, status: "complete" }).select({ items: 1 })
/root/api-bodas/db/schemas/stripe.js-        if (!items[0].details.length) {
/root/api-bodas/db/schemas/stripe.js-          const price = await stripe.prices.retrieve(items[0].price)
/root/api-bodas/db/schemas/stripe.js-          const product = await stripe.products.retrieve(price?.product)
/root/api-bodas/db/schemas/stripe.js-          console.log(product, price)
/root/api-bodas/db/schemas/stripe.js-          console.timeEnd(ht)
/root/api-bodas/db/schemas/stripe.js-          return {
/root/api-bodas/db/schemas/stripe.js-            currency: price.currency,
/root/api-bodas/db/schemas/stripe.js-            amount: price.unit_amount,
/root/api-bodas/db/schemas/stripe.js-            price: items[0].price,
/root/api-bodas/db/schemas/stripe.js-            quantity: items[0].quantity,
/root/api-bodas/db/schemas/stripe.js-            name: product?.name
/root/api-bodas/db/schemas/stripe.js-          };
/root/api-bodas/db/schemas/stripe.js-        }
/root/api-bodas/db/schemas/stripe.js-        console.timeEnd(ht)
/root/api-bodas/db/schemas/stripe.js-        return null;
/root/api-bodas/db/schemas/stripe.js-      } catch (error) {
/root/api-bodas/db/schemas/stripe.js-        console.log(error)
/root/api-bodas/db/schemas/stripe.js-        console
```

---

##### `mutation setCheckoutItems`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

```
  unique: ID
  args: [inputDetailsItemsCheckout]
```

**Llamada del cliente**:

```graphql
mutation ( $unique:ID, $args:[inputDetailsItemsCheckout] )
  {
    setCheckoutItems(unique:$unique, args:$args)
  }
```

**Resolver real del backend viejo** (`api.bodasdehoy.com:/root/api-bodas/db/schemas/`):

```javascript
######
--- typedef ---
/root/api-bodas/db/schemas/stripe.js-    createCheckoutSession(items:[inputItemsCheckout], email:String, cancel_url:String, mode:String, success_url:String):String
/root/api-bodas/db/schemas/stripe.js:    setCheckoutItems(unique:ID, args:[inputDetailsItemsCheckout]):String
/root/api-bodas/db/schemas/stripe.js-  }
/root/api-bodas/db/schemas/stripe.js-`
/root/api-bodas/db/schemas/stripe.js-
/root/api-bodas/db/schemas/stripe.js-
/root/api-bodas/db/schemas/stripe.js-export const resolvers = {
--- resolver (primeras 40 lineas) ---
/root/api-bodas/db/schemas/stripe.js:    setCheckoutItems: async (_, { unique, args }, context) => {
/root/api-bodas/db/schemas/stripe.js-      const ht = dateAndEndpoint(context, "setCheckoutItems")
/root/api-bodas/db/schemas/stripe.js-      try {
/root/api-bodas/db/schemas/stripe.js-        console.time(ht)
/root/api-bodas/db/schemas/stripe.js-        console.log(unique, args)
/root/api-bodas/db/schemas/stripe.js-        const res = await ModeloCheckoutSession.updateOne({ unique }, { $push: { 'items.0.details': { $each: args } } })
/root/api-bodas/db/schemas/stripe.js-        console.log(res)
/root/api-bodas/db/schemas/stripe.js-        args.forEach(item => {
/root/api-bodas/db/schemas/stripe.js-          sendEmail({
/root/api-bodas/db/schemas/stripe.js-            evento: "Los Iracundos",
/root/api-bodas/db/schemas/stripe.js-            email: item.email,
/root/api-bodas/db/schemas/stripe.js-            asunto: `Entrada concierto ${"Los Iracundos"}`,
/root/api-bodas/db/schemas/stripe.js-            sender: { "name": `Oro Verde y EventosOrganizador.com`, "email": "invitaciones@eventosorganizador.com" },
/root/api-bodas/db/schemas/stripe.js-            templateId: 57,
/root/api-bodas/db/schemas/stripe.js-            params: {
/root/api-bodas/db/schemas/stripe.js-              nombreEvento: "Los Iracundos".toUpperCase(),
/root/api-bodas/db/schemas/stripe.js-              imgUrl: "https://www.shutterstock.com/shutterstock/photos/2021147534/display_1500/stock-vector-concert-ticket-template-concert-party-or-festival-ticket-design-template-with-crowd-of-people-in-2021147534.jpg"
/root/api-bodas/db/schemas/stripe.js-            }
/root/api-bodas/db/schemas/stripe.js-          })
/root/api-bodas/db/schemas/stripe.js-        });
/root/api-bodas/db/schemas/stripe.js-        return "ok"
/root/api-bodas/db/schemas/stripe.js-      } catch (error) {
/root/api-bodas/db/schemas/stripe.js-        console.timeEnd(ht)
/root/api-
```

---

##### `mutation updateCustomer`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

```
  args: inputCustomer
```

**Llamada del cliente**:

```graphql
mutation($args:inputCustomer){
      updateCustomer(args:$args)
  }
```

**Resolver real del backend viejo** (`api.bodasdehoy.com:/root/api-bodas/db/schemas/`):

```javascript
######
--- typedef ---
/root/api-bodas/db/schemas/stripe.js-  extend type Mutation {
/root/api-bodas/db/schemas/stripe.js:    updateCustomer(args:inputCustomer):String
/root/api-bodas/db/schemas/stripe.js-    createCheckoutSession(items:[inputItemsCheckout], email:String, cancel_url:String, mode:String, success_url:String):String
/root/api-bodas/db/schemas/stripe.js-    setCheckoutItems(unique:ID, args:[inputDetailsItemsCheckout]):String
/root/api-bodas/db/schemas/stripe.js-  }
/root/api-bodas/db/schemas/stripe.js-`
/root/api-bodas/db/schemas/stripe.js-
--- resolver (primeras 40 lineas) ---
/root/api-bodas/db/schemas/stripe.js:    updateCustomer: async (_, { args }, context) => {
/root/api-bodas/db/schemas/stripe.js-      const ht = dateAndEndpoint(context, "updateCustomer")
/root/api-bodas/db/schemas/stripe.js-      try {
/root/api-bodas/db/schemas/stripe.js-        console.time(ht)
/root/api-bodas/db/schemas/stripe.js-        const stripe = context.isProduction ? stripe_production : stripe_dev
/root/api-bodas/db/schemas/stripe.js-        await stripe.customers.update(
/root/api-bodas/db/schemas/stripe.js-          context.stripeCustomerId,
/root/api-bodas/db/schemas/stripe.js-          {
/root/api-bodas/db/schemas/stripe.js-            name: args?.name,
/root/api-bodas/db/schemas/stripe.js-            email: args?.email,
/root/api-bodas/db/schemas/stripe.js-            address: {
/root/api-bodas/db/schemas/stripe.js-              line1: args?.line1,
/root/api-bodas/db/schemas/stripe.js-              line2: args?.line2,
/root/api-bodas/db/schemas/stripe.js-              postal_code: args?.postalCode,
/root/api-bodas/db/schemas/stripe.js-              city: args?.city,
/root/api-bodas/db/schemas/stripe.js-              country: args?.country,
/root/api-bodas/db/schemas/stripe.js-            }
/root/api-bodas/db/schemas/stripe.js-          }
/root/api-bodas/db/schemas/stripe.js-        )
/root/api-bodas/db/schemas/stripe.js-        console.timeEnd(ht)
/root/api-bodas/db/schemas/stripe.js-        return "ok"
/root/api-bodas/db/schemas/stripe.js-      } catch (error) {
/root/api-bodas/db/schemas/stripe.js-        console.log(error)
/root/api-bodas/db/schemas/stripe.js-        console.timeEnd(ht)
/root/api-bodas/db/schemas/stripe.js-        return error
/root/api-bodas/db/schemas/stripe.js-      }
/root/api-bodas/db/schemas/stripe.js-    },
/root/api-bodas/db/schemas/stripe.js-    setCheckoutItems: async (_, { unique, args }, context) => {
/root/api-bodas/db/s
```

---

#### 📱 WhatsApp/FB Media

##### `mutation createWhatsappInvitationTemplate`

**Backend origen**: `apiapp.bodasdehoy.com`

**Llamada del cliente**:

```graphql
mutation($evento_id:ID, $data: JSON){
    createWhatsappInvitationTemplate(evento_id:$evento_id, data:$data)
  }
```

---

##### `mutation deleteWhatsappInvitationTemplate`

**Backend origen**: `apiapp.bodasdehoy.com`

**Llamada del cliente**:

```graphql
mutation($evento_id:ID, $template_id: ID){
    deleteWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id)
  }
```

---

##### `query getWhatsappInvitationTemplates`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

```
  evento_id: ID
  template_id: ID
```

**Llamada del cliente**:

```graphql
query($evento_id:ID){
    getWhatsappInvitationTemplates(evento_id:$evento_id)
  }
```

---

##### `mutation updateWhatsappInvitationTemplate`

**Backend origen**: `apiapp.bodasdehoy.com`

**Llamada del cliente**:

```graphql
mutation($evento_id:ID, $template_id: ID, $data: JSON){
    updateWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id, data:$data){
      _id
    }
  }
```

---

##### `mutation uploadBase64MediaToFacebook`

**Backend origen**: `apiapp.bodasdehoy.com`

**Llamada del cliente**:

```graphql
mutation($base64Image: String!, $fileName: String!, $development: String){
    uploadBase64MediaToFacebook(base64Image: $base64Image, fileName: $fileName, development: $development){
      success
      handle
      message
      error
    }
  }
```

---

##### `mutation uploadMediaToFacebook`

**Backend origen**: `apiapp.bodasdehoy.com`

**Llamada del cliente**:

```graphql
mutation($fileName: String!, $fileBuffer: String!, $fileType: String!, $development: String){
    uploadMediaToFacebook(fileName: $fileName, fileBuffer: $fileBuffer, fileType: $fileType, development: $development){
      success
      handle
      message
      error
    }
  }
```

---

## 6. Variables de entorno — estado actual y norma

```
CANÓNICAS (las únicas que deben existir):
  API_MCP_GRAPHQL_URL=https://api-mcp.eventosorganizador.com/graphql
  NEXT_PUBLIC_API_MCP_GRAPHQL_URL=https://api-mcp.eventosorganizador.com/graphql
  API_IA_URL=https://api-ia.eventosorganizador.com
  NEXT_PUBLIC_API_IA_URL=https://api-ia.eventosorganizador.com

LEGACY (deben desaparecer cuando api-mcp tenga los 18):
  NEXT_PUBLIC_BASE_URL           → apiapp.bodasdehoy.com
  NEXT_PUBLIC_IMAGES_BASE_URL    → apiapp.bodasdehoy.com
  NEXT_PUBLIC_BASE_API_BODAS     → api.bodasdehoy.com
  NEXT_PUBLIC_BASE_API_BODAS_URL → api.bodasdehoy.com

RETIRADOS hace 2 semanas (no usar):
  API_BODAS_URL, NEXT_PUBLIC_API_BODAS_URL
  API3_MCP_GRAPHQL_URL, NEXT_PUBLIC_API3_MCP_GRAPHQL_URL
  API2_URL, NEXT_PUBLIC_API2_URL, API_MCP_URL, GRAPHQL_ENDPOINT
  API3_IA_URL, NEXT_PUBLIC_API3_IA_URL
  PYTHON_BACKEND_URL, BACKEND_URL, BACKEND_INTERNAL_URL, NEXT_PUBLIC_BACKEND_URL

URLs muertas confirmadas:
  api3-ia.eventosorganizador.com    NXDOMAIN
  api3-mcp-graphql.eventosorganizador.com  NXDOMAIN
```

## 7. Plan de acción para api-mcp

```
FASE 1 — Implementar 18 endpoints faltantes (~4-6 horas)
  Prioridad P1 (críticos del flujo principal):
    💳 Stripe (4):  updateCustomer, createCheckoutSession, setCheckoutItems, getCheckoutItems
    👤 Auth (2):    createUserWithPassword, getEmailValid
    🏢 Directorio: getAllBusinesses, getAllProducts

  Prioridad P2 (features secundarias):
    📱 WhatsApp (4): createWhatsappInvitationTemplate, update, delete, getWhatsappInvitationTemplates
    📱 FB Media (2): uploadMediaToFacebook, uploadBase64MediaToFacebook
    🎫 EventTicket: getEventTicket
    👥 Guests: getPGuestEvent
    🎨 Templates: getVariableEmailTemplate, deleteGalerySvg

FASE 2 — Cliente AppEventos cambia URL (~30 min)
  apps/appEventos/utils/apiEndpoints.ts:
    Eliminar: DEFAULT_EVENTOS_ORIGIN, DEFAULT_BODAS_AUTH_GRAPHQL_URL
    Eliminar: resolveApiEventosOrigin, resolveApiEventosGraphqlUrl
    Eliminar: resolveApiBodasAuthOrigin, resolveApiBodasAuthGraphqlUrl
    Mantener solo: resolveApiBodasGraphqlUrl (api-mcp), resolveApiIaOrigin (api-ia)

FASE 3 — Smoke test E2E (~30 min)
  Verificar login + carga eventos + invitados + presupuesto + WhatsApp templates

FASE 4 — Apagar backends viejos (~5 min, requiere autorización)
  Droplet API-DIRECTORIO-BODAS-DE-HOY (137.184.148.28) → poweroff
  Droplet APP-GestionBodas (45.55.44.46)               → poweroff
```

## 8. Anexos

### 8.1 Schemas COMPLETOS api.bodasdehoy.com (typeDefs)

Vía SSH `ssh investigate-bodas` (en server api-mcp PROD `178.104.209.139`):

```bash
ssh investigate-bodas 'ls /root/api-bodas/db/schemas/'
# 25 archivos: aCategorias, aCategoriasPost, adjustment, ai, business,
# categoryBusiness, categoryPost, chat, codePage, development, eventTicket,
# home, magazine, notifications, page, post, review, scraper, search,
# socketIo, stripe, uploap, user, whatsapp, whiteLabel
```

Paquete offline también disponible:
```bash
# en server api-mcp PROD (178.104.209.139):
cd /tmp && tar xzf api-bodas-export.tar.gz
ls api-bodas-export/db/schemas/
```

### 8.2 typeDefs literales (primeros 5 schemas críticos)

```graphql

===========================================================
## SCHEMA: aCategorias.js
===========================================================
(no typeDefs)

===========================================================
## SCHEMA: aCategoriasPost.js
===========================================================
(no typeDefs)

===========================================================
## SCHEMA: adjustment.js
===========================================================
type roles {
    _id: ID!
    rol: String
    types: [String]
  }

  type adjustment {
    roles: [roles]
    rolesUser: [String]
    typesUser: [String]
    categoriesBusiness: [categories]
  }  
  
  type addToSet {
    acknowledged: Boolean
    modifiedCount: Int
    upsertedId: String
    upsertedCount: Int
    matchedCount: Int
  }

  type categories {
    categorie: String
    imgMiniatura: String
    imgBanner: String
    slug: String
    description: String
    features: [featuresBusiness]    
  }

  type categorie {
    title: String
    imgMiniatura: String
    imgBanner: String
    slug: String
    description: String
  }

  type item {
    categorie: categorie
    subCategories: [categorie]
  }
  
  type featuresBusiness {
    subCategories: [String]
    frequentQuestions: [String]
    accessories: [String]
    services: [String]
  }

  type featuresPost {
    subCategories: [String]
  }

  extend type Query {
    getAdjustment: adjustment
    getCategories: [item]
    getCategoriesPost: [item]
  }
  
  extend type Mutation {
    addAdjustment (variable: String, valor: [String]): addToSet
    delAdjustment (variable: String, valor: String): addToSet
  }

===========================================================
## SCHEMA: ai.js
===========================================================
type singleFetch {
   content:String
  }

  extend type Mutation {
    singleFetch(prompt : String): singleFetch
  }

===========================================================
## SCHEMA: business.js
===========================================================
type business {
  _id: ID
  userUid: ID
  slug: String
  permaLink: String
  tags: [String]
  contactName: String
  contactEmail: String
  businessName: String
  webPage: String
  landline: String
  mobilePhone: String
  whatsapp: String
  twitter: String
  facebook: String
  linkedin: String
  youtube: String
  instagram: String
  country: String
  city: String
  zip: String
  address: String
  description: String
  content: String
  coordinates: coordinate
  categories: [categoryBusiness]
  subCategories: [subCategoryBusiness]
  questionsAndAnswers: [questionsAndAnswers]
  characteristics: [characteristicsCms]
  items: [characteristicsItems]
  business_hours: dias
  
  imgCarrusel: [imageNew]
  imgMiniatura: imageNew
  imgLogo: imageNew
  reviews: [review]
  review: Float
  reviewsT: reviewsT
  
  fase: String
  status: String
  createdAt: Float
  updatedAt: Float
}
type reviewsT {
  total: Float
  professionalism: Float
  recommended: Float
  priceQuality: Float
  flexibility: Float
}

type coordinate {
  type: String
  coordinates: [Float]
}
input inputCoordinate {
  type: String
  coordinates: [Float]
  minDistance: Float
  maxDistance: Float
}

input inputBusiness {
  _id: ID
  userUid: ID
  slug: String
  permaLink: String
  tags: [String]
  contactName: String
  contactEmail: String
  businessName: String
  webPage: String
  landline: String
  mobilePhone: String
  whatsapp: String
  twitter: String
  facebook: String
  linkedin: String
  youtube: String
  instagram: String
  country: String
  city: String
  zip: String
  address: String
  description: String
  content: String
  coordinates: inputCoordinate
  subCategories: [inputObjectID]
  questionsAndAnswers: [inputQuestionsAndAnswers]
  characteristics: [inputCharacteristicsCms]
  business_hours: inputDias
  
  imgCarrusel: [Upload]
  imgMiniatura: Upload
  imgLogo: Upload
  status: Boolean
}


  type character {
    title: String
    check: Boolean
  }

  type image {
    _id: ID
    thumbnailUrl: String
    smallUrl: String
    mediumUrl: String
    largeUrl: Float
    createdAt: Float
  }

  type dias {
    lunes: horario
    martes: horario
    miercoles: horario
    jueves: horario
    viernes: horario
    sabado: horario
    domingo: horario
  }
  type horario {
    open: String
    close: String
  }

  type questionsAndAnswers {
    questions: questions
    answers: String
  }
  input inputQuestionsAndAnswers {
    questions: inputObjectID
    answers: String
  }

  input inputObjectID {
    _id: ID
  }

  type businessCms {
    _id: ID
    userUid: ID
    slug: String
    permaLink: String
    tags: [String]
    contactName: String
    contactEmail: String
    businessName: String
    webPage: String
    landline: String
    mobilePhone: String
    whatsapp: String
    twitter: String
    facebook: String
    linkedin: String
    youtube: String
    instagram: String
    country: String
    city: String
    zip: String
    address: String
    description: String
    content: String
    coordinates:coordinate
    categories: [categoryBusiness]
    subCategories: [subCategoryBusiness]
    questionsAndAnswers: [questionsAndAnswers]
    characteristics: [characteristicsCms]
    items: [characteristicsItems]
    business_hours: dias
    imgCarrusel: [imageNew]
    imgMiniatura: imageNew
    imgLogo: imageNew
    reviews: [review]
    review: Float
    reviewsT: reviewsT
    chatByUserQuery: ID
    
    fase: String
    status: Boolean
    createdAt: Float
    updatedAt: Float
    onLine: onLine
  }

  type onLine {
    status: Boolean
    dateConection: Float
  }

  type characteristicsCms {
    characteristic: characteristics
    items: [characteristicsItems]
  }

  input inputBusinessCms {
    userUid: ID
    slug: String
    permaLink: String
    tags: [String]
    contactName: String
    contactEmail: String
    businessName: String
    webPage: String
    landline: String
    mobilePhone: String
    whatsapp: String
    twitter: String
    facebook: String
    linkedin: String
    youtube: String
    instagram: String
    country: String
    city: String
    zip: String
    address: String
    description: String
    content: String
    coordinates:inputCoordinate
    subCategories: [inputObjectID]
    questionsAndAnswers: [inputQuestionsAndAnswers]
    characteristics: [inputCharacteristicsCms]
    business_hours: inputDias
    
    imgCarrusel: [Upload]
    imgMiniatura: Upload
    imgLogo: Upload
    status: Boolean
  }

  input inputBusinessMigration {
    _id: ID
    userUid: ID
    slug: String
    permaLink: String
    tags: [String]
    businessName: String
    webPage: String
    landline: String
    whatsapp: String
    twitter: String
    facebook: String
    linkedin: String
    youtube: String
    instagram: String
    country: String
    city: String
    zip: String
    address: String
    description: String
    content: String
    coordinates:[String]
    subCategories: [String]
    business_hours: inputDias
    
    imgCarrusel: [String]
    imgMiniatura: String
    imgLogo: String
  }

  input inputCharacteristicsCms {
    characteristic: inputObjectID
    items: [inputItem]
  }

  input inputItem {
    title: String
  }

  

  input inputDias {
    lunes: inputHorario
    martes: inputHorario
    miercoles: inputHorario
    jueves: inputHorario
    viernes: inputHorario
    sabado: inputHorario
    domingo: inputHorario
  }
  input inputHorario {
    open: String
    close: String
  }

  type salidaBusiness {
    total: Int
    results: [business]
  }

  type salidaBusinessCms {
    total: Int
    results: [businessCms]
  }

  input searchCriteriaBusiness {
    userUid: ID
    tags: [String]
    contactName: String
    contactEmail: String
    businessName: String
    webPage: String
    landline: String
    mobilePhone: String
    whatsapp: String
    twitter: String
    facebook: String
    linkedin: String
    youtube: String
    instagram: S
```

### 8.3 Schema apiapp.bodasdehoy.com (introspection JSON)

Disponible en server api-mcp PROD:

```bash
cat /var/www/api-production/APIAPP_SCHEMA_MUTATIONS.json | jq .
```

Tamaño: 26 KB. Total mutations: 93. Queries: 28.

### 8.4 Auditorías previas del equipo api-mcp (29-30 abril 2026)

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

## Fin del informe

Cualquier consulta sobre endpoints concretos: el detalle completo de cada uno
(args, resolver, body del cliente) está en la sección 5.2. Si necesitan más
información sobre algún endpoint específico, puedo extraer el código vía SSH
a `investigate-bodas` y proporcionarlo en el siguiente turno.

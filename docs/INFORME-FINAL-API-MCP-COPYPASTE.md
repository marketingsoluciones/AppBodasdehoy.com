```markdown
# 📋 INFORME COMPLETO — Endpoints faltantes en api-mcp

> **Para equipo api-mcp** — Para que sepan exactamente qué implementar.
> Generado vía cruce: cliente AppEventos ↔ apiapp.bodasdehoy.com ↔ api.bodasdehoy.com ↔ api-mcp PROD
> **18 endpoints faltantes** (9 de apiapp + 0 de api.bodasdehoy)

---

## 🎨 Mesas/SVG (1)

### `mutation deleteGalerySvg`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

_(sin args)_

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `deleteGalerySvg`):

```graphql
mutation ($evento_id: ID, $icon_id: ID) {
    deleteGalerySvg(evento_id: $evento_id, icon_id: $icon_id) 
  }
```

---

## 🎫 EventTicket (1)

### `query getEventTicket`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `args` | `inputEventTicket` | no |
| `sort` | `sortCriteriaEventTicket` | no |
| `skip` | `Int` | no |
| `limit` | `Int` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `getEventTicket`):

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

**Resolver del backend viejo** (vía SSH `investigate-bodas`, `/root/api-bodas/db/schemas/*.js`):

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

## 🏢 Directorio / Productos (2)

### `query getAllBusinesses`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `searchCriteria` | `searchCriteriaBusiness` | no |
| `sort` | `sortCriteriaBusiness` | no |
| `skip` | `Int` | no |
| `limit` | `Int` | no |
| `development` | `String!` | **SÍ** |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `getAllBusiness`):

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

**Resolver del backend viejo** (vía SSH `investigate-bodas`, `/root/api-bodas/db/schemas/*.js`):

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
### `query getAllProducts`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `grupo` | `String` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `getAllProducts`):

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
```

**Resolver del backend viejo** (vía SSH `investigate-bodas`, `/root/api-bodas/db/schemas/*.js`):

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

## 👤 Auth / User (3)

### `mutation createUserWithPassword`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `email` | `String` | no |
| `password` | `String` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `createUserWithPassword`):

```graphql
mutation($email:String, $password:String) { 
    createUserWithPassword(email:$email, password:$password)
  }
```

**Resolver del backend viejo** (vía SSH `investigate-bodas`, `/root/api-bodas/db/schemas/*.js`):

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
### `query getEmailValid`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `email` | `String` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `getEmailValid`):

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

**Resolver del backend viejo** (vía SSH `investigate-bodas`, `/root/api-bodas/db/schemas/*.js`):

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
### `query getVariableEmailTemplate`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `evento_id` | `String` | no |
| `template_id` | `String` | no |
| `selectVariable` | `String` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `getVariableEmailTemplate`):

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

## 👥 Invitados (1)

### `query getPGuestEvent`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `p` | `String` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `getPGuestEvent`):

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

## 💳 Stripe / Billing (4)

### `mutation createCheckoutSession`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `items` | `[inputItemsCheckout]` | no |
| `email` | `String` | no |
| `cancel_url` | `String` | no |
| `mode` | `String` | no |
| `success_url` | `String` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `createCheckoutSession`):

```graphql
mutation ($items:[inputItemsCheckout], $email:String, $cancel_url:String, $mode:String, $success_url:String){
    createCheckoutSession(items:$items, email:$email, cancel_url:$cancel_url, mode:$mode, success_url:$success_url)
  }
```

**Resolver del backend viejo** (vía SSH `investigate-bodas`, `/root/api-bodas/db/schemas/*.js`):

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
### `query getCheckoutItems`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `unique` | `ID` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `getCheckoutItems`):

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

**Resolver del backend viejo** (vía SSH `investigate-bodas`, `/root/api-bodas/db/schemas/*.js`):

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
### `mutation setCheckoutItems`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `unique` | `ID` | no |
| `args` | `[inputDetailsItemsCheckout]` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `setCheckoutItems`):

```graphql
mutation ( $unique:ID, $args:[inputDetailsItemsCheckout] )
  {
    setCheckoutItems(unique:$unique, args:$args)
  }
```

**Resolver del backend viejo** (vía SSH `investigate-bodas`, `/root/api-bodas/db/schemas/*.js`):

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
### `mutation updateCustomer`

**Backend origen**: `api.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `args` | `inputCustomer` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `updateCustomer`):

```graphql
mutation($args:inputCustomer){
      updateCustomer(args:$args)
  }
```

**Resolver del backend viejo** (vía SSH `investigate-bodas`, `/root/api-bodas/db/schemas/*.js`):

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

## 📱 WhatsApp / Facebook Media (6)

### `mutation createWhatsappInvitationTemplate`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

_(sin args)_

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `createWhatsappInvitationTemplate`):

```graphql
mutation($evento_id:ID, $data: JSON){
    createWhatsappInvitationTemplate(evento_id:$evento_id, data:$data)
  }
```

---
### `mutation deleteWhatsappInvitationTemplate`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

_(sin args)_

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `deleteWhatsappInvitationTemplate`):

```graphql
mutation($evento_id:ID, $template_id: ID){
    deleteWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id)
  }
```

---
### `query getWhatsappInvitationTemplates`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

| name | type | required |
|---|---|---|
| `evento_id` | `ID` | no |
| `template_id` | `ID` | no |

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `getWhatsappInvitationTemplates`):

```graphql
query($evento_id:ID){
    getWhatsappInvitationTemplates(evento_id:$evento_id)
  }
```

---
### `mutation updateWhatsappInvitationTemplate`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

_(sin args)_

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `updateWhatsappInvitationTemplate`):

```graphql
mutation($evento_id:ID, $template_id: ID, $data: JSON){
    updateWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id, data:$data){
      _id
    }
  }
```

---
### `mutation uploadBase64MediaToFacebook`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

_(sin args)_

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `uploadBase64MediaToFacebook`):

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
### `mutation uploadMediaToFacebook`

**Backend origen**: `apiapp.bodasdehoy.com`

**Args**:

_(sin args)_

**Llamada del cliente** (en `apps/appEventos/utils/Fetching.ts`, key `uploadMediaToFacebook`):

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

```

# Anexo — Shapes EXACTOS del backend viejo (api.bodasdehoy.com)

> **Generado**: 2026-05-15 vía SSH directo al droplet `API-DIRECTORIO-BODAS-DE-HOY` (137.184.148.28)
> **Origen**: `/root/api-bodas/db/schemas/*.js`
> **Propósito**: dar al equipo api-mcp los typeDefs GraphQL completos de los 5 dominios críticos para replicar 1:1 sin riesgo.

## Cómo verificar tú mismo (api-mcp)

Desde tu server (`178.104.209.139` / `mcp-graphql`):

```bash
# Acceso directo al backend viejo (read-only):
ssh investigate-bodas

# Schemas disponibles:
ls /root/api-bodas/db/schemas/

# Ver typeDef + resolver completo de un endpoint:
cat /root/api-bodas/db/schemas/stripe.js
```

Paquete offline también disponible en tu server:
```bash
cd /tmp && tar xzf api-bodas-export.tar.gz
ls api-bodas-export/db/schemas/
```

---

## TypeDefs por dominio (extraídos via SSH)


=====================================================================
  ARCHIVO: stripe.js (TypeDefs GraphQL completos)
=====================================================================
type itemsCheckout {
    currency: String
    amount: Int
    price: String
    name: String
    quantity: Int
  }

  type product{
    id: String
    name: String
    description: String
    images: [String]
    usage: Boolean
    subscriptionId: String
    current_period_start: Date
    current_period_end: Date
    prices: [price]
    metadata: metadataProducts
  }

  type invoice {
    number: String
    amount: Int
    created: Int
    currency: String
    status: String
    hostedInvoiceUrl: String
    invoicePdf: String
  }

  type salidaProducts{
    total: Int
    results: [product]
    currency: String
  }

  type salidaInvoices{
    total: Int
    results: [invoice]
  }

  type price {
    id: String
    currency: String
    unit_amount: Int
    recurring: recurring
  }

  type recurring {
    interval: String
    trial_period_days: String
  }

  type metadataProducts {
    grupo: String
    includes: String
    segmento: String
    tipo: String
    caracteristica: String
  }

  type customer {
    name: String
    email: String
    line1: String
    line2: String
    city: String
    postalCode: String
    country: String
  }

  input inputMetadataProducts{
    grupo: String
    includes: String
    segmento: String
    tipo: String  
    productId: String
    caracteristica: String
  }

  input inputItemsCheckout {
    price: String
    quantity: Int
    metadata: inputMetadataProducts
  }

  input inputDetailsItemsCheckout {
    email: String
    name: String
    phoneNumber: String
  }

  input inputCustomer {
    name: String
    email: String
    line1: String
    line2: String
    city: String
    zip: String
    postalCode: String
    country: String
  }
  
  extend type Query {
    testStripe(val1:String):String
    getAllProducts(grupo:String): salidaProducts
    getCheckoutItems(unique:ID):itemsCheckout
    getInvoices:salidaInvoices
    getCustomer:customer
  }
  
  extend type Mutation {
    updateCustomer(args:inputCustomer):String
    createCheckoutSession(items:[inputItemsCheckout], email:String, cancel_url:String, mode:String, success_url:String):String
    setCheckoutItems(unique:ID, args:[inputDetailsItemsCheckout]):String
  }

=====================================================================
  ARCHIVO: business.js (TypeDefs GraphQL completos)
=====================================================================
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
    instagram: String
    country: String
    cities: [String]
    zip: String
    description: String
    categories: [String]
    subCategories: [String]
    accessories: [String]
    services: [String]
    coordinates: inputCoordinate
    characteristics: [String]
    status: Boolean
  }

  input sortCriteriaBusiness {
    userUid: Int
    slug: Int
    permaLink: Int
    tags: Int
    contactName: Int
    contactEmail: Int
    businessName: Int
    webPage: Int
    landline: Int
    mobilePhone: Int
    whatsapp: Int
    twitter: Int
    facebook: Int
    linkedin: Int
    youtube: Int
    instagram: Int
    country: Int
    city: Int
    zip: Int
    address: Int
    subCategories: Int
    accessories: Int
    services: Int
    createdAt: Int
    updatedAt: Int
  }
  type localities {
    total: Int
    location: String
  }
  type salidaLocalities {
    total: Int
    results: [localities]
  }

  extend type Query {
    getBusinesses (uid:ID): [business]
    getOneBusiness (_id:ID, slug:String): businessCms
    """Todos los argumentos son opcionales: \n ( prop: "", valor: [""], propSort: "createdAt", valorSort: 1, skip: 0, limit: 100 )"""
    getAllBusinesses (searchCriteria:searchCriteriaBusiness, sort:sortCriteriaBusiness, skip: Int, limit:Int, development: String!): salidaBusinessCms
    getAllLocalities (categoriesId: [String]) :salidaLocalities
  }

  extend type Mutation {
    createBusiness (id:ID, fase: String, inputBusiness: inputBusiness, development: String!): businessCms
    createBusinessCms (id:ID, fase: String, args: inputBusinessCms, development: String!): businessCms
    deleteBusinesses (id:[ID]): String
    updateBusinessCms(_id:ID, args:inputBusiness):businessCms
    migrateBusiness (args: inputBusinessMigration): business
  }

=====================================================================
  ARCHIVO: notifications.js (TypeDefs GraphQL completos)
=====================================================================
type notification {
  _id:ID
  uid:String
  message:String
  state:String
  status:Boolean
  type:String
  fromUid:String
  focused:String
  createdAt:Float
  updatedAt:Float
}

input sortCriteriaNotification {
  uid:Int
  state:Int
  status:Int
  createdAt:Int
  updatedAt:Int
}

input inputNotifications {
  uids:[String]
  message:String
  type:String
  fromUid:String
  focused:String
}

input inputNotification {
  _id:[ID]
  uid:[String]
  message:String
  state:String
  status:Boolean
  type:String
  createdAt:Float
  updatedAt:Float
}

type salidaNotification {
  total: Int
  results: [notification]
}

extend type Query {
  getNotifications (args:inputNotification, sort:sortCriteriaNotification, skip: Int, limit:Int):salidaNotification
}

extend type Mutation {
  createNotifications(args:inputNotifications):salidaNotification
  updateNotifications(args:inputNotification):String
}

=====================================================================
  ARCHIVO: user.js (TypeDefs GraphQL completos)
=====================================================================
type metadata {
    creationTime: Date,
    lastSignInTime: Date
    lastRefreshTime: Date
  }
 
  type metricol {
    userId: String
    blogId: String
    whiteLabelLink: String
    analyticModeWhitelabelLink: String
  }

  type userFirebase {
    uid: ID
    email: String
    emailVerified: Boolean
    displayName: String
    photoURL: String
    phoneNumber: String
    disabled: Boolean
    onLine: onLineDate
    metadata: metadata
  }
  type onLineDate {
    status: Boolean
    dateConection: Date
  }

  type providerData {
    uid: String
    displayName: String
    email: String
    photoURL: String
    providerId: String
    phoneNumber: String
  }

  type authDevelopment {
    _id: ID
    title: String
    role: [String]
    typeRole: [String]
    status: Boolean
    eventSelected: ID
    createdAt: Float
    updatedAt: Float
  }

  type allUser {
    uid: String
    email: String
    emailVerified: String
    displayName: String
    disabled: String
    providerData: [providerData]
    authDevelopments: [authDevelopment]
    createdAt: Float
    updatedAt: Float
  }

  type salidaAllUsers {
    total: Int
    results: [allUser]
  }

  type User {
    _id: ID
    uid: ID
    email: String
    emailVerified: Boolean
    displayName: String
    photoURL: String
    phoneNumber: String
    disabled: Boolean
    role: [String]
    typeRole: [String]
    city: String
    country: String
    weddingDate: String
    signUpProgress: String
    status: Boolean
    onLine: onLine
    emailsContacs: [String]
    visibleColumns: [visibleColumn]
    createdAt: Date
    updatedAt: Date
    eventSelected: ID
    appAdjustments: appAdjustments
    currency:String
    authDevelopments: [authDevelopments]
  }

  type ServiceTaskOrder {
    taskId: ID
    columnId: String
    order: Int
  }

  type appAdjustments {
    serviceTasksOrder:[ServiceTaskOrder]
  }

  type visibleColumn {
    accessor: String
    show: Boolean
  }

  input inputVisibleColumn {
    accessor: String
    show: Boolean
  }

  type sessionCookie {
    sessionCookie: String
  }

  type customToken {
    customToken: String
  }

  type socialMedia {
    title: String
    link: String
    isVisible: Boolean
  }

  type nickName {
    _id: ID
    nickName: String
    socialMedia: [socialMedia]
    comment: Boolean
    trackbacks: Boolean
    imgAvatar: imageNew
    createdAt: Date
    updatedAt: Date
  }

  input inputSocialMedia {
    title: String
    link: String
    isVisible: Boolean
  }

  input inputNickName {
    uid:ID!
    nickName:String!
    socialMedia: [inputSocialMedia]
    comment: Boolean
    trackbacks: Boolean
    imgAvatar:Upload
    development:String!
  }

  type authDevelopments {
    title: String
    role: [String]
    typeRole: [String]
    status: Boolean
    nickNames: [nickName]
    eventSelected: ID
    metricol:metricol
    createdAt: Date
    updatedAt: Date
  }

  type valid {
    valid: Boolean
    reason: String
  }

  type validators {
    regex: valid
    typo: valid
    disposable: valid
    mx: valid
    smtp: valid
  }

  type emailValid {
    valid: Boolean
    validators: validators
    reason: String
  }
  
  type geoInfo{
    referer: String
    acceptLanguage: String
    loop: String
    connectingIp: String
    ipcountry: String
  }

  type result{
    success: Boolean
    error: String
  }

  type newUserFirebase{
    uid:String
    email:String
  }

  extend type Query {
    getAllUsers: salidaAllUsers
    getN8n:String
    getGeoInfo :geoInfo
    getSignInStatus(uid: ID): Boolean
    getAllUserFirebase: [userFirebase]
    getUserFirebase (uid: ID): userFirebase
    getUser (uid: ID): User
    getUsers (uids: [ID]): [User]
    queryenUser (variable: String, valor: String): User!
    getEmailValid(email:String):emailValid
  }

  input inputEmail {
    email: String
  }

  extend type Mutation {
    auth (idToken:String): sessionCookie
    validateRecaptcha(token:String): result
    status (sessionCookie:String): customToken
    signOut (sessionCookie:String): String
    createUser (
      uid: ID
      role: [String]
      typeRole: [String]
      city: String
      country: String
      weddingDate : String
      phoneNumber: String
      signUpProgress: String
      email: String
    ): User!
    deleteUserFirebase (uid: ID): String
    deleteAllUsersFirebase: String
    updateUser (uid: ID , variable: String, valor: String): String
    updateMetricol (uid:ID!): metricol
    createNickName (args:inputNickName): nickName
    updateNickName (args:inputNickName): nickName
    updateCurrency (currency:String): String
    deleteNickName (uid:ID!, nickName:String!, development:String!): String
    updateVisibleColumns (uid:ID!, args:[inputVisibleColumn]): [visibleColumn]
    updateStatusOnLine: [userFirebase]
    updateAccount: String
    updatePhoneNumber (uid: ID , phoneNumber: String): String
    updateFullName (uid: ID , fullName: String): String
    createUsersFirebase(emails:[inputEmail]):[newUserFirebase]
    createUserWithPassword(email:String, password:String):String
  }

=====================================================================
  ARCHIVO: eventTicket.js (TypeDefs GraphQL completos)
=====================================================================
type sventTicket {
  _id:ID
  title:String
  status:Boolean
  createdAt:Date
  updatedAt:Date
}

input sortCriteriaEventTicket {
  title:Int
  status:Int
  createdAt:Int
  updatedAt:Int
}

input inputEventTicket {
  _id:ID
  title:String
  status:Boolean
  createdAt:Date
  updatedAt:Date
}

type salidaEventTicket {
  total: Int
  results: [sventTicket]
}

extend type Query {
  getEventTicket (args:inputEventTicket, sort:sortCriteriaEventTicket, skip: Int, limit:Int):salidaEventTicket
}

extend type Mutation {
  createEventTicket(args:[inputEventTicket]):salidaEventTicket
  updateEventTicket(args:inputEventTicket):sventTicket
}

---

## Tabla resumen — Firmas de endpoints clave del backend viejo

Cruce exacto: cada endpoint que el cliente llama vs schema donde vive en api-bodas (137.184.148.28).

| Endpoint del cliente | Schema (api-bodas) | Firma GraphQL exacta |
|---|---|---|
| `auth` | user | `auth(idToken:String): sessionCookie` |
| `createUser` | user | `createUser(...)` (ver `user.js`) |
| `createUserWithPassword` | user | `createUserWithPassword(email:String, password:String):String` |
| `getUser` | user | `getUser(uid: ID): User` |
| `getUsers` | user | `getUsers(uids: [ID]): [User]` |
| `updateUser` | user | `updateUser(uid: ID, variable: String, valor: String): String` |
| `updateCustomer` | stripe | `updateCustomer(args:inputCustomer):String` |
| `getCustomer` | ⚠️ NO_FOUND en api-bodas | (probable en apiapp) |
| `createCheckoutSession` | stripe | `createCheckoutSession(items:[inputItemsCheckout], email, cancel_url, mode, success_url):String` |
| `setCheckoutItems` | stripe | `setCheckoutItems(unique:ID, args:[inputDetailsItemsCheckout]):String` |
| `getCheckoutItems` | stripe | `getCheckoutItems(unique:ID):itemsCheckout` |
| `createNotifications` | notifications | `createNotifications(args:inputNotifications):salidaNotification` |
| `getNotifications` | notifications | `getNotifications(args:inputNotification, sort:sortCriteriaNotification, skip:Int, limit:Int):salidaNotification` |
| `updateNotifications` | notifications | `updateNotifications(args:inputNotification):String` |
| `getAllBusinesses` | business | `getAllBusinesses(searchCriteria:searchCriteriaBusiness, sort:sortCriteriaBusiness, skip:Int, limit:Int, development:String!):salidaBusinessCms` |
| `getAllProducts` | stripe | `getAllProducts(grupo:String):salidaProducts` |
| `createEventTicket` | eventTicket | `createEventTicket(args:[inputEventTicket]):salidaEventTicket` |
| `getEventTicket` | eventTicket | `getEventTicket(args:inputEventTicket, sort:sortCriteriaEventTicket, skip:Int, limit:Int):salidaEventTicket` |
| `updateEventTicket` | eventTicket | `updateEventTicket(args:inputEventTicket):sventTicket` |
| `addCompartition` | ⚠️ NO_FOUND | (probable en apiapp) |
| `updateCompartition` | ⚠️ NO_FOUND | (probable en apiapp) |
| `deleteCompartition` | ⚠️ NO_FOUND | (probable en apiapp) |

### Cómo ver el resolver completo (NO solo la firma)

Desde el server de api-mcp:
```bash
ssh investigate-bodas
cat /root/api-bodas/db/schemas/stripe.js          # resolver updateCustomer/checkout/products
cat /root/api-bodas/db/schemas/user.js            # resolver auth/users
cat /root/api-bodas/db/schemas/business.js        # resolver directorio
cat /root/api-bodas/db/schemas/notifications.js   # resolver notificaciones
cat /root/api-bodas/db/schemas/eventTicket.js     # resolver tickets
```

Todos los schemas vienen incluidos en el paquete offline:
```bash
cd /tmp && tar xzf api-bodas-export.tar.gz
ls api-bodas-export/db/schemas/
```

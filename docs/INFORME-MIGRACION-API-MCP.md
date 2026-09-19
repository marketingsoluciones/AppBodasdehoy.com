# Informe migración cliente → api-mcp

**Fecha**: 2026-05-15  ·  **Generado por**: COORD-AppBodas (Claude)

**Objetivo**: dar a backend api-mcp la lista exhaustiva de queries/mutations que el cliente AppEventos llama y que aún NO existen en `api-mcp.eventosorganizador.com/graphql`. Cuando backend implemente, el cliente puede dejar de apuntar a `api.bodasdehoy.com` y `apiapp.bodasdehoy.com` (URLs a desaparecer).

## Resumen ejecutivo

- Ops únicas que envía el cliente: **106**
- Ya implementadas en api-mcp:     **0**
- Faltantes a implementar:         **106**

**Backends que el cliente aún consulta (deben desaparecer cuando api-mcp cubra todo):**
- `https://api.bodasdehoy.com/graphql` → auth, Stripe, notif, business, eventTicket
- `https://apiapp.bodasdehoy.com/graphql` → eventos, invitados, mesas, presupuesto, itinerario, …

## Faltantes por dominio

### Actividades (2)

#### `mutation updateActivity`

**Llamada del cliente** (key del objeto en Fetching.ts: `updateActivity`):

```graphql
mutation ($args:inputActivity){
    updateActivity(args:$args)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation updateActivityLink`

**Llamada del cliente** (key del objeto en Fetching.ts: `updateActivityLink`):

```graphql
mutation ($args:inputActivityLink){
    updateActivityLink(args:$args)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

### Auth / Usuario (7)

#### `mutation auth`

**Llamada del cliente** (key del objeto en Fetching.ts: `auth`):

```graphql
mutation ($idToken : String!){
    auth(idToken: $idToken){
      sessionCookie
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
auth (idToken:String): sessionCookie
```

---

#### `mutation createUser`

**Llamada del cliente** (key del objeto en Fetching.ts: `createUser`):

```graphql
mutation  ($uid : ID, $city: String, $country : String, $weddingDate : String, $phoneNumber : String, $role : [String]) {
    createUser(uid: $uid, city : $city, country : $country, weddingDate : $weddingDate, phoneNumber : $phoneNumber, role: $role){
          city
          country
          weddingDate
          phoneNumber
          role
        }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
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
```

---

#### `mutation createUserWithPassword`

**Llamada del cliente** (key del objeto en Fetching.ts: `createUserWithPassword`):

```graphql
mutation($email:String, $password:String) { 
    createUserWithPassword(email:$email, password:$password)
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
createUserWithPassword(email:String, password:String):String
```

---

#### `query getPreregister`

**Llamada del cliente** (key del objeto en Fetching.ts: `getPreregister`):

```graphql
query ($_id :ID){
    getPreregister(_id:$_id)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query getUser`

**Llamada del cliente** (key del objeto en Fetching.ts: `getUser`):

```graphql
query ($uid: ID) {
        getUser(uid:$uid){
          email
          photoURL
          onLine{
            status
          }
          displayName
          phoneNumber
          role
          typeRole
          city
          country
          weddingDate
          signUpProgress
          status
          eventSelected
          createdAt
          updatedAt
        }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
getUser (uid: ID): User
```

---

#### `query getUsers`

**Llamada del cliente** (key del objeto en Fetching.ts: `getUsers`):

```graphql
query ($uids:[ID]){
    getUsers(uids:$uids){
      uid
      email
      displayName
      photoURL
      onLine{
        status
        dateConection
      }
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
getUsers (uids: [ID]): [User]
```

---

#### `mutation updateUser`

**Llamada del cliente** (key del objeto en Fetching.ts: `updateUser`):

```graphql
mutation ($uid:ID, $variable:String, $valor:String){
    updateUser(uid:$uid, variable:$variable, valor:$valor){
      city
      country
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
updateUser (uid: ID , variable: String, valor: String): String
```

---

### Compartir evento (permisos) (3)

#### `mutation addCompartition`

**Llamada del cliente** (key del objeto en Fetching.ts: `addCompartitions`):

```graphql
mutation($args:inputCompartition){
    addCompartition(args:$args){
      compartido_array
      detalles_compartidos_array{
        email
        uid
        permissions{
          title
          value
        }
        createdAt
        updatedAt
      }
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation deleteCompartition`

**Llamada del cliente** (key del objeto en Fetching.ts: `deleteCompartitions`):

```graphql
mutation($args:inputCompartition){
    deleteCompartition(args:$args)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation updateCompartition`

**Llamada del cliente** (key del objeto en Fetching.ts: `updateCompartitions`):

```graphql
mutation($args:inputCompartition){
    updateCompartition(args:$args)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

### Directorio (Business/Products) (2)

#### `query getAllBusinesses`

**Llamada del cliente** (key del objeto en Fetching.ts: `getAllBusiness`):

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

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
getAllBusinesses (searchCriteria:searchCriteriaBusiness, sort:sortCriteriaBusiness, skip: Int, limit:Int, development: String!): salidaBusinessCms
```

---

#### `query getAllProducts`

**Llamada del cliente** (key del objeto en Fetching.ts: `getAllProducts`):

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
  // ... (truncado)
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
getAllProducts(grupo:String): salidaProducts
```

---

### Email Templates (7)

#### `mutation createEmailTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `createEmailTemplate`):

```graphql
mutation($evento_id:String, $design:JSON, $configTemplate:inputCongigTemplate, $html:String){
    createEmailTemplate(evento_id:$evento_id, design:$design, configTemplate:$configTemplate, html:$html){
      _id
      createdAt
      updatedAt
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation deleteEmailTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `deleteEmailTemplate`):

```graphql
mutation($evento_id:String, $template_id:String){
    deleteEmailTemplate(evento_id:$evento_id, template_id:$template_id)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query getEmailTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `getEmailTemplate`):

```graphql
query ($template_id:String){
    getEmailTemplate(template_id:$template_id){
      design
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query getEmailValid`

**Llamada del cliente** (key del objeto en Fetching.ts: `getEmailValid`):

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

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
getEmailValid(email:String):emailValid
```

---

#### `query getPreviewsEmailTemplates`

**Llamada del cliente** (key del objeto en Fetching.ts: `getPreviewsEmailTemplates`):

```graphql
query ($evento_id:String){
    getPreviewsEmailTemplates(evento_id:$evento_id){
      _id
      configTemplate{
        name
        subject
      }
      preview
      createdAt
      updatedAt
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query getVariableEmailTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `getVariableEmailTemplate`):

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

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation updateEmailTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `updateEmailTemplate`):

```graphql
mutation($evento_id:String, $template_id:String, $design:JSON, $configTemplate:inputCongigTemplate, $html:String){
    updateEmailTemplate(evento_id:$evento_id, template_id:$template_id, design:$design, configTemplate:$configTemplate, html:$html)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

### Eventos (7)

#### `mutation borrarEvento`

**Llamada del cliente** (key del objeto en Fetching.ts: `eventDelete`):

```graphql
mutation ($eventoID : String!) {
    borrarEvento(evento_id:$eventoID){
      modificado
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation crearEvento`

**Llamada del cliente** (key del objeto en Fetching.ts: `eventCreate`):

```graphql
mutation (
    $nombre: String,
    $tipo: String!,
    $fecha: String,
    $pais: String,
    $poblacion: String,
    $usuario_id: String!
    $usuario_nombre: String!
    $timeZone: String,
    $development: String!
  ){
    crearEvento(
      nombre: $nombre,
      tipo: $tipo,
      fecha: $fecha,
      pais: $pais,
      poblacion: $poblacion,
      usuario_id: $usuario_id,
      usuario_nombre: $usuario_nombre,
      timeZone: $timeZone,
      development: $development
    ){
      _id
      grupos_array
      compartido_array
      detalles_compartidos_array{
        email
        uid
 
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editEvento`

**Llamada del cliente** (key del objeto en Fetching.ts: `guardarListaRegalos`):

```graphql
mutation($evento_id: String!, $variable_reemplazar: String, $valor_reemplazar: String){
    editEvento(
      evento_id:$evento_id
      variable_reemplazar:$variable_reemplazar
      valor_reemplazar:$valor_reemplazar
    ){
      _id
      listaRegalos
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editEvento`

**Llamada del cliente** (key del objeto en Fetching.ts: `eventUpdate`):

```graphql
mutation ($idEvento: String!, $variable:String, $value : String){
    editEvento(
      evento_id: $idEvento, 
      variable_reemplazar: $variable, 
      valor_reemplazar: $value
      ){
      _id
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query getEventTicket`

**Llamada del cliente** (key del objeto en Fetching.ts: `getEventTicket`):

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

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
getEventTicket (args:inputEventTicket, sort:sortCriteriaEventTicket, skip: Int, limit:Int):salidaEventTicket
```

---

#### `query queryenEvento`

**Llamada del cliente** (key del objeto en Fetching.ts: `getEventsByID`):

```graphql
query ($variable: String, $valor: String, $development: String!) {
    queryenEvento( variable:$variable, valor:$valor, development:$development){
      _id
      development
      grupos_array
      compartido_array
      detalles_compartidos_array{
        email
        uid
        planSpaceSelect
        permissions{
          title
          value
        }
        createdAt
        updatedAt
      }
      estatus
      color
      temporada
      estilo
      tematica
      tarta
      nombre
      fecha_actualizacion
      fecha_creacion
      tipo
      usuario_id
      usuario_nombre
 
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query queryenEvento_id`

**Llamada del cliente** (key del objeto en Fetching.ts: `getListaRegalos`):

```graphql
query($_id: String){
    queryenEvento_id(
      var_1:$_id
    ){
      _id
      nombre
      listaRegalos
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

### Invitaciones (2)

#### `query getVariablesTemplatesInvitaciones`

**Llamada del cliente** (key del objeto en Fetching.ts: `getVariablesTemplatesInvitaciones`):

```graphql
query($evento_id:ID){
    getVariablesTemplatesInvitaciones(evento_id:$evento_id)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation testInvitacion`

**Llamada del cliente** (key del objeto en Fetching.ts: `testInvitacion`):

```graphql
mutation ($evento_id: String, $email: String, $phoneNumber: String, $lang: String){
    testInvitacion(evento_id:$evento_id, email:$email, phoneNumber:$phoneNumber, lang:$lang)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

### Invitados (5)

#### `mutation borraInvitados`

**Llamada del cliente** (key del objeto en Fetching.ts: `removeGuests`):

```graphql
mutation ($eventID:String, $guests: [String]){
      borraInvitados(evento_id:$eventID,
      invitados_ids_array:$guests){
        invitados_array{
          _id
          nombre
          sexo
          grupo_edad
          correo
          telefono
          nombre_mesa
          puesto
          asistencia
          rol
          father
          passesQuantity
        }
      }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation creaInvitado`

**Llamada del cliente** (key del objeto en Fetching.ts: `createGuests`):

```graphql
mutation ($eventID: String, $invitados_array: [invitAinput]) {
    creaInvitado(evento_id: $eventID, invitados_array: $invitados_array){
     invitados_array{
       father
       _id
       nombre
       grupo_edad
       correo
       telefono
       father
       passesQuantity
       nombre_mesa
       nombre_menu
       puesto
       asistencia
       rol
       correo
       sexo
       invitacion
       fecha_invitacion
     }
   }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editInvitado`

**Llamada del cliente** (key del objeto en Fetching.ts: `editGuests`):

```graphql
mutation ($eventID:String, $guestID:String, $variable: String, $value:String) {
    editInvitado(
      evento_id:$eventID, 
      invitado_id:$guestID, 
      variable_reemplazar:$variable,
      valor_reemplazar:$value){
        _id
        nombre
        grupo_edad
        correo
        telefono
        nombre_mesa
        nombre_menu
        puesto
        asistencia
        rol
        correo
        sexo
        invitacion
        fecha_invitacion
        movil
        poblacion
        pais
        direccion
        passesQuantity
      }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editTotalStimatedGuests`

**Llamada del cliente** (key del objeto en Fetching.ts: `editTotalStimatedGuests`):

```graphql
mutation ($evento_id:String, $children:Int, $adults:Int){
    editTotalStimatedGuests(evento_id:$evento_id,  children:$children, adults:$adults ){
    presupuesto_total
    viewEstimates
    coste_estimado
    coste_final
    pagado
    currency
    visibleColumns {
      accessor
      show
    }
    totalStimatedGuests {
      children
      adults
    }
    categorias_array{
      _id
      coste_proporcion
      coste_estimado
      coste_final
      pagado
      nombre
      gastos_array{
        _id
        coste_proporcion
        coste_estimado
        coste_final
        pagado
      
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query getPGuestEvent`

**Llamada del cliente** (key del objeto en Fetching.ts: `getPGuestEvent`):

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

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

### Mesas / Decoración (15)

#### `mutation borraMenu`

**Llamada del cliente** (key del objeto en Fetching.ts: `deleteMenu`):

```graphql
mutation ($eventID: String, $name: String) {
    borraMenu(evento_id:$eventID, nombre_menu: $name){
      menus_array{
        nombre_menu
        tipo
      }
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation borraMesa`

**Llamada del cliente** (key del objeto en Fetching.ts: `deleteTableOld`):

```graphql
mutation ($eventID:String, $tableID: String) {
    borraMesa(evento_id:$eventID,mesa_id:$tableID) {
      mesas_array{
           _id
           nombre_mesa
           tipo
           cantidad_sillas
           posicion {
             x
             y
           }
      }
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation creaMenu`

**Llamada del cliente** (key del objeto en Fetching.ts: `createMenu`):

```graphql
mutation ($eventID: String, $name: String) {
    creaMenu(evento_id:$eventID, nombre_menu: $name){
      menus_array{
        nombre_menu
        tipo
      }
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation createElement`

**Llamada del cliente** (key del objeto en Fetching.ts: `createElement`):

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $values: String) {
    createElement(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, values:$values) {
      _id
      title
      rotation
      position{
        x
        y
      }
      size{
        width
        height
      }
      tipo
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation createGalerySvgs`

**Llamada del cliente** (key del objeto en Fetching.ts: `createGalerySvgs`):

```graphql
mutation ($evento_id: ID, $galerySvgs:[inputGalerySvg]) {
    createGalerySvgs(evento_id: $evento_id, galerySvgs: $galerySvgs) {
      total
      results{
        _id
        title
        icon
        tipo
      }
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `unknown createTable`

**Llamada del cliente** (key del objeto en Fetching.ts: `createTable`):

```graphql
mutation ($eventID:String, $tableName: String, $tableType:String, $numberChairs:  Int, $position: [posicionAinput]) {
  //   creaMesa(evento_id:$eventID,mesas_array:{nombre_mesa:$tableName, tipo:$tableType, cantidad_sillas:$numberChairs, posicion:$position}){
  //     mesas_array{
  //       _id
  //       nombre_mesa
  //       tipo
  //       cantidad_sillas
  //       posicion {
  //         x
  //         y
  //       }
  //     }
  //   }
  // }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation createTable`

**Llamada del cliente** (key del objeto en Fetching.ts: `createTable`):

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $values: String) {
    createTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, values:$values) {
      _id
      title
      rotation
      position{
        x
        y
      }
      size{
        width
        height
      }
      tipo
      numberChair
      guests{
        _id
        chair
        order
      }
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation deleteElement`

**Llamada del cliente** (key del objeto en Fetching.ts: `deleteElement`):

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $elementID: ID) {
    deleteElement(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, elementID:$elementID) 
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation deleteGalerySvg`

**Llamada del cliente** (key del objeto en Fetching.ts: `deleteGalerySvg`):

```graphql
mutation ($evento_id: ID, $icon_id: ID) {
    deleteGalerySvg(evento_id: $evento_id, icon_id: $icon_id) 
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation deleteTable`

**Llamada del cliente** (key del objeto en Fetching.ts: `deleteTable`):

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID) {
    deleteTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, tableID:$tableID) 
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editElement`

**Llamada del cliente** (key del objeto en Fetching.ts: `editElement`):

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $elementID: ID, $variable: String, $valor: String) {
    editElement(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, elementID:$elementID, variable:$variable, valor:$valor) {
      _id
      title
      rotation
      position{
        x
        y
      }
      size{
        width
        height
      }
      tipo
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editMesa`

**Llamada del cliente** (key del objeto en Fetching.ts: `editTableOld`):

```graphql
mutation ($eventID:String, $tableID: String, $variable: String, $coordenadas: [posicionAinput]) {
    editMesa(evento_id:$eventID,mesa_id:$tableID, variable_reemplazar:$variable, coordenadas:$coordenadas) {
      _id
      nombre_mesa
      posicion {
        x
        y
      }
      cantidad_sillas
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editMesa`

**Llamada del cliente** (key del objeto en Fetching.ts: `editNameTable`):

```graphql
mutation ($eventID:String, $tableID: String, $variable: String, $valor_reemplazar: String) {
    editMesa(evento_id:$eventID,mesa_id:$tableID, variable_reemplazar:$variable, valor_reemplazar:$valor_reemplazar) {
      _id
      nombre_mesa
      posicion {
        x
        y
      }
      cantidad_sillas
      tipo
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editTable`

**Llamada del cliente** (key del objeto en Fetching.ts: `editTable`):

```graphql
mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID, $variable: String, $valor: String) {
    editTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, tableID:$tableID, variable:$variable, valor:$valor) {
      _id
      title
      rotation
      position{
        x
        y
      }
      size{
        width
        height
      }
      tipo
      numberChair
      guests{
        _id
        chair
        order
      }
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query getGalerySvgs`

**Llamada del cliente** (key del objeto en Fetching.ts: `getGalerySvgs`):

```graphql
query ($evento_id: ID, $tipo: String) {
    getGalerySvgs(evento_id: $evento_id, tipo: $tipo) {
      total
      results{
        _id
        title
        icon
        tipo
      }
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

### Notificaciones (3)

#### `mutation createNotifications`

**Llamada del cliente** (key del objeto en Fetching.ts: `createNotifications`):

```graphql
mutation ($args:inputNotifications){
    createNotifications(args:$args){
      total
      results{
        _id
      }
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
createNotifications(args:inputNotifications):salidaNotification
```

---

#### `query getNotifications`

**Llamada del cliente** (key del objeto en Fetching.ts: `getNotifications`):

```graphql
query ($args:inputNotification, $sort:sortCriteriaNotification, $skip:Int, $limit:Int){
    getNotifications(args:$args, sort:$sort, skip:$skip, limit:$limit){
      total
      results{
        _id
        uid
        message
        state
        type
        fromUid
        focused
        createdAt
        updatedAt
      }
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
getNotifications (args:inputNotification, sort:sortCriteriaNotification, skip: Int, limit:Int):salidaNotification
```

---

#### `mutation updateNotifications`

**Llamada del cliente** (key del objeto en Fetching.ts: `updateNotifications`):

```graphql
mutation ($args:inputNotification){
    updateNotifications(args:$args)
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
updateNotifications(args:inputNotification):String
```

---

### Otros (7)

#### `mutation creaGrupo`

**Llamada del cliente** (key del objeto en Fetching.ts: `createGroup`):

```graphql
mutation ($eventID: String, $name: String) {
    creaGrupo(evento_id:$eventID, nombre_grupo: $name){
      grupos_array
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editVisibleColumns`

**Llamada del cliente** (key del objeto en Fetching.ts: `editVisibleColumns`):

```graphql
mutation ($evento_id:String, $visibleColumns:[inputVisibleColumn]){
    editVisibleColumns(evento_id:$evento_id, visibleColumns:$visibleColumns ){
      presupuesto_total
      viewEstimates
      coste_estimado
      coste_final
      pagado
      currency
      visibleColumns {
        accessor
        show
      }
      totalStimatedGuests {
        children
        adults
      }
      categorias_array{
        _id
        coste_proporcion
        coste_estimado
        coste_final
        pagado
        nombre
        gastos_array{
          _id
          coste_proporcion
          coste_
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `unknown getDevelopment`

**Llamada del cliente** (key del objeto en Fetching.ts: `getDevelopment`):

```graphql
query {
    getMyDevelopment{
      _id
      development
      domain
      message{
        _id
        name
        message
      }
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
getDevelopment(args: DevelopmentInput): Development
```

---

#### `unknown getGeoInfo`

**Llamada del cliente** (key del objeto en Fetching.ts: `getGeoInfo`):

```graphql
query  {
    getGeoInfo {
      referer
      acceptLanguage
      loop
      connectingIp
      ipcountry
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `unknown getInvoices`

**Llamada del cliente** (key del objeto en Fetching.ts: `getInvoices`):

```graphql
query{
    getInvoices{
      total
      results{
        number
        amount
        created
        status
        hostedInvoiceUrl
        invoicePdf
        currency
      }
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation signOut`

**Llamada del cliente** (key del objeto en Fetching.ts: `signOut`):

```graphql
mutation ($sessionCookie :String){
    signOut(sessionCookie:$sessionCookie)
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
signOut (sessionCookie:String): String
```

---

#### `mutation status`

**Llamada del cliente** (key del objeto en Fetching.ts: `authStatus`):

```graphql
mutation ($sessionCookie : String){
        status(sessionCookie: $sessionCookie){
          customToken
        }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
status (sessionCookie:String): customToken
```

---

### Presupuesto / Plan Espacios (20)

#### `mutation addWeddingPlannerIngreso`

**Llamada del cliente** (key del objeto en Fetching.ts: `addWeddingPlannerIngreso`):

```graphql
mutation($evento_id:String, $weddingPlannerIngreso:WeddingPlannerIngresoInput ){
    addWeddingPlannerIngreso(evento_id:$evento_id, weddingPlannerIngreso:$weddingPlannerIngreso){
      _id
      fecha
      monto
      metodo
      referencia
      createdAt
      updatedAt
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation borraCategoria`

**Llamada del cliente** (key del objeto en Fetching.ts: `borraCategoria`):

```graphql
mutation( $evento_id:String $categoria_id:String){
    borraCategoria(evento_id:$evento_id, categoria_id: $categoria_id){
      coste_final
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation borraGasto`

**Llamada del cliente** (key del objeto en Fetching.ts: `borrarGasto`):

```graphql
mutation($evento_id: String, $categoria_id: String, $gasto_id: String){
                borraGasto(evento_id:$evento_id, categoria_id:$categoria_id,gasto_id:$gasto_id){
                  coste_final
                  coste_estimado
                  pagado
                  categorias_array {
                    coste_estimado
                    coste_final
                    pagado
                  }
                }
              }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation borraItemsGastos`

**Llamada del cliente** (key del objeto en Fetching.ts: `borrarItemsGastos`):

```graphql
mutation($evento_id: ID, $categoria_id: ID, $gasto_id: ID, $itemsGastos_ids: [ID]){ 
    borraItemsGastos(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, itemsGastos_ids:$itemsGastos_ids){
      presupuesto_total
      viewEstimates
      coste_estimado
      coste_final
      pagado
      currency
      visibleColumns {
        accessor
        show
      }
      totalStimatedGuests{
        children
        adults
      }
      categorias_array{
        _id
        coste_proporcion
        coste_estimado
        coste_final
        pagado
        nombre
        gastos_a
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation borraPago`

**Llamada del cliente** (key del objeto en Fetching.ts: `deletepayment`):

```graphql
mutation($evento_id:String, $categoria_id:String, $gasto_id:String, $pago_id:String){
    borraPago(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, pago_id:$pago_id){
      pagado
      categorias_array{
        pagado
        gastos_array{
          pagado
        }
      }
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation createPsTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `createPsTemplate`):

```graphql
mutation ($eventID:ID, $planSpaceID:ID, $title:String, $uid:String ) {
    createPsTemplate(eventID:$eventID, planSpaceID:$planSpaceID, title:$title, uid:$uid) {
      _id
      title
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation deleteWeddingPlannerIngreso`

**Llamada del cliente** (key del objeto en Fetching.ts: `deleteWeddingPlannerIngreso`):

```graphql
mutation($evento_id:String, $weddingPlannerIngreso_id:ID){
    deleteWeddingPlannerIngreso(evento_id:$evento_id, weddingPlannerIngreso_id:$weddingPlannerIngreso_id)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation duplicatePresupuesto`

**Llamada del cliente** (key del objeto en Fetching.ts: `duplicatePresupuesto`):

```graphql
mutation ($eventID:String, $eventDestinationID:String){
    duplicatePresupuesto(eventID:$eventID,  eventDestinationID:$eventDestinationID ){
    presupuesto_total
    viewEstimates
    coste_estimado
    coste_final
    pagado
    currency
    visibleColumns {
      accessor
      show
    }
    totalStimatedGuests{
      children
      adults
    }
    categorias_array{
      _id
      coste_proporcion
      coste_estimado
      coste_final
      pagado
      nombre
      gastos_array{
        _id
        coste_proporcion
        coste_estimado
        coste_final
        pagado
        nomb
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editCategoria`

**Llamada del cliente** (key del objeto en Fetching.ts: `editCategoria`):

```graphql
mutation( $evento_id:String $categoria_id:String $nombre:String){
    editCategoria(evento_id:$evento_id, categoria_id: $categoria_id, nombre: $nombre){
      coste_estimado
      coste_final
      pagado
      currency
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editGasto`

**Llamada del cliente** (key del objeto en Fetching.ts: `editGasto`):

```graphql
mutation($evento_id: ID, $categoria_id: ID, $gasto_id: ID, $variable_reemplazar: String, $valor_reemplazar: StringIntBool){
                editGasto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, variable_reemplazar:$variable_reemplazar, valor_reemplazar:$valor_reemplazar){
                presupuesto_total
                viewEstimates
                coste_estimado
                coste_final
                pagado
                currency
                visibleColumns {
                  accessor
                  show
                }
                totalStimated
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editItemGasto`

**Llamada del cliente** (key del objeto en Fetching.ts: `editItemGasto`):

```graphql
mutation($evento_id: ID ,$categoria_id: ID, $gasto_id: ID, $itemGasto_id: ID, $variable: String, $valor: StringIntBool){
    editItemGasto(evento_id:$evento_id, categoria_id: $categoria_id, gasto_id: $gasto_id, itemGasto_id: $itemGasto_id, variable: $variable, valor: $valor){
      presupuesto_total
      viewEstimates
      coste_estimado
      coste_final
      pagado
      currency
      visibleColumns {
        accessor
        show
      }
      totalStimatedGuests{
        children
        adults
      }
      categorias_array{
        _id
        coste_proporcion
        coste_estimado

```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editPago`

**Llamada del cliente** (key del objeto en Fetching.ts: `editPago`):

```graphql
mutation($evento_id:String, $categoria_id:String, $gasto_id: String, $pago_id:String,$pagos_array:pagos_arrayAinput){
                  editPago(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id,pago_id:$pago_id, pagos_array:$pagos_array){
                    categorias_array{
                      pagado
                      gastos_array{
                        pagado 
                        pagos_array{
                          _id
                          estado
                          fecha_creacion
                          fecha_pago
                          fe
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editPresupuesto`

**Llamada del cliente** (key del objeto en Fetching.ts: `editPresupuesto`):

```graphql
mutation($evento_id:String, $coste_estimado:Float, $viewEstimates:Boolean, $presupuesto_total:Float ){
    editPresupuesto( evento_id:$evento_id, coste_estimado:$coste_estimado, viewEstimates:$viewEstimates,  presupuesto_total:$presupuesto_total){
      presupuesto_total
      viewEstimates
      coste_final
      coste_estimado
      pagado
      currency
      visibleColumns {
        accessor
        show
      }
      totalStimatedGuests{
        children
        adults
      }
      categorias_array {
        _id
        coste_proporcion
        coste_estimado
        coste_final
        
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query getPlanSpaceSelect`

**Llamada del cliente** (key del objeto en Fetching.ts: `getPlanSpaceSelect`):

```graphql
query ($evento_id: ID, $isOwner: Boolean) {
    getPlanSpaceSelect(evento_id: $evento_id, isOwner: $isOwner)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query getPsTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `getPsTemplate`):

```graphql
query ($uid: String, $evento_id: ID!, $development: String!) {
    getPsTemplate(uid: $uid, evento_id: $evento_id, development: $development) {
      _id
      title
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation nuevoCategoria`

**Llamada del cliente** (key del objeto en Fetching.ts: `nuevoCategoria`):

```graphql
mutation ($evento_id: String, $nombre: String){
    nuevoCategoria(evento_id:$evento_id, nombre:$nombre){
      _id
      coste_proporcion
      coste_estimado
      coste_final
      pagado
      nombre
      gastos_array {
        _id
        coste_estimado
        coste_final
        pagado
        nombre
        pagos_array {
          _id
          estado
          fecha_creacion
          fecha_pago
          fecha_vencimiento
          medio_pago
          importe
        }
        items_array{
          _id
          next_id
          unidad
          cantidad
          nombre
        
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation nuevoGasto`

**Llamada del cliente** (key del objeto en Fetching.ts: `nuevoGasto`):

```graphql
mutation($evento_id: String ,$categoria_id: String, $nombre: String){
              nuevoGasto(evento_id:$evento_id, categoria_id:$categoria_id,nombre:$nombre){
                _id
                coste_proporcion
                coste_estimado
                coste_final
                pagado
                nombre
                linkTask
                estatus
                pagos_array{
                  _id
                  estado
                  fecha_creacion
                  fecha_pago
                  fecha_vencimiento
                  medio_pago
                  importe
   
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation nuevoItemGasto`

**Llamada del cliente** (key del objeto en Fetching.ts: `nuevoItemGasto`):

```graphql
mutation($evento_id: ID, $categoria_id: ID, $gasto_id: ID, $itemGasto:itemGastoInput){ 
    nuevoItemGasto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, itemGasto:$itemGasto){
      _id
      next_id
      unidad
      cantidad
      nombre
      valor_unitario
      total
      estatus
      fecha_creacion
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation nuevoPago`

**Llamada del cliente** (key del objeto en Fetching.ts: `nuevoPago`):

```graphql
mutation($evento_id:String, $categoria_id:String, $gasto_id: String,$pagos_array:[pagos_arrayAinput]){
                  nuevoPago(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, pagos_array:$pagos_array){
                    pagado
                    categorias_array{
                      pagado
                      gastos_array{
                        _id
                        coste_proporcion
                        coste_estimado
                        coste_final
                        pagado 
                        nombre 
                        linkTask 

```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation setPlanSpaceSelect`

**Llamada del cliente** (key del objeto en Fetching.ts: `setPlanSpaceSelect`):

```graphql
mutation ($evento_id: ID, $planSpaceSelect: ID, $isOwner: Boolean) {
    setPlanSpaceSelect(evento_id: $evento_id, planSpaceSelect: $planSpaceSelect, isOwner: $isOwner)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

### Stripe / Billing (5)

#### `mutation createCheckoutSession`

**Llamada del cliente** (key del objeto en Fetching.ts: `createCheckoutSession`):

```graphql
mutation ($items:[inputItemsCheckout], $email:String, $cancel_url:String, $mode:String, $success_url:String){
    createCheckoutSession(items:$items, email:$email, cancel_url:$cancel_url, mode:$mode, success_url:$success_url)
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
createCheckoutSession(items:[inputItemsCheckout], email:String, cancel_url:String, mode:String, success_url:String):String
```

---

#### `query getCheckoutItems`

**Llamada del cliente** (key del objeto en Fetching.ts: `getCheckoutItems`):

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

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
getCheckoutItems(unique:ID):itemsCheckout
```

---

#### `unknown getCustomer`

**Llamada del cliente** (key del objeto en Fetching.ts: `getCustomer`):

```graphql
query{
    getCustomer{
      name
      email
      line1
      line2
      postalCode
      city
      country
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation setCheckoutItems`

**Llamada del cliente** (key del objeto en Fetching.ts: `setCheckoutItems`):

```graphql
mutation ( $unique:ID, $args:[inputDetailsItemsCheckout] )
  {
    setCheckoutItems(unique:$unique, args:$args)
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
setCheckoutItems(unique:ID, args:[inputDetailsItemsCheckout]):String
```

---

#### `mutation updateCustomer`

**Llamada del cliente** (key del objeto en Fetching.ts: `updateCustomer`):

```graphql
mutation($args:inputCustomer){
      updateCustomer(args:$args)
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
updateCustomer(args:inputCustomer):String
```

---

### Tareas / Itinerario (7)

#### `mutation addTaskAttachments`

**Llamada del cliente** (key del objeto en Fetching.ts: `addTaskAttachments`):

```graphql
mutation ($eventID: String, $itinerarioID: String, $taskID: String, $attachment: inputFileData) {
    addTaskAttachments(eventID: $eventID, itinerarioID: $itinerarioID, taskID: $taskID, attachment: $attachment)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation createItinerario`

**Llamada del cliente** (key del objeto en Fetching.ts: `createItinerario`):

```graphql
mutation ($eventID:String, $title:String, $dateTime:String, $tipo:String, $next_id:ID){
    createItinerario(eventID:$eventID, title:$title, dateTime:$dateTime, tipo:$tipo, next_id:$next_id ){
      _id
      next_id
      title
      tasks{
        _id
        fecha
        hora
        horaActiva
        icon
        descripcion
        responsable
        duracion
        tags
        tips
        estatus
        attachments{
          _id
          name
          url
          size
          createdAt
          updatedAt
        }
        spectatorView
        comments{
          _id
     
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation createTask`

**Llamada del cliente** (key del objeto en Fetching.ts: `createTask`):

```graphql
mutation ($eventID:String, $itinerarioID:String, $fecha:String, $descripcion:String, $hora:String, $duracion:Int){
    createTask(eventID:$eventID, itinerarioID:$itinerarioID, fecha:$fecha, descripcion:$descripcion, hora:$hora, duracion:$duracion ){
      _id
      fecha
      hora
      horaActiva
      icon
      descripcion
      responsable
      duracion
      tags
      tips
      estatus
      attachments{
        _id
        name
        url
        size
        createdAt
        updatedAt
      }
      spectatorView
      comments{
        _id
        comment
        uid
        creat
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation deleteTaskAttachment`

**Llamada del cliente** (key del objeto en Fetching.ts: `deleteTaskAttachment`):

```graphql
mutation ($eventID: String, $itinerarioID: String, $taskID: String, $attachmentID: String) {
    deleteTaskAttachment(eventID: $eventID, itinerarioID: $itinerarioID, taskID: $taskID, attachmentID: $attachmentID)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation duplicateItinerario`

**Llamada del cliente** (key del objeto en Fetching.ts: `duplicateItinerario`):

```graphql
mutation ($eventID:String, $itinerarioID:String, $eventDestinationID:String, $next_id:ID, $storageBucket:String){
    duplicateItinerario(eventID:$eventID, itinerarioID:$itinerarioID, eventDestinationID:$eventDestinationID, next_id:$next_id, storageBucket:$storageBucket){
      _id
      next_id
      title
      tasks{
        _id
        fecha
        hora
        horaActiva
        icon
        descripcion
        responsable
        duracion
        tags
        tips
        estatus
        attachments{
          _id
          name
          url
          size
          createdAt
         
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editItinerario`

**Llamada del cliente** (key del objeto en Fetching.ts: `editItinerario`):

```graphql
mutation ($eventID:String, $itinerarioID:String, $variable:String, $valor:String, $next_id:ID){
    editItinerario(eventID:$eventID itinerarioID:$itinerarioID, variable:$variable, valor:$valor, next_id:$next_id )
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation editTask`

**Llamada del cliente** (key del objeto en Fetching.ts: `editTask`):

```graphql
mutation ($eventID:String, $itinerarioID:String, $taskID:String, $variable:String, $valor:String){
    editTask(eventID:$eventID itinerarioID:$itinerarioID  taskID:$taskID  variable:$variable  valor:$valor )
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

### Uploads / Media (3)

#### `mutation singleUpload`

**Llamada del cliente** (key del objeto en Fetching.ts: `singleUpload`):

```graphql
mutation($file:Upload!,$use:String)
  {
    singleUpload(file:$file,use:$use){
      _id
      i640
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
singleUpload(
      file: Upload!
      _id: String
      use: String
    ): File
```

---

#### `mutation uploadBase64MediaToFacebook`

**Llamada del cliente** (key del objeto en Fetching.ts: `uploadBase64MediaToFacebook`):

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

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation uploadMediaToFacebook`

**Llamada del cliente** (key del objeto en Fetching.ts: `uploadMediaToFacebook`):

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

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

### WhatsApp (11)

#### `mutation createWhatsappInvitationTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `createWhatsappInvitationTemplate`):

```graphql
mutation($evento_id:ID, $data: JSON){
    createWhatsappInvitationTemplate(evento_id:$evento_id, data:$data)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation createWhatsappTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `createWhatsappTemplate`):

```graphql
mutation( $data:JSON, $development:String!){
    createWhatsappTemplate(data:$data, development:$development){
      _id
      title
      content
      createdAt
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation deleteWhatsappInvitationTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `deleteWhatsappInvitationTemplate`):

```graphql
mutation($evento_id:ID, $template_id: ID){
    deleteWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query getWhatsappInvitationTemplates`

**Llamada del cliente** (key del objeto en Fetching.ts: `getWhatsappInvitationTemplates`):

```graphql
query($evento_id:ID){
    getWhatsappInvitationTemplates(evento_id:$evento_id)
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation updateWhatsappInvitationTemplate`

**Llamada del cliente** (key del objeto en Fetching.ts: `updateWhatsappInvitationTemplate`):

```graphql
mutation($evento_id:ID, $template_id: ID, $data: JSON){
    updateWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id, data:$data){
      _id
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `mutation whatsappCreateSession`

**Llamada del cliente** (key del objeto en Fetching.ts: `whatsappCreateSession`):

```graphql
mutation ($args: CreateWhatsAppSessionArgs!) {
    whatsappCreateSession(args: $args) {
      success
      session {
        id
        development
        userId
        isConnected
        qrCode
        phoneNumber
        connectionTime
        lastActivity
      }
      qrCode
      error
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
whatsappCreateSession(args: CreateWhatsAppSessionArgs!): CreateSessionResponse!
```

---

#### `mutation whatsappDisconnectSession`

**Llamada del cliente** (key del objeto en Fetching.ts: `whatsappDisconnectSession`):

```graphql
mutation ($args: DisconnectWhatsAppSessionArgs!) {
    whatsappDisconnectSession(args: $args) {
      success
      error
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
whatsappDisconnectSession(args: DisconnectWhatsAppSessionArgs!): DisconnectSessionResponse!
```

---

#### `unknown whatsappGetAllSessions`

**Llamada del cliente** (key del objeto en Fetching.ts: `whatsappGetAllSessions`):

```graphql
query {
    whatsappGetAllSessions {
      id
      development
      userId
      isConnected
      qrCode
      phoneNumber
      connectionTime
      lastActivity
    }
  }
```

_Schema en backend viejo: no encontrado en api-bodas (probablemente en apiapp)._

---

#### `query whatsappGetSession`

**Llamada del cliente** (key del objeto en Fetching.ts: `whatsappGetSession`):

```graphql
query ($args: GetWhatsAppSessionArgs!) {
    whatsappGetSession(args: $args) {
      id
      development
      userId
      isConnected
      qrCode
      phoneNumber
      connectionTime
      lastActivity
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
whatsappGetSession(args: GetWhatsAppSessionArgs!): WhatsAppSession
```

---

#### `mutation whatsappRegenerateQR`

**Llamada del cliente** (key del objeto en Fetching.ts: `whatsappRegenerateQR`):

```graphql
mutation ($sessionId: String!) {
    whatsappRegenerateQR(sessionId: $sessionId) {
      success
      session {
        id
        development
        userId
        isConnected
        qrCode
        phoneNumber
        connectionTime
        lastActivity
      }
      qrCode
      error
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
whatsappRegenerateQR(sessionId: String!): CreateSessionResponse!
```

---

#### `mutation whatsappSendMessage`

**Llamada del cliente** (key del objeto en Fetching.ts: `whatsappSendMessage`):

```graphql
mutation ($args: SendWhatsAppMessageArgs!) {
    whatsappSendMessage(args: $args) {
      success
      messageId
      error
    }
  }
```

**Schema actual en backend viejo (`api.bodasdehoy.com`)**:

```graphql
whatsappSendMessage(args: SendWhatsAppMessageArgs!): SendMessageResponse!
```

---


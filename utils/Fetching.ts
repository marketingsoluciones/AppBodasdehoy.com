import { api } from "../api";

interface propsFetchApiBodas {
  query: string
  variables: any
  type?: string
  development: string
  token?: string
}

export const fetchApiBodas = async ({ query = ``, variables = {}, type = "json", token, development }: propsFetchApiBodas): Promise<any> => {
  try {
    if (type === "json") {
      const {
        data: { data },
      } = await api.ApiBodas({ data: { query, variables }, development, token });
      return Object.values(data)[0];
    } else if (type === "formData") {
      const formData = new FormData();
      const values = Object?.entries(variables);

      // Generar el map del Form Data para las imagenes
      const map = values?.reduce((acc, item) => {
        if (item[1] instanceof File) {
          acc[item[0]] = [`variables.${item[0]}`];
        }
        if (item[1] instanceof Object) {
          Object.entries(item[1]).forEach((el) => {
            if (el[1] instanceof File) {
              acc[el[0]] = [`variables.${item[0]}.${el[0]}`];
            }
            if (el[1] instanceof Object) {
              Object.entries(el[1]).forEach((elemento) => {
                if (elemento[1] instanceof File) {
                  acc[elemento[0]] = [
                    `variables.${item[0]}.${el[0]}.${elemento[0]}`,
                  ];
                }
              });
            }
          });
        }
        return acc;
      }, {});

      // Agregar filas al FORM DATA

      formData.append("operations", JSON.stringify({ query, variables }));
      formData.append("map", JSON.stringify(map));
      values.forEach((item) => {
        if (item[1] instanceof File) {
          formData.append(item[0], item[1]);
        }
        if (item[1] instanceof Object) {
          Object.entries(item[1]).forEach((el) => {
            if (el[1] instanceof File) {
              formData.append(el[0], el[1]);
            }
            if (el[1] instanceof Object) {
              Object.entries(el[1]).forEach((elemento) => {
                if (elemento[1] instanceof File) {
                  formData.append(elemento[0], elemento[1]);
                }
              });
            }
          });
        }
      });

      const { data } = await api.ApiApp(
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (data.errors) {
        throw new Error(JSON.stringify(data.errors));
      }

      return Object.values(data.data)[0];
    }
  } catch (error) {
    console.log(error);
    return error
  }
};

interface argsFetchApi {
  query: string;
  variables: object;
  token?: string;
  domain?: string
}
export const fetchApiEventos = async ({ query, variables, token }: argsFetchApi) => {
  const {
    data: { data },
  } = await api.ApiApp({ query, variables }, token);
  return Object.values(data)[0];
};

export const queries = {

  getAllBusiness: `query ($criteria :searchCriteriaBusiness, $sort : sortCriteriaBusiness, $skip :Int, $limit : Int, $development: String!) {
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
  }`,

  getInvoices: `query{
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
  }`,
  updateCustomer: `mutation($args:inputCustomer){
      updateCustomer(args:$args)
  }`,
  getCustomer: `query{
    getCustomer{
      name
      email
      line1
      line2
      postalCode
      city
      country
    }
  }`,
  singleUpload: `mutation($file:Upload!,$use:String)
  {
    singleUpload(file:$file,use:$use){
      _id
      i640
    }
  }`,
  getPGuestEvent: `query($p:String){
    getPGuestEvent(p:$p){
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
  }`,

  getLinkInvitation: ` query($evento_id:String, $invitado_id:String){
  getLinkInvitation(evento_id:$evento_id, invitado_id:$invitado_id){
      link
    }
  }`,

  setCheckoutItems: `mutation ( $unique:ID, $args:[inputDetailsItemsCheckout] )
  {
    setCheckoutItems(unique:$unique, args:$args)
  }`,

  getCheckoutItems: `query ( $unique:ID )
  {
    getCheckoutItems(unique:$unique){
      currency
      amount
      name
      price
      quantity
    }
  }`,

  getEventTicket: `query ( $args:inputEventTicket, $sort:sortCriteriaEventTicket, $skip:Int, $limit:Int )
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
  }`,

  createCheckoutSession: `mutation ($items:[inputItemsCheckout], $email:String, $cancel_url:String, $mode:String, $success_url:String){
    createCheckoutSession(items:$items, email:$email, cancel_url:$cancel_url, mode:$mode, success_url:$success_url)
  }`,

  getAllProducts: `query ($grupo:String) {
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
  }`,

  editTask: `mutation ($eventID:String, $itinerarioID:String, $taskID:String, $variable:String, $valor:String){
    editTask(eventID:$eventID itinerarioID:$itinerarioID  taskID:$taskID  variable:$variable  valor:$valor )
  }`,
  createTask: `mutation ($eventID:String, $itinerarioID:String, $fecha:String, $descripcion:String, $hora:String, $duracion:Int){
    createTask(eventID:$eventID, itinerarioID:$itinerarioID, fecha:$fecha, descripcion:$descripcion, hora:$hora, duracion:$duracion ){
      _id
      fecha
      hora
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
        createdAt
        attachments{
          _id
          name
          size
        }
      }
      commentsViewers
      estado
      prioridad
      fecha_creacion
    }
  }`,
  deleteTask: `
  mutation  ( $eventID:String, $itinerarioID:String, $taskID:String  ) {
    deleteTask ( eventID:$eventID  itinerarioID:$itinerarioID  taskID:$taskID)
  }`,
  createComment: `
  mutation  ( $eventID:String, $itinerarioID:String, $taskID:String, $comment:String, $attachments: [inputFileData]) {
    createComment ( eventID:$eventID  itinerarioID:$itinerarioID  taskID:$taskID, comment:$comment, attachments: $attachments){
      _id
      comment
      uid
      createdAt
      attachments{
        _id
        name
        size
      }
    }
  }`,
  deleteComment: `
  mutation  ( $eventID:String, $itinerarioID:String, $taskID:String, $commentID:String  ) {
    deleteComment ( eventID:$eventID  itinerarioID:$itinerarioID  taskID:$taskID, commentID:$commentID)
  }`,
  createItinerario: `mutation ($eventID:String, $title:String, $dateTime:String, $tipo:String, $next_id:ID){
    createItinerario(eventID:$eventID, title:$title, dateTime:$dateTime, tipo:$tipo, next_id:$next_id ){
      _id
      next_id
      title
      tasks{
        _id
        fecha
        hora
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
          createdAt
          attachments{
            _id
            name
            size
          }
        }
        commentsViewers
        estado
        prioridad
      }
      tipo
      fecha_creacion
    }
  }`,
  duplicateItinerario: `mutation ($eventID:String, $itinerarioID:String, $eventDestinationID:String, $next_id:ID, $storageBucket:String){
    duplicateItinerario(eventID:$eventID, itinerarioID:$itinerarioID, eventDestinationID:$eventDestinationID, next_id:$next_id, storageBucket:$storageBucket){
      _id
      next_id
      title
      tasks{
        _id
        fecha
        hora
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
          createdAt
          attachments{
            _id
            name
            size
          }
        }
        commentsViewers
        estado
        prioridad
      }
      tipo
    }
  }`,
  generatePdf: `
  mutation  ( $url:String, $nameFile:String, ) {
    generatePdf ( url:$url,  nameFile:$nameFile)
  }`,
  editItinerario: `mutation ($eventID:String, $itinerarioID:String, $variable:String, $valor:String, $next_id:ID){
    editItinerario(eventID:$eventID itinerarioID:$itinerarioID, variable:$variable, valor:$valor, next_id:$next_id )
  }`,
  deleteItinerario: `
  mutation  ( $eventID:String, $itinerarioID:String ) {
    deleteItinerario ( eventID:$eventID  itinerarioID:$itinerarioID  )
  }`,
  getItinerario: ` query($evento_id:String, $itinerario_id:String){
    getItinerario(evento_id:$evento_id, itinerario_id:$itinerario_id){
      nombre
      tipo
      itinerarios_array{
        _id
        next_id
        title
        tasks{
          _id
          fecha
          hora
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
            createdAt
            attachments{
              _id
              name
              size
            }
          }
          commentsViewers
          estado
          prioridad
          fecha_creacion
        }
        columnsOrder{
          columnId
          order
        }
        viewers
        tipo
        estatus
        fecha_creacion
      }
    }
  }`,
  getPreregister: `query ($_id :ID){
    getPreregister(_id:$_id)
  }`,
  updateActivity: `mutation ($args:inputActivity){
    updateActivity(args:$args)
  }`,
  updateActivityLink: `mutation ($args:inputActivityLink){
    updateActivityLink(args:$args)
  }`,
  updateNotifications: `mutation ($args:inputNotification){
    updateNotifications(args:$args)
  }`,
  createNotifications: `mutation ($args:inputNotifications){
    createNotifications(args:$args){
      total
      results{
        _id
      }
    }
  }`,
  getNotifications: `query ($args:inputNotification, $sort:sortCriteriaNotification, $skip:Int, $limit:Int){
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
  }`,
  createUserWithPassword: `mutation($email:String, $password:String) { 
    createUserWithPassword(email:$email, password:$password)
  }`,
  getEmailValid: `query ($email :String){
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
  }`,
  getUsers: `query ($uids:[ID]){
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
  }`,
  getGeoInfo: `query  {
    getGeoInfo {
      referer
      acceptLanguage
      loop
      connectingIp
      ipcountry
    }
  }`,
  auth: `mutation ($idToken : String){
    auth(idToken: $idToken){
      sessionCookie
    }
  }`,
  updateUser: `mutation ($uid:ID, $variable:String, $valor:String){
    updateUser(uid:$uid, variable:$variable, valor:$valor)
  }`,
  createUser: `mutation  ($uid : ID, $city: String, $country : String, $weddingDate : String, $phoneNumber : String, $role : [String]) {
    createUser(uid: $uid, city : $city, country : $country, weddingDate : $weddingDate, phoneNumber : $phoneNumber, role: $role){
          city
          country
          weddingDate
          phoneNumber
          role
        }
  }`,
  getUser: `query ($uid: ID) {
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
  }`,
  authStatus: `mutation ($sessionCookie : String){
        status(sessionCookie: $sessionCookie){
          customToken
        }
  }`,
  eventCreate: `mutation (
    $nombre: String,
    $tipo: String!,
    $fecha: String,
    $pais: String,
    $poblacion: String,
    $usuario_id: String!
    $usuario_nombre: String!
    $development: String!
  ){
    crearEvento(
      nombre: $nombre,
      tipo: $tipo,
      fecha: $fecha,
      pais: $pais,
      poblacion: $poblacion,
      usuario_id: $usuario_id,
      usuario_nombre: $usuario_nombre
      development: $development
    ){
      _id
      grupos_array
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
      fecha
      listaRegalos
      listIdentifiers{
        table
        start_Id
        end_Id
      }
      poblacion
      pais
      imgInvitacion{
        _id
        i1024
        i800
        i640
        i320
        createdAt
      }
      notificaciones_array{
        _id
        fecha_creacion
        fecha_lectura
        mensaje
      }
      itinerarios_array{
        _id
        next_id
        title
        tasks{
          _id
          fecha
          hora
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
            createdAt
            attachments{
              _id
              name
              size
            }
          }
          commentsViewers
          estado
          prioridad
        }
        columnsOrder{
          columnId
          order
        }
        viewers
        tipo
        estatus
        fecha_creacion
      }
      planSpaceSelect
      planSpace{
      _id
      title
      size{
        width
        height
      }
      spaceChairs
      template
      sections{
        _id
        title
        position{
          x
          y
        }
        size{
          width
          height
        }
        color
        elements{
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
        }
        tables{
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
      elements{
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
      tables{
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
      invitados_array{
        _id
        nombre
        grupo_edad
        correo
        telefono
        chairs{
          planSpaceID
          sectionID
          tableID
          position
          order
        }
        father
        passesQuantity
        nombre_mesa
        puesto
        asistencia
        nombre_menu
        rol
        correo
        sexo
        movil
        poblacion
        pais
        direccion
        invitacion
        fecha_invitacion
      }
      menus_array{
        nombre_menu
        tipo
      }
      presupuesto_objeto{
        coste_final
        pagado
        coste_estimado
        currency
        totalStimatedGuests{
          children
          adults
        }
        categorias_array{
          _id
          nombre
          coste_estimado
          coste_final
          pagado
          gastos_array {
            _id
            coste_estimado
            coste_final
            pagado
            nombre
            linkTask
            estatus
            pagos_array {
              _id
              estado
              fecha_creacion
              fecha_pago
              fecha_vencimiento
              medio_pago
              importe
              pagado_por
              soporte{
                image_url
                medium_url
                thumb_url
                delete_url
              }
            }
            items_array{
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
        }
      }
      showChildrenGuest
    }
  }`,

  editTotalStimatedGuests: `mutation ($evento_id:String, $children:Int, $adults:Int){
    editTotalStimatedGuests(evento_id:$evento_id,  children:$children, adults:$adults ){
    viewEstimates
    coste_estimado
    coste_final
    pagado
    currency
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
        nombre
        linkTask
        estatus
        pagos_array{
          _id
        }
        items_array{
          _id
         }
     }
  }
  }
  }`,

  duplicatePresupuesto: `mutation ($eventID:String, $eventDestinationID:String){
    duplicatePresupuesto(eventID:$eventID,  eventDestinationID:$eventDestinationID ){
    viewEstimates
    coste_estimado
    coste_final
    pagado
    currency
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
        nombre
        linkTask
        estatus
        pagos_array{
          _id
        }
        items_array{
          _id
         }
     }
  }
  }
  }`,
  nuevoCategoria: `mutation ($evento_id: String, $nombre: String){
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
          valor_unitario
          total
          estatus
          fecha_creacion
        }
    }
  }
}`,
  borraCategoria: `mutation( $evento_id:String $categoria_id:String){
    borraCategoria(evento_id:$evento_id, categoria_id: $categoria_id){
      coste_final
    }
  }`,
  editCategoria: `mutation( $evento_id:String $categoria_id:String $nombre:String){
    editCategoria(evento_id:$evento_id, categoria_id: $categoria_id, nombre: $nombre){
      coste_estimado
      coste_final
      pagado
      currency
    }
  }`,
  nuevoPago: `mutation($evento_id:String, $categoria_id:String, $gasto_id: String,$pagos_array:[pagos_arrayAinput]){
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
                        estatus 
                        pagos_array{
                          _id
                          estado
                          fecha_creacion
                          fecha_pago
                          fecha_vencimiento
                          medio_pago
                          importe
                          pagado_por
                          concepto
                          soporte{
                            image_url
                            medium_url
                            thumb_url
                            delete_url
                          }
                        }
                        items_array{
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
                    }
                  }
                }`,
  borrarGasto: `mutation($evento_id: String, $categoria_id: String, $gasto_id: String){
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
              }`,
  nuevoGasto: `mutation($evento_id: String ,$categoria_id: String, $nombre: String){
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
                  pagado_por
                  concepto
                  soporte{
                    image_url
                    medium_url
                    thumb_url
                    delete_url
                  }
                }
                items_array{
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
            }`,
  editGasto: `mutation($evento_id: ID, $categoria_id: ID, $gasto_id: ID, $variable_reemplazar: String, $valor_reemplazar: StringIntBool){
                editGasto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, variable_reemplazar:$variable_reemplazar, valor_reemplazar:$valor_reemplazar){
                viewEstimates
                coste_estimado
                coste_final
                pagado
                currency
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
                      pagado_por
                      concepto
                      soporte{
                        image_url
                        medium_url
                        thumb_url
                        delete_url
                      }
                    }
                    items_array{
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
                }
              }
            }`,
  editItemGasto: `mutation($evento_id: ID ,$categoria_id: ID, $gasto_id: ID, $itemGasto_id: ID, $variable: String, $valor: StringIntBool){
    editItemGasto(evento_id:$evento_id, categoria_id: $categoria_id, gasto_id: $gasto_id, itemGasto_id: $itemGasto_id, variable: $variable, valor: $valor){
      viewEstimates
      coste_estimado
      coste_final
      pagado
      currency
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
            pagado_por
            concepto
            soporte{
              image_url
              medium_url
              thumb_url
              delete_url
            }
          }
          items_array{
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
      }
    }
  }`,
  nuevoItemGasto: `mutation($evento_id: ID, $categoria_id: ID, $gasto_id: ID, $itemGasto:itemGastoInput){ 
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
  }`,
  borrarItemsGastos: `mutation($evento_id: ID, $categoria_id: ID, $gasto_id: ID, $itemsGastos_ids: [ID]){ 
    borraItemsGastos(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, itemsGastos_ids:$itemsGastos_ids){
      viewEstimates
      coste_estimado
      coste_final
      pagado
      currency
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
            pagado_por
            concepto
            soporte{
              image_url
              medium_url
              thumb_url
              delete_url
            }
          }
          items_array{
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
      }
    }
  }`,
  editPresupuesto: `mutation($evento_id:String, $coste_estimado:Float, $viewEstimates:Boolean ){
    editPresupuesto( evento_id:$evento_id, coste_estimado:$coste_estimado, viewEstimates:$viewEstimates ){
      viewEstimates
      coste_final
      coste_estimado
      pagado
      currency
      totalStimatedGuests{
        children
        adults
      }
      categorias_array {
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
            valor_unitario
            total
            estatus
            fecha_creacion
          }
        }
      }
    }
  }`,
  guardarListaRegalos: `mutation($evento_id: String!, $variable_reemplazar: String, $valor_reemplazar: String){
    editEvento(
      evento_id:$evento_id
      variable_reemplazar:$variable_reemplazar
      valor_reemplazar:$valor_reemplazar
    ){
      _id
      listaRegalos
    }
  }`,
  addCompartitions: `mutation($args:inputCompartition){
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
  }`,
  updateCompartitions: `mutation($args:inputCompartition){
    updateCompartition(args:$args)
  }`,
  deleteCompartitions: `mutation($args:inputCompartition){
    deleteCompartition(args:$args)
  }`,
  getEventsByID: `query ($variable: String, $valor: String, $development: String!) {
    queryenEvento( variable:$variable, valor:$valor, development:$development){
      _id
      development
      grupos_array
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
      fecha
      listaRegalos
      listIdentifiers{
        table
        start_Id
        end_Id
      }
      poblacion
      pais
      lugar {
        _id
        title
        slug
      }
      imgInvitacion{
        _id
        i1024
        i800
        i640
        i320
        createdAt
      }
      notificaciones_array{
        _id
        fecha_creacion
        fecha_lectura
        mensaje
      }
      itinerarios_array{
        _id
        next_id
        title
        tasks{
          _id
          fecha
          hora
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
            createdAt
            attachments{
              _id
              name
              size
            }
          }
          commentsViewers
          estado
          prioridad
        }
        columnsOrder{
          columnId
          order
        }
        viewers
        tipo
        estatus
        fecha_creacion
      }
      planSpaceSelect
      planSpace{
      _id
      title
      size{
        width
        height
      }
      spaceChairs
      template
      sections{
        _id
        title
        position{
          x
          y
        }
        size{
          width
          height
        }
        color
        elements{
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
        }
        tables{
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
      elements{
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
      tables{
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
      invitados_array{
        _id
        nombre
        grupo_edad
        correo
        telefono
        chairs{
          planSpaceID
          sectionID
          tableID
          position
          order
        }
        father
        passesQuantity
        nombre_mesa
        puesto
        asistencia
        nombre_menu
        rol
        correo
        sexo
        movil
        poblacion
        pais
        direccion
        invitacion
        fecha_invitacion
      }
      menus_array{
        nombre_menu
        tipo
      }
      presupuesto_objeto{
        viewEstimates
        coste_final
        pagado
        coste_estimado
        currency
        totalStimatedGuests{
          children
          adults
        }
        categorias_array{
          _id
          nombre
          coste_estimado
          coste_final
          pagado
          gastos_array {
            _id
            coste_estimado
            coste_final
            pagado
            nombre
            linkTask
            estatus
            pagos_array {
              _id
              estado
              fecha_creacion
              fecha_pago
              fecha_vencimiento
              medio_pago
              importe
              pagado_por
              soporte{
                image_url
                medium_url
                thumb_url
                delete_url
              }
            }
            items_array{
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
        }
      }
      showChildrenGuest
    }
  }`,
  getListaRegalos: `query($_id: String){
    queryenEvento_id(
      var_1:$_id
    ){
      _id
      nombre
      listaRegalos
    }
  }`,
  eventDelete: `mutation ($eventoID : String!) {
    borrarEvento(evento_id:$eventoID){
      modificado
    }
  }`,
  eventUpdate: `mutation ($idEvento: String!, $variable:String, $value : String){
    editEvento(
      evento_id: $idEvento, 
      variable_reemplazar: $variable, 
      valor_reemplazar: $value
      ){
      _id
    }
  }`,
  createGuests: `mutation ($eventID: String, $invitados_array: [invitAinput]) {
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
  }`,
  editGuests: `mutation ($eventID:String, $guestID:String, $variable: String, $value:String) {
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
  }`,
  removeGuests: `mutation ($eventID:String, $guests: [String]){
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
  }`,
  createGroup: `mutation ($eventID: String, $name: String) {
    creaGrupo(evento_id:$eventID, nombre_grupo: $name){
      grupos_array
    }
  }`,
  createMenu: `mutation ($eventID: String, $name: String) {
    creaMenu(evento_id:$eventID, nombre_menu: $name){
      menus_array{
        nombre_menu
        tipo
      }
    }
  }`,
  deleteMenu: `mutation ($eventID: String, $name: String) {
    borraMenu(evento_id:$eventID, nombre_menu: $name){
      menus_array{
        nombre_menu
        tipo
      }
    }
  }`,
  // createTable: `mutation ($eventID:String, $tableName: String, $tableType:String, $numberChairs:  Int, $position: [posicionAinput]) {
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
  // }`,
  getPsTemplate: `query ($uid:String ) {
    getPsTemplate(uid:$uid) {
      _id
      title
    }
  }`,
  createPsTemplate: `mutation ($eventID:ID, $planSpaceID:ID, $title:String, $uid:String ) {
    createPsTemplate(eventID:$eventID, planSpaceID:$planSpaceID, title:$title, uid:$uid) {
      _id
      title
    }
  }`,
  createTable: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $values: String) {
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
  }`,
  editTable: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID, $variable: String, $valor: String) {
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
  }`,
  deleteTable: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID) {
    deleteTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, tableID:$tableID) 
  }`,
  createElement: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $values: String) {
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
  }`,
  editElement: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $elementID: ID, $variable: String, $valor: String) {
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
  }`,
  deleteElement: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $elementID: ID) {
    deleteElement(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, elementID:$elementID) 
  }`,
  editTableOld: `mutation ($eventID:String, $tableID: String, $variable: String, $coordenadas: [posicionAinput]) {
    editMesa(evento_id:$eventID,mesa_id:$tableID, variable_reemplazar:$variable, coordenadas:$coordenadas) {
      _id
      nombre_mesa
      posicion {
        x
        y
      }
      cantidad_sillas
    }
  }`,
  editNameTable: `mutation ($eventID:String, $tableID: String, $variable: String, $valor_reemplazar: String) {
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
  }`,
  deleteTableOld: `mutation ($eventID:String, $tableID: String) {
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
  }`,
  signOut: `mutation ($sessionCookie :String){
    signOut(sessionCookie:$sessionCookie)
  }`,
};

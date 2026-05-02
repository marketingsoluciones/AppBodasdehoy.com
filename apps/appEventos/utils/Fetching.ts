import { api } from "../api";
import { resolveApiBodasOrigin } from "./apiEndpoints";

/**
 * Mensaje amigable según el código HTTP del error de la API.
 * 403 = no es "error de conexión", es sesión no autorizada o expirada.
 */
export function getApiErrorMessage(error: any): string | null {
  const status = error?.response?.status;
  if (status === 403) {
    return 'Sesión no autorizada o expirada. Cierra sesión e inicia de nuevo.';
  }
  if (status === 401) {
    return 'Debes iniciar sesión de nuevo.';
  }
  if (status === 502 || status === 503) {
    return 'El servidor no está disponible. Inténtalo en unos minutos.';
  }
  if (typeof status === 'number' && status >= 500 && status < 600) {
    return `Error del servidor (${status}). Inténtalo en unos minutos.`;
  }
  if (typeof error?.message === 'string' && error.message.includes('timeout')) {
    return 'La petición tardó demasiado. Comprueba la conexión y reintenta.';
  }
  if (status === 429) {
    return 'Demasiadas peticiones. Espera un momento e inténtalo de nuevo.';
  }
  if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error')) {
    return 'No se pudo conectar con el servidor. Comprueba tu conexión.';
  }
  return null;
}

interface propsFetchApiBodas {
  query: string;
  variables: any;
  type?: string;
  development: string;
  token?: string;
}

export const fetchApiBodas = async ({
  query = ``,
  variables = {},
  type = "json",
  token,
  development = "bodasdehoy",
}: propsFetchApiBodas): Promise<any> => {
  try {
    if (type === "json") {
      const {
        data: { data, errors },
      } = await api.ApiBodas({
        data: { query, variables },
        development,
        token,
        type: "json",
      });
      if (!data && errors) {
        console.warn("[fetchApiBodas] GraphQL errors:", errors);
        return null;
      }
      return data ? Object.values(data)[0] : null;
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

      const result = await api.ApiBodas({
        data: formData,
        development,
        token,
        type: "formData"
      });

      if (result?.status === 400) {
        const errData = result?.data;
        console.warn("[fetchApiBodas] Upload 400:", errData?.errors || errData);
        throw new Error(errData?.errors?.[0]?.message || "Error al subir archivo");
      }

      const body = result?.data as { data?: Record<string, unknown>; errors?: unknown[] };

      if (body?.errors?.length) {
        throw new Error(JSON.stringify(body.errors));
      }

      return body?.data ? Object.values(body.data)[0] : null;
    }
  } catch (error: any) {
    console.error("[fetchApiBodas] Error en la llamada API:", {
      message: error?.message,
      code: error?.code,
      isAxiosError: error?.isAxiosError,
      response: error?.response?.data,
      status: error?.response?.status
    });
    throw error; // Lanzar el error en lugar de retornarlo
  }
};

interface argsFetchApi {
  query: string;
  variables: object;
  token?: string;
  domain?: string;
}
/** Retorno depende de la mutación/query; tipar en el callsite si hace falta. */
export const fetchApiEventos = async ({
  query,
  variables,
  token,
  domain,
  development,
}: argsFetchApi & { domain?: string; development?: string }): Promise<any> => {
  try {
    // Unificado: todo va a api3-mcp (apiapp ya no existe)
    const axiosRes = await api.ApiBodas({
      data: { query, variables },
      development: development || domain || "bodasdehoy",
      token,
      type: "json",
    });
    const body = axiosRes?.data as { data?: Record<string, unknown>; errors?: unknown[] };
    if (body?.errors?.length) {
      const synthetic: Error & { response?: { status: number; data: typeof body } } = new Error(
        body.errors
          .map((e: any) => (typeof e?.message === 'string' ? e.message : ''))
          .filter(Boolean)
          .join('; ') || 'GraphQL error'
      ) as Error & { response?: { status: number; data: typeof body } };
      synthetic.response = { status: axiosRes.status, data: body };
      throw synthetic;
    }
    const data = body?.data;
    if (data == null) {
      const synthetic: Error & { response?: { status: number; data: typeof body } } = new Error(
        'Respuesta GraphQL sin campo data'
      ) as Error & { response?: { status: number; data: typeof body } };
      synthetic.response = { status: axiosRes.status, data: body };
      throw synthetic;
    }
    const payload = Object.values(data)[0] as any;
    if (
      payload &&
      typeof payload === 'object' &&
      payload.success === false &&
      Array.isArray(payload.errors) &&
      payload.errors.length
    ) {
      const mapped = (payload.errors as Record<string, unknown>[]).map((e) => ({
        message: typeof e?.message === 'string' ? e.message : '',
        extensions: {
          code:
            typeof e?.code === 'string' && e.code.length
              ? e.code
              : 'INTERNAL_SERVER_ERROR',
        },
      }));
      const synthetic: Error & { response?: { status: number; data: { errors: typeof mapped } } } =
        new Error(
          mapped.map((e) => e.message).filter(Boolean).join('; ') || 'La mutación devolvió success: false'
        ) as Error & { response?: { status: number; data: { errors: typeof mapped } } };
      synthetic.response = { status: axiosRes.status, data: { errors: mapped } };
      throw synthetic;
    }
    return payload;
  } catch (error: any) {
    console.error("[fetchApiEventos] Error en la llamada API:", {
      message: error?.message,
      code: error?.code,
      isAxiosError: error?.isAxiosError,
      response: error?.response?.data,
      status: error?.response?.status
    });
    throw error; // Lanzar el error en lugar de retornarlo
  }
};

// Función específica para getServerSideProps sin autenticación
export const fetchApiEventosServer = async ({
  query,
  variables,
  development,
}: {
  query: string;
  variables: any;
  /** Si se omite o es null, se usa NEXT_PUBLIC_DEVELOPMENT. Pasa false para omitir el header (cross-tenant). */
  development?: string | null | false;
}) => {
  const axios = require("axios");
  const serverInstance = axios.create({
    baseURL: resolveApiBodasOrigin(),
    timeout: 15000, // 15 segundos de timeout
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Next.js-Server/1.0",
  };
  if (development !== false) {
    headers.Development = (development as string) || process.env.NEXT_PUBLIC_DEVELOPMENT || "bodasdehoy";
  }
  try {
    const response = await serverInstance.post(
      "/graphql",
      { query, variables },
      { headers }
    );
    if (response.data.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
    }
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Función específica para getServerSideProps para fetchApiBodas
export const fetchApiBodasServer = async ({
  query,
  variables,
  development,
}: {
  query: string;
  variables: any;
  development: string;
}) => {
  const axios = require("axios");
  const serverInstance = axios.create({
    baseURL: resolveApiBodasOrigin(),
    timeout: 15000, // 15 segundos de timeout
  });
  try {
    const response = await serverInstance.post(
      "/graphql",
      {
        query,
        variables,
      },
      {
        headers: {
          Development: development,
          "Content-Type": "application/json",
          "User-Agent": "Next.js-Server/1.0",
        },
      }
    );
    if (response.data.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(response.data.errors)}`);
    }
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export const queries = {
  addWeddingPlannerIngreso: `mutation($evento_id:String, $weddingPlannerIngreso:WeddingPlannerIngresoInput ){
    addWeddingPlannerIngreso(evento_id:$evento_id, weddingPlannerIngreso:$weddingPlannerIngreso){
      _id
      fecha
      monto
      metodo
      referencia
      createdAt
      updatedAt
    }
  }`,

  deleteWeddingPlannerIngreso: `mutation($evento_id:String, $weddingPlannerIngreso_id:ID){
    deleteWeddingPlannerIngreso(evento_id:$evento_id, weddingPlannerIngreso_id:$weddingPlannerIngreso_id)
  }`,

  deletepayment: `mutation($evento_id:String, $categoria_id:String, $gasto_id:String, $pago_id:String){
    borraPago(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, pago_id:$pago_id){
      pagado
      categorias_array{
        pagado
        gastos_array{
          pagado
        }
      }
    }
  }`,

  createEmailTemplate: `mutation($evento_id:String, $design:JSON, $configTemplate:inputCongigTemplate, $html:String){
    createEmailTemplate(evento_id:$evento_id, design:$design, configTemplate:$configTemplate, html:$html){
      _id
      createdAt
      updatedAt
    }
  }`,

  updateEmailTemplate: `mutation($evento_id:String, $template_id:String, $design:JSON, $configTemplate:inputCongigTemplate, $html:String){
    updateEmailTemplate(evento_id:$evento_id, template_id:$template_id, design:$design, configTemplate:$configTemplate, html:$html)
  }`,
  deleteEmailTemplate: `mutation($evento_id:String, $template_id:String){
    deleteEmailTemplate(evento_id:$evento_id, template_id:$template_id)
  }`,
  getPreviewsEmailTemplates: `query ($evento_id:String){
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
  }`,

  getEmailTemplate: `query ($template_id:String){
    getEmailTemplate(template_id:$template_id){
      design
    }
  }`,

  getVariableEmailTemplate: `query ($template_id:String, $selectVariable:String){
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
  }`,

  getVariablesTemplatesInvitaciones: `query($evento_id:ID){
    getVariablesTemplatesInvitaciones(evento_id:$evento_id)
  }`,

  getWhatsappInvitationTemplates: `query($evento_id:ID){
    getWhatsappInvitationTemplates(evento_id:$evento_id)
  }`,

  createWhatsappInvitationTemplate: `mutation($evento_id:ID, $data: JSON){
    createWhatsappInvitationTemplate(evento_id:$evento_id, data:$data)
  }`,

  updateWhatsappInvitationTemplate: `mutation($evento_id:ID, $template_id: ID, $data: JSON){
    updateWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id, data:$data){
      _id
    }
  }`,

  deleteWhatsappInvitationTemplate: `mutation($evento_id:ID, $template_id: ID){
    deleteWhatsappInvitationTemplate(evento_id:$evento_id, template_id:$template_id)
  }`,

  uploadMediaToFacebook: `mutation($fileName: String!, $fileBuffer: String!, $fileType: String!, $development: String){
    uploadMediaToFacebook(fileName: $fileName, fileBuffer: $fileBuffer, fileType: $fileType, development: $development){
      success
      handle
      message
      error
    }
  }`,

  uploadBase64MediaToFacebook: `mutation($base64Image: String!, $fileName: String!, $development: String){
    uploadBase64MediaToFacebook(base64Image: $base64Image, fileName: $fileName, development: $development){
      success
      handle
      message
      error
    }
  }`,

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
  singleUpload: `mutation($file:Upload!,$development:String!,$eventId:ID!)
  {
    singleUpload(file:$file,development:$development,eventId:$eventId){
      __typename
    }
  }`,
  getPGuestEvent: `query($p:String){
    getPGuestEvent(p:$p){
      _id
      invitados {
        id
        nombre
        email
        telefono
        menu { id nombre precio }
        menu_seleccion { entrada plato_principal postre bebida }
        alergenos
        asistencia
        acompanantes
        mesa
        puesto
        rol
        sexo
        grupo_edad
        comunicaciones { tipo estado fecha mensaje_id template_name }
      }
      menus {
        id
        nombre
        precio
        descripcion
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

  updateTasksOrder: `
    mutation($eventID: String, $itinerarioID: String, $tasksOrder: String) {
      updateTasksOrder(
        eventID: $eventID,
        itinerarioID: $itinerarioID,
        tasksOrder: $tasksOrder
      )
    }
  `,

  editTask: `mutation ($eventID:String, $itinerarioID:String, $taskID:String, $variable:String, $valor:String){
    editTask(eventID:$eventID itinerarioID:$itinerarioID  taskID:$taskID  variable:$variable  valor:$valor )
  }`,

  saveViewConfig: `
    mutation saveViewConfig($eventID: String, $itinerarioID: String, $viewConfig: String) {
      saveViewConfig(
        eventID: $eventID,
        itinerarioID: $itinerarioID,
        viewConfig: $viewConfig
      )
    }
  `,

  getViewConfigs: `
    query getViewConfigs($eventID: String, $itinerarioID: String) {
      getViewConfigs(
        eventID: $eventID,
        itinerarioID: $itinerarioID
      ) {
        id
        name
        columns
        filters
        sortBy
      }
    }
  `,

  createTask: `mutation ($eventID:String, $itinerarioID:String, $fecha:String, $descripcion:String, $hora:String, $duracion:Int){
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
        createdAt
        nicknameUnregistered
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
  mutation ($task_id:ID!, $development:String!, $comment:TaskCommentInput!) {
    createComment(task_id:$task_id, development:$development, comment:$comment){
      success
      errors{ message }
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
          createdAt
          nicknameUnregistered
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
          createdAt
          nicknameUnregistered
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
      timeZone
      itinerarios_array
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
  createNotifications: `mutation ($args:inputNotifications){
    createNotifications(args:$args){
      total
      results{
        _id
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
      onLine
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
  auth: `mutation ($idToken : String!){
    auth(idToken: $idToken){
      sessionCookie
    }
  }`,
  updateUser: `mutation ($variable:String, $valor:String){
    updateUser(variable:$variable, valor:$valor){
      city
      country
    }
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
          onLine
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
  eventCreate: `mutation ($input: EventoInput!) {
    createEvento(input: $input) {
      success
      errors { field message }
      evento {
        _id
        grupos_array
        compartido_array
        detalles_compartidos_array
        estatus
        temporada
        tarta
        nombre
        fecha_actualizacion
        fecha_creacion
        tipo
        usuario_id
        usuario_nombre
        fecha
        galerySvgVersion
        listaRegalos
        poblacion
        pais
        timeZone
        imgEvento
        notificaciones_array
        itinerarios_array
        planSpaceSelect
        planSpace
        mesas_array
        invitados {
          id
          nombre
          email
          telefono
          menu { id nombre precio }
          menu_seleccion { entrada plato_principal postre bebida }
          alergenos
          asistencia
          acompanantes
          mesa
          puesto
          rol
          sexo
          grupo_edad
          comunicaciones { tipo estado fecha mensaje_id template_name }
        }
        menus {
          id
          nombre
          precio
          descripcion
        }
        presupuesto_objeto
        showChildrenGuest
      }
    }
  }`,

  //        createWhatsappTemplate( data: JSON, development: String! ): JSON
  createWhatsappTemplate: `mutation( $data:JSON, $development:String!){
    createWhatsappTemplate(data:$data, development:$development){
      _id
      title
      content
      createdAt
    }
  }`,

  sendInvitations: ` mutation( $evento_id:String, $invitados_ids_array:[String], $dominio:String, $transport:String, $lang:String){
    enviaInvitacion(evento_id:$evento_id, invitados_ids_array:$invitados_ids_array, dominio:$dominio, transport:$transport, lang:$lang){
      _id,
    }
  }`,

  sendComunications: ` mutation( $evento_id:String, $invitados_ids_array:[String], $dominio:String, $transport:String, $lang:String, $template_id:ID){
    sendComunications(evento_id:$evento_id, invitados_ids_array:$invitados_ids_array, dominio:$dominio, transport:$transport, lang:$lang, template_id:$template_id){
      total
      results{
        invitado_id
        comunicacion{
          transport
          template_id
          template_name
          message_id
          statuses{
            name
            timestamp
          }
        }
      }
    }
  }`,

  editVisibleColumns: `mutation ($evento_id:String, $visibleColumns:[inputVisibleColumn]){
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

  editTotalStimatedGuests: `mutation ($evento_id:String, $children:Int, $adults:Int){
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

  duplicatePresupuesto: `mutation ($evento_origen_id:String!, $evento_destino_id:String!){
    duplicatePresupuesto(evento_origen_id:$evento_origen_id,  evento_destino_id:$evento_destino_id ){
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
        nombre
        linkTask
        estatus
        pagos_array{
          _id
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

  editPago: `mutation($evento_id:String, $categoria_id:String, $gasto_id: String, $pago_id:String,$pagos_array:pagos_arrayAinput){
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
  editPresupuesto: `mutation($evento_id:String, $coste_estimado:Float, $viewEstimates:Boolean, $presupuesto_total:Float ){
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
      detalles_compartidos_array
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
      grupos_array
      compartido_array
      detalles_compartidos_array
      estatus
      temporada
      tarta
      nombre
      fecha_actualizacion
      fecha_creacion
      tipo
      usuario_id
      usuario_nombre
      fecha
      galerySvgVersion
      listaRegalos
      poblacion
      pais
      lugar
      timeZone
      imgEvento
      notificaciones_array
      itinerarios_array
      planSpaceSelect
      planSpace
      mesas_array
      invitados {
        id
        nombre
        email
        telefono
        menu { id nombre precio }
        menu_seleccion { entrada plato_principal postre bebida }
        alergenos
        asistencia
        acompanantes
        mesa
        puesto
        rol
        sexo
        grupo_edad
        comunicaciones { tipo estado fecha mensaje_id template_name }
      }
      menus {
        id
        nombre
        precio
        descripcion
      }
      presupuesto_objeto
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
     invitados_array
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
        invitados_array
      }
  }`,
  createGroup: `mutation ($eventID: ID!, $grupo: JSON!) {
    creaGrupo(evento_id:$eventID, grupo: $grupo){
      success
      errors { message code }
      evento { grupos_array }
    }
  }`,
  createMenu: `mutation ($eventID: ID!, $menu: JSON!) {
    creaMenu(evento_id:$eventID, menu: $menu){
      success
      errors { message code }
      evento { menus { id nombre } }
    }
  }`,
  deleteMenu: `mutation ($eventID: ID!, $menuId: ID!) {
    borraMenu(evento_id:$eventID, menu_id: $menuId){
      success
      errors { message code }
      evento { menus { id nombre } }
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
  getPsTemplate: `query ($evento_id:ID!, $development:String!) {
    getPsTemplate(evento_id:$evento_id, development:$development)
  }`,
  createPsTemplate: `mutation ($evento_id:ID!, $template:PsTemplateInput!) {
    createPsTemplate(evento_id:$evento_id, template:$template)
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
      mesas_array
    }
  }`,
  getDevelopment: `query {
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
  }`,
  signOut: `mutation ($sessionCookie :String){
    signOut(sessionCookie:$sessionCookie)
  }`,
  testInvitacion: `mutation ($evento_id: String, $email: String, $phoneNumber: String, $lang: String){
    testInvitacion(evento_id:$evento_id, email:$email, phoneNumber:$phoneNumber, lang:$lang)
  }`,
  getGalerySvgs: `query ($evento_id: ID, $tipo: String) {
    getGalerySvgs(evento_id: $evento_id, tipo: $tipo) {
      total
      results{
        _id
        title
        icon
        tipo
      }
    }
  }`,
  createGalerySvgs: `mutation ($evento_id: ID, $galerySvgs:[inputGalerySvg]) {
    createGalerySvgs(evento_id: $evento_id, galerySvgs: $galerySvgs) {
      total
      results{
        _id
        title
        icon
        tipo
      }
    }
  }`,
  deleteGalerySvg: `mutation ($evento_id: ID, $icon_id: ID) {
    deleteGalerySvg(evento_id: $evento_id, icon_id: $icon_id) 
  }`,
  setPlanSpaceSelect: `mutation ($evento_id: ID, $planSpaceSelect: ID, $isOwner: Boolean) {
    setPlanSpaceSelect(evento_id: $evento_id, planSpaceSelect: $planSpaceSelect, isOwner: $isOwner)
  }`,
  getPlanSpaceSelect: `query ($evento_id: ID, $isOwner: Boolean) {
    getPlanSpaceSelect(evento_id: $evento_id, isOwner: $isOwner)
  }`,
  addTaskAttachments: `mutation ($eventID: String, $itinerarioID: String, $taskID: String, $attachment: inputFileData) {
    addTaskAttachments(eventID: $eventID, itinerarioID: $itinerarioID, taskID: $taskID, attachment: $attachment)
  }`,
  deleteTaskAttachment: `mutation ($eventID: String, $itinerarioID: String, $taskID: String, $attachmentID: String) {
    deleteTaskAttachment(eventID: $eventID, itinerarioID: $itinerarioID, taskID: $taskID, attachmentID: $attachmentID)
  }`,

  // WhatsApp Queries and Mutations
  whatsappGetSession: `query ($args: GetWhatsAppSessionArgs!) {
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
  }`,

  whatsappGetAllSessions: `query {
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
  }`,

  whatsappCreateSession: `mutation ($args: CreateWhatsAppSessionArgs!) {
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
  }`,

  whatsappRegenerateQR: `mutation ($sessionId: String!) {
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
  }`,

  whatsappDisconnectSession: `mutation ($args: DisconnectWhatsAppSessionArgs!) {
    whatsappDisconnectSession(args: $args) {
      success
      error
    }
  }`,

  whatsappSendMessage: `mutation ($args: SendWhatsAppMessageArgs!) {
    whatsappSendMessage(args: $args) {
      success
      messageId
      error
    }
  }`,
};

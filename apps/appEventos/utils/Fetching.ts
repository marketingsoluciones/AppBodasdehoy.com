import { api } from "../api";
import { normalizeApi2HttpBase } from "./resolveApi2BaseUrl";
import { resolveApiBodasOrigin } from "./apiEndpoints";
import { MCP_ADAPTERS, extractGraphqlField } from "./apiMcpAdapter";
import { invalidateCache } from "./Funciones";

/**
 * Cache TTL: cualquier mutation que afecte al estado del evento debe invalidar
 * el cache de la lista de eventos (`events_*`) para que el siguiente render
 * vea datos frescos. Lo hacemos a nivel de fetchApi* para que cada componente
 * no tenga que recordar invalidar — bastante con que use queries.* normal.
 *
 * Cómo lo detectamos: GraphQL siempre empieza con `mutation` o `query`. Si la
 * cadena del query empieza con `mutation`, invalidamos.
 */
function maybeInvalidateOnMutation(query: string): void {
  if (typeof query !== 'string') return
  // Saltar comentarios + espacios al inicio
  const trimmed = query.replace(/^\s+|^#.*$/gm, '').trimStart()
  if (trimmed.toLowerCase().startsWith('mutation')) {
    // Invalida TODO lo que empiece con 'events_' (lista de eventos por development+email)
    invalidateCache('events_', true)
    // También invalidamos planSpaceSelect, que cachea por evento
    invalidateCache('planSpaceSelect_', true)
  }
}

async function reportHttpFailureToSentry(kind: 'bodas' | 'eventos', error: any) {
  try {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
    const status = error?.response?.status
    if (status !== 502 && status !== 503) return
    const url = error?.config?.url
    const baseURL = error?.config?.baseURL
    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    let Sentry: any = null
    try {
      const req = (new Function('return typeof require !== "undefined" ? require : null'))()
      if (req) Sentry = req('@sentry/nextjs')
    } catch {}
    if (!Sentry?.withScope) return
    Sentry.withScope((scope) => {
      scope.setLevel('warning')
      scope.setTag('http.status', String(status))
      scope.setTag('http.kind', kind)
      if (hostname) scope.setTag('app.hostname', hostname)
      if (typeof url === 'string' && url) scope.setContext('http', { url, baseURL })
      scope.setFingerprint([`http-${kind}-${status}`])
      Sentry.captureMessage(`HTTP ${status} (${kind})`)
    })
    void Sentry.flush(1500)
  } catch { /* ignore */ }
}

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
  // El servidor (api-mcp) puede responder success:false con un error de conexión a su
  // BD DENTRO de data (DATABASE_CONNECTION_ERROR / "Client must be connected"). No es
  // "sin datos" ni sesión caducada: es un fallo temporal del backend → mensaje claro + reintento.
  if (
    error?.code === 'DATABASE_CONNECTION_ERROR' ||
    error?.message?.includes('base de datos no está conectada') ||
    error?.message?.includes('Client must be connected')
  ) {
    return 'Problema temporal de conexión con el servidor. Reintentando…';
  }
  return null;
}

interface propsFetchApiBodas {
  query: string;
  variables: any;
  type?: string;
  development?: string;
  token?: string;
}

// QA 30-jun: backend api-mcp puede devolver data:null + errors[] (ej.
// "Timeout (3000ms) en Mongo save user"). Los 103 callsites legacy esperan
// `null` en ese caso, así que mantenemos esa semántica, pero ESCRIBIMOS los
// errores aquí para que callsites críticos (login/auth) puedan inspeccionar
// la causa y mostrar mensaje al usuario en vez de fallar en silencio.
export interface FetchApiBodasErrorInfo {
  errors: any[];
  query: string;
  timestamp: number;
  traceId?: string;
}
export let lastFetchApiBodasError: FetchApiBodasErrorInfo | null = null;

function rememberError(query: string, errors: any[], headers?: any) {
  const traceId =
    headers?.['x-trace-id'] ||
    headers?.['X-Trace-Id'] ||
    headers?.['x-request-id'] ||
    headers?.['X-Request-Id'] ||
    errors?.[0]?.extensions?.traceId ||
    undefined;
  lastFetchApiBodasError = {
    errors,
    query: query?.substring(0, 200) || '',
    timestamp: Date.now(),
    traceId,
  };
}

/**
 * QA-R5 (30-jun): backend api-mcp con cluster Mongo M0 Free Tier tiene
 * latencias punta > 3s en `save user` que devuelven
 *   errors: [{ message: "Timeout (3000ms) en Mongo save user" }]
 * Retry exponencial con backoff (1s, 2s, 4s) para transitorios de este tipo,
 * SOLO cuando el mensaje es idempotente-seguro (auth es idempotente:
 * mismo idToken → misma sessionCookie).
 *
 * NO retry para mutations de negocio (createEvent, updateInvitado, etc.) —
 * un timeout allí podría haber persistido parcialmente y un segundo intento
 * duplicaría. Solo query `auth` está whitelisted.
 */
const RETRYABLE_ERROR_PATTERNS = [
  /timeout.*mongo|mongo.*timeout|mongo save user/i,
];
const RETRYABLE_QUERY_PATTERNS = [
  /mutation\s*\(?\s*\$?\s*idToken\s*:\s*String!?\s*\)?\s*\{?\s*auth\s*\(/i,
  /mutation\s+Auth\b/i,
];
const RETRY_DELAYS_MS = [1000, 2000, 4000];

function isRetryable(query: string, errors: any[]): boolean {
  const queryOk = RETRYABLE_QUERY_PATTERNS.some((p) => p.test(query || ''));
  if (!queryOk) return false;
  const messages = errors.map((e: any) => String(e?.message || ''));
  return messages.some((m) => RETRYABLE_ERROR_PATTERNS.some((p) => p.test(m)));
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const fetchApiBodas = async ({
  query = ``,
  variables = {},
  type = "json",
  token,
  development,
}: propsFetchApiBodas): Promise<any> => {
  try {
    if (type === "json") {
      let response: any;
      let attempt = 0;
      const maxAttempts = 1 + RETRY_DELAYS_MS.length;
      // Bucle de reintentos SOLO para queries whitelisted + errores retryable.
      while (attempt < maxAttempts) {
        response = await api.ApiBodas({ data: { query, variables }, development, token });
        const errs = response?.data?.errors;
        const hasErrs = Array.isArray(errs) && errs.length > 0;
        if (!hasErrs || !isRetryable(query, errs)) break;
        // último intento: no dormir más, salir del bucle
        if (attempt + 1 >= maxAttempts) break;
        const delay = RETRY_DELAYS_MS[attempt];
        console.warn(
          `[fetchApiBodas] Retry ${attempt + 1}/${RETRY_DELAYS_MS.length} en ${delay}ms — motivo:`,
          errs[0]?.message,
        );
        await wait(delay);
        attempt++;
      }
      const { data, errors } = response?.data || {};
      // BUG QA-R5 (30-jun): backend puede devolver `{data: {auth: null}, errors: [...]}`
      // — data NO es null (es objeto con field null) → el guard viejo
      // `if (!data && errors)` NO capturaba y los errores se perdían silente.
      const hasErrors = Array.isArray(errors) && errors.length > 0;
      if (hasErrors) {
        rememberError(query, errors, response?.headers);
        console.warn("[fetchApiBodas] GraphQL errors:", {
          attempts: attempt + 1,
          errors: errors.map((e: any) => ({ message: e?.message, path: e?.path })),
          query: query?.substring(0, 200),
          traceId: lastFetchApiBodasError?.traceId,
        });
      } else if (data) {
        // Limpiar último error si esta llamada fue completamente OK.
        lastFetchApiBodasError = null;
      }
      if (!data) return null;
      maybeInvalidateOnMutation(query);
      return Object.values(data)[0] ?? null;
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

      const { data } = await api.ApiApp(formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.errors) {
        throw new Error(JSON.stringify(data.errors));
      }

      maybeInvalidateOnMutation(query);
      return Object.values(data.data)[0];
    }
  } catch (error: any) {
    const status = error?.response?.status
    const log = status === 502 || status === 503 ? console.warn : console.error
    log("[fetchApiBodas] Error en la llamada API:", {
      message: error?.message,
      code: error?.code,
      isAxiosError: error?.isAxiosError,
      response: error?.response?.data,
      status
    });
    void reportHttpFailureToSentry('bodas', error)
    throw error; // Lanzar el error en lugar de retornarlo
  }
};

interface argsFetchApi {
  query: string;
  variables: object;
  token?: string;
  domain?: string;
  development?: string;
}
/** Retorno depende de la mutación/query; tipar en el callsite si hace falta. */
export const fetchApiEventos = async ({
  query,
  variables,
  token,
}: argsFetchApi): Promise<any> => {
  // ── Adaptador legacy→api-mcp ──
  // 2026-06-05: apiapp retirado. Si la query legacy tiene adaptador, traduce a canonical
  // y enruta a api-mcp. Si NO está en MCP_ADAPTERS, la query va tal cual al host
  // resuelto por `resolveApiEventosOrigin()` que por DEFAULT apunta a api-mcp.
  // En ese caso fallará con error GraphQL si el shape no es canonical — es lo correcto,
  // fuerza migrar el call-site (no silent fallback a un backend retirado).
  const __field = extractGraphqlField(query);
  const __adapter = __field ? MCP_ADAPTERS[__field] : undefined;
  if (__adapter) {
    const __mapped = __adapter.mapVariables(variables || {});
    // mapVariables puede devolver null para señalar "no adaptar este caso" → llama directo
    // al host eventos resuelto (api-mcp por default). Si shape mismatch → error GraphQL claro.
    if (__mapped != null) {
      const canonical = await fetchApiBodas({
        query: __adapter.canonicalQuery,
        variables: __mapped,
        token,
      });
      maybeInvalidateOnMutation(query);
      return __adapter.mapResponse(canonical, variables || {});
    }
    // crearTarea/actualizarTarea: la query ya es canónica; sin map no hay fallback CRM válido.
    if (__field === 'crearTarea' || __field === 'actualizarTarea') {
      throw new Error(
        `[fetchApiEventos] ${__field}: adapter no pudo mapear (falta evento_id, itinerario_id o task_id)`
      );
    }
    // updateEvento: la query legacy declara `$input: EventoUpdateInput!` como OBLIGATORIO, así
    // que la llamada directa sale siempre sin `input` → 400 garantizado. Al repetirse, api-mcp
    // contesta 429 ("Demasiadas solicitudes desde esta IP") y tumba al resto de la app: eso
    // llenó 4,9 GB de log el 27-ago. No hay llamada válida que salvar aquí, así que cortamos
    // antes de la red y dejamos dicho QUÉ llegó, que es lo que faltaba para dar con el llamante.
    if (__field === 'updateEvento') {
      const vars = (variables || {}) as Record<string, any>;
      throw new Error(
        `[fetchApiEventos] updateEvento: adapter no pudo mapear (falta 'input' o 'variable') — ` +
          `idEvento=${vars.idEvento ?? '(vacío)'} input=${typeof vars.input} ` +
          `variable=${typeof vars.variable} keys=[${Object.keys(vars).join(',')}]`
      );
    }
    if (__field === 'createTask' || __field === 'editTask') {
      const vars = (variables || {}) as Record<string, any>;
      const task = vars.task ?? vars.tarea ?? {};
      const hasItin = !!(
        vars.itinerario_id ||
        vars.itinerarioID ||
        task?.itinerario_id ||
        task?.itinerarioID
      );
      if (hasItin) {
        throw new Error(
          `[fetchApiEventos] ${__field}: adapter no pudo mapear (falta evento_id, itinerario_id o task_id)`
        );
      }
    }
  }
  try {
    const axiosRes = await api.ApiApp({ query, variables }, token);
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
    maybeInvalidateOnMutation(query);
    return payload;
  } catch (error: any) {
    const status = error?.response?.status
    const log = status === 502 || status === 503 ? console.warn : console.error
    log("[fetchApiEventos] Error en la llamada API:", {
      message: error?.message,
      code: error?.code,
      isAxiosError: error?.isAxiosError,
      response: error?.response?.data,
      status
    });
    void reportHttpFailureToSentry('eventos', error)
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
    baseURL: normalizeApi2HttpBase(),
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
  // Shape canonical api-mcp 2026-06-05 (rev. 10:30):
  // api-mcp añadió categoria_id como arg opcional (coherencia con
  // actualizarGastoPresupuesto). Front lo pasa de nuevo para localización exacta
  // (evita scan de todas las categorías del presupuesto). Devuelve EventoResponse.
  deletepayment: `mutation($evento_id:ID!, $categoria_id:ID!, $gasto_id:ID!, $pago_id:ID!){
    borraPago(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, pago_id:$pago_id){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
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

  getAllBusiness: `query ($criteria: DIR_BusinessSearchCriteria, $sort: DIR_SortInput, $skip: Int, $limit: Int, $development: String!) {
    getAllBusinesses(searchCriteria:$criteria, sort: $sort, skip: $skip, limit: $limit, development: $development){
      total
      results: businesses{
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
  // singleUpload canonical api-mcp (sube a R2 multi-tenant). Front pasa file + eventId + development.
  // category opcional (= use legacy). Devuelve FileMetadata{_id, publicUrls{original,optimized800w,optimized400w,thumbnail}, createdAt}.
  // Los call-sites mapean publicUrls a {i1024,i800,i640,i320} para compat con consumers existentes.
  singleUpload: `mutation($file:Upload!,$development:String!,$eventId:ID!,$category:String) {
    singleUpload(file:$file, development:$development, eventId:$eventId, category:$category){
      success
      errors{ field message code }
      file{
        _id
        createdAt
        publicUrls{ original optimized800w optimized400w thumbnail }
      }
    }
  }`,

  // uploadProfileImage canonical (commit api-mcp 9fcea06, 2026-06-01).
  // Endpoint dedicado para foto perfil — sin eventId. Mismo shape FileMetadataResponse.
  uploadProfileImage: `mutation($file:Upload!,$development:String!,$userId:String!,$category:String) {
    uploadProfileImage(file:$file, development:$development, userId:$userId, category:$category){
      success
      errors{ field message code }
      file{
        _id
        createdAt
        publicUrls{ original optimized800w optimized400w thumbnail }
      }
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
            interval_count
          }
        }
        metadata
      }
    }
  }`,

  editTask: `mutation ($evento_id:ID!, $itinerario_id:ID!, $tarea_id:ID!, $updates:TareaUpdateInput!){
    actualizarTarea(evento_id:$evento_id, itinerario_id:$itinerario_id, tarea_id:$tarea_id, updates:$updates){
      success
      errors{ field message code }
      itinerario {
        _id
        tasks {
          _id
          descripcion
          fecha
          responsable
          duracion
          tags
          icon
          completada
          attachments
          comments
          commentsViewers
          fecha_creacion
          updatedAt
        }
      }
    }
  }`,

  createTask: `mutation ($evento_id:ID!, $itinerario_id:ID!, $tarea:TareaInput!){
    crearTarea(evento_id:$evento_id, itinerario_id:$itinerario_id, tarea:$tarea){
      success
      errors{ field message code }
      itinerario {
        _id
        tasks {
          _id
          descripcion
          fecha
          responsable
          duracion
          tags
          icon
          completada
          attachments
          comments
          commentsViewers
          fecha_creacion
          updatedAt
        }
      }
    }
  }`,

  deleteTask: `mutation ($task_id:ID!, $development:String!){
    deleteTask(task_id:$task_id, development:$development){
      success
      errors{ field message code }
    }
  }`,
  createComment: `
  mutation  ( $eventID:String, $itinerarioID:String, $taskID:String, $comment:String, $attachments: [inputFileData], $nicknameUnregistered:String) {
    createComment ( eventID:$eventID  itinerarioID:$itinerarioID  taskID:$taskID, comment:$comment, attachments: $attachments, nicknameUnregistered:$nicknameUnregistered){
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
  }`,
  deleteComment: `
  mutation  ( $eventID:String, $itinerarioID:String, $taskID:String, $commentID:String  ) {
    deleteComment ( eventID:$eventID  itinerarioID:$itinerarioID  taskID:$taskID, commentID:$commentID)
  }`,
  createItinerario: `mutation ($evento_id:ID!, $itinerario:ItinerarioInput!){
    crearItinerario(evento_id:$evento_id, itinerario:$itinerario){
      success
      errors{ field message code }
      itinerario{
        _id
        title
        tipo
        tasks{ _id descripcion fecha responsable duracion tags icon completada }
        viewers
        participantes
        chat_id
        completion_percentage
        fecha_creacion
        updatedAt
      }
    }
  }`,
  duplicateItinerario: `mutation ($evento_id:ID!, $itinerario_id:ID!){
    duplicateItinerario(evento_id:$evento_id, itinerario_id:$itinerario_id){
      success
      errors{ field message code }
      itinerario{
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
  editItinerario: `mutation ($evento_id:ID!, $itinerario_id:ID!, $datos:JSON!){
    editItinerario(evento_id:$evento_id, itinerario_id:$itinerario_id, datos:$datos){
      success
      errors{ field message code }
      itinerario{ _id }
    }
  }`,
  deleteItinerario: `mutation ($evento_id:ID!, $itinerario_id:ID!){
    deleteItinerario(evento_id:$evento_id, itinerario_id:$itinerario_id){
      success
      errors{ field message code }
    }
  }`,
  getItinerario: ` query($evento_id:String, $itinerario_id:String){
    getItinerario(evento_id:$evento_id, itinerario_id:$itinerario_id){
      nombre
      tipo
      timeZone
      itinerarios_array{
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
  // api-mcp getUsersByIds(ids, development): [User!]!
  // 07-jul: User ya expone displayName/photoURL/phoneNumber/onLine reales
  // (api-mcp confirmado). Retirado el alias fallback `displayName: email` y
  // pedidos los campos reales. Se mantiene:
  //   - getUsers: getUsersByIds  (campo response sigue siendo "getUsers")
  //   - uid: id                  (call-sites leen u.uid → == u.id)
  getUsers: `query ($ids:[ID!]!, $development:String!){
    getUsers: getUsersByIds(ids:$ids, development:$development){
      uid: id
      email
      displayName
      photoURL
      phoneNumber
      onLine
    }
  }`,
  auth: `mutation ($idToken : String!){
    auth(idToken: $idToken){
      sessionCookie
    }
  }`,
  // BUG-9 + NEW-1 (informe QA post-commit 21-jun): api-mcp Mutation.updateUser:
  //   · Usa `id`, NO `uid` (legacy apiapp). Mantenemos $uid en variables por
  //     compat con call-sites (Card, EventsTable, FormCrearEvento).
  //   · Retorna `UserResponse` (NO `User`). UserResponse SOLO tiene
  //     {success, errors{field,message,code}}. Pedir city/country da
  //     "Cannot query field city on type UserResponse" verificado en vivo.
  updateUser: `mutation ($uid:ID, $variable:String, $valor:String){
    updateUser(id:$uid, variable:$variable, valor:$valor){
      success
      errors { field message code }
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
  authStatus: `mutation ($sessionCookie : String!){
        status(sessionCookie: $sessionCookie){
          customToken
        }
  }`,
  // T-501 (2026-05-24): validación canónica de sesión. Reemplaza el legacy
  // `status(sessionCookie)` mutation que api-mcp valida solo con JWT_SECRET OLD.
  // getCurrentUser pasa por context.ts dual-accept (NEW→OLD). Bearer = sessionCookie.
  getCurrentUser: `query {
        getCurrentUser {
          id
          email
          role
          development
        }
  }`,
  // QA1 23-jun re-test v2: api-mcp expone detalles_compartidos_array como
  // [JSON!] (escalar), NO admite sub-selección {email, uid, ...} → 400
  // "must not have a selection since type [JSON!] has no subfields" bloqueaba
  // crearEvento. Quitar las llaves. Mismo cambio en los otros 3 queries del
  // archivo donde aparece detalles_compartidos_array{...} (eventos y editEvento).
  eventCreate: `mutation ($input: EventoInput!){
    createEvento(input: $input){
      success
      errors{ field message code }
      evento{
      _id
      grupos_array
      compartido_array
      detalles_compartidos_array
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
      galerySvgVersion
      listaRegalos
      listIdentifiers
      poblacion
      pais
      timeZone
      templateEmailSelect
      templateWhatsappSelect
      imgEvento
      imgInvitacion
      notificaciones_array
      itinerarios_array
      planSpaceSelect
      planSpace
      mesas_array
      invitados_array
      menus_array
      presupuesto_objeto
      showChildrenGuest
    }
  }
}`,
  /* Nota: los 9 campos anteriores (imgEvento/imgInvitacion/*_array/
     presupuesto_objeto) son String/JSON escalares en el schema api-mcp
     (04-jul). Sin subselections. Cliente consume el JSON opaco tal cual
     (arrays de objetos). Fix del error EVT-01 "must not have a selection
     since type X has no subfields".
     IMPORTANTE: comentarios GraphQL con `#` NO deben ir dentro del template
     string — el cliente aplasta el string a 1 línea antes de enviarlo al
     server, y el `#` come todo hasta el final del string → nuevo error
     "Syntax Error: Expected Name, found <EOF>" (QA 05-jul EVT-01 v2). */

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

  duplicatePresupuesto: `mutation ($evento_id:ID!, $nuevo_evento_id:ID!){
    duplicatePresupuesto(evento_id:$evento_id, nuevo_evento_id:$nuevo_evento_id){
      success
      errors{ field message code }
      evento{
        presupuesto_total
        viewEstimates
        coste_estimado
        coste_final
        pagado
        currency
        visibleColumns { accessor show }
        totalStimatedGuests{ children adults }
        categorias_array{
          _id
          coste_proporcion coste_estimado coste_final pagado nombre
          gastos_array{
            _id
            coste_proporcion coste_estimado coste_final pagado nombre linkTask estatus
            pagos_array{ _id }
            items_array{
              _id next_id unidad cantidad nombre valor_unitario total estatus fecha_creacion
            }
          }
        }
      }
    }
  }`,
  nuevoCategoria: `mutation ($evento_id: ID!, $nombre: String){
    nuevoCategoria(evento_id:$evento_id, nombre:$nombre){
      success
      errors{ field message code }
      evento{
        _id
        presupuesto_objeto
      }
    }
  }`,
  borraCategoria: `mutation($evento_id:ID!, $categoria_id:ID!){
    borraCategoria(evento_id:$evento_id, categoria_id:$categoria_id){
      success
      errors{ field message code }
      evento{ _id }
    }
  }`,
  editCategoria: `mutation($evento_id:ID!, $categoria_id:ID!, $updates:CategoriaPresupuestoUpdateInput!){
    actualizarCategoriaPresupuesto(evento_id:$evento_id, categoria_id:$categoria_id, updates:$updates){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,
  nuevoPago: `mutation($evento_id:ID!, $categoria_id:ID, $gasto_id:ID!, $pagos_array:[JSON!]){
    nuevoPago(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, pagos_array:$pagos_array){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,

  editPago: `mutation($evento_id:ID!, $categoria_id:ID, $gasto_id:ID, $pago_id:ID!, $pagos_array:[JSON!]){
    editPago(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, pago_id:$pago_id, pagos_array:$pagos_array){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,

  // BUG-CW-N06 (informe QA 23-jun 4ª ronda): el campo del schema se llama
  // `borrarGasto` (con 'r'), no `borraGasto`. El backend devolvía
  // "Cannot query field borraGasto on type Mutation". El adapter MCP usa
  // `eliminarGastoPresupuesto` (canonical), pero cuando NO se va por el
  // adapter (ej. event no en api-mcp), el query directo iba al endpoint
  // legacy con nombre erróneo.
  borrarGasto: `mutation($evento_id:ID!, $categoria_id:ID!, $gasto_id:ID!){
    borrarGasto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,
  nuevoGasto: `mutation($evento_id:ID!, $categoria_id:ID!, $nombre:String){
    nuevoGasto(evento_id:$evento_id, categoria_id:$categoria_id, nombre:$nombre){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,
  editGasto: `mutation($evento_id:ID!, $categoria_id:ID, $gasto_id:ID!, $variable_reemplazar:String, $valor_reemplazar:String){
    editGasto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, variable_reemplazar:$variable_reemplazar, valor_reemplazar:$valor_reemplazar){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,
  editItemGasto: `mutation($evento_id: ID ,$categoria_id: ID, $gasto_id: ID, $itemGasto_id: ID, $variable: String, $valor: StringIntBool){
    editItemGasto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, itemGasto_id:$itemGasto_id, variable:$variable, valor:$valor){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,
  nuevoItemGasto: `mutation($evento_id:ID!, $categoria_id:ID, $gasto_id:ID!, $itemGasto:JSON){
    nuevoItemGasto(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, itemGasto:$itemGasto){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,
  borrarItemsGastos: `mutation($evento_id:ID!, $categoria_id:ID, $gasto_id:ID!, $itemsGastos_ids:[ID!]!){
    borraItemsGastos(evento_id:$evento_id, categoria_id:$categoria_id, gasto_id:$gasto_id, itemsGastos_ids:$itemsGastos_ids){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,
  editPresupuesto: `mutation($evento_id:ID!, $datos:JSON!){
    editPresupuesto(evento_id:$evento_id, datos:$datos){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,
  // Depósitos Wedding Planner (Dashboard). El backend expone estas mutaciones (verificado por
  // introspección api-mcp): addWeddingPlannerIngreso(evento_id:ID!, ingreso:JSON!):EventoResponse!
  // y deleteWeddingPlannerIngreso(evento_id:ID!, ingreso_id:ID!):EventoResponse!. Antes faltaban
  // en el front (se enviaba query:undefined) → registrar/borrar depósito estaba roto.
  addWeddingPlannerIngreso: `mutation($evento_id:ID!, $ingreso:JSON!){
    addWeddingPlannerIngreso(evento_id:$evento_id, ingreso:$ingreso){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
    }
  }`,
  deleteWeddingPlannerIngreso: `mutation($evento_id:ID!, $ingreso_id:ID!){
    deleteWeddingPlannerIngreso(evento_id:$evento_id, ingreso_id:$ingreso_id){
      success
      errors{ field message code }
      evento{ _id presupuesto_objeto }
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
      success
      errors{ field message code }
      evento{
        compartido_array
        detalles_compartidos_array
      }
    }
  }`,
  updateCompartitions: `mutation($args:inputCompartition){
    updateCompartition(args:$args){
      success
      errors{ field message code }
    }
  }`,
  deleteCompartitions: `mutation($args:inputCompartition){
    deleteCompartition(args:$args){
      success
      errors{ field message code }
    }
  }`,
  // Migración apiapp→api-mcp 2026-05-27: reemplaza queryenEvento (apiapp legacy).
  // getEventosByUsuario(usuario_id) devuelve owned + shared en 1 call (securityFilter $or).
  // Campos complejos (lugar, *_array, presupuesto_objeto, etc.) son JSON escalar en api-mcp
  // → se piden SIN subselección; devuelven el objeto completo (el front accede en runtime).
  getEventosByUsuario: `query ($uid: String!, $pag: CRM_PaginationInput!, $dev: String) {
    getEventosByUsuario(usuario_id: $uid, pagination: $pag, development: $dev){
      success
      errors{ message code }
      total
      eventos{
        _id development grupos_array compartido_array detalles_compartidos_array
        estatus color temporada estilo tematica tarta nombre
        fecha_actualizacion fecha_creacion tipo usuario_id usuario_nombre fecha
        galerySvgVersion listaRegalos listIdentifiers poblacion pais lugar timeZone
        templateEmailSelect templateWhatsappSelect imgEvento imgInvitacion
        notificaciones_array itinerarios_array planSpaceSelect planSpace
        mesas_array invitados_array menus_array presupuesto_objeto showChildrenGuest
      }
    }
  }`,
  getEventsByID: `query ($variable: String, $valor: String, $development: String!) {
    queryenEvento( variable:$variable, valor:$valor, development:$development){
      _id
      development
      grupos_array
      compartido_array
      detalles_compartidos_array
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
      galerySvgVersion
      listaRegalos
      listIdentifiers
      poblacion
      pais
      lugar {
        _id
        title
        slug
      }
      timeZone
      templateEmailSelect
      templateWhatsappSelect
      imgEvento
      imgInvitacion
      notificaciones_array
      itinerarios_array
      planSpaceSelect
      planSpace
      mesas_array
      invitados_array
      menus_array
      presupuesto_objeto
      showChildrenGuest
    }
  }`,
  /* Nota (getEventsByID): mismos campos escalares que createEvento. Sin
     subselections. Sin comentarios # dentro del template (aplasta a 1 línea
     y rompe el parser). Ver EVT-01 v2 en createEvento. */
  eventDelete: `mutation ($eventoID : ID!) {
    deleteEvento(id:$eventoID){
      success
      errors{ field message code }
    }
  }`,
  eventUpdate: `mutation ($idEvento: ID!, $input: EventoUpdateInput!){
    updateEvento(id: $idEvento, input: $input){
      success
      errors{ field message code }
      evento{ _id }
    }
  }`,
  // api-mcp canonical (SDL evento.ts): createGuests NO existe; el equivalente es
  // agregarInvitadosBatch(evento_id, invitados:[JSON!]!) → EventoBatchResponse.
  // Autogenera _id server-side (IGNORA cualquier _id de cliente). invitados_array escalar.
  // Solo para CREAR invitados nuevos (no editar). Verificado 2026-05-28.
  createGuests: `mutation ($eventID: ID!, $invitados_array: [JSON!]!) {
    agregarInvitadosBatch(evento_id: $eventID, invitados: $invitados_array){
      success
      processed
      errors{ field message code }
      evento{
        _id
        invitados_array
      }
   }
  }`,
  // api-mcp canonical: invitado_id es String!, datos es JSON! (obligatorio),
  // invitados_array es escalar [JSON!] (NO admite selección de subcampos).
  // actualizarInvitado hace MERGE (preserva campos no enviados). Verificado 2026-05-28.
  editGuests: `mutation ($eventID:ID!, $guestID:String!, $datos: JSON!) {
    actualizarInvitado(
      evento_id: $eventID,
      invitado_id: $guestID,
      datos: $datos
    ){
      success
      errors{ field message code }
      evento{
        _id
        invitados_array
      }
    }
  }`,
  // api-mcp canonical (SDL evento.ts): borraInvitados NO existe; el equivalente es
  // removerInvitadosBatch(evento_id, invitado_ids:[ID!]!) → EventoBatchResponse.
  // invitados_array escalar. El consumer lee result.evento.invitados_array.
  removeGuests: `mutation ($eventID:ID!, $guests: [ID!]!){
      removerInvitadosBatch(evento_id:$eventID,
      invitado_ids:$guests){
        success
        processed
        errors{ field message code }
        evento{
          _id
          invitados_array
        }
      }
  }`,
  // api-mcp canonical (SDL evento.ts): creaGrupo(grupo:JSON!), creaMenu(menu:JSON!),
  // borraMenu(menu_id:ID!). EventoResponse{success,errors,evento}. grupos_array/menus_array escalares.
  createGroup: `mutation ($eventID: ID!, $grupo: JSON!) {
    creaGrupo(evento_id: $eventID, grupo: $grupo){
      success
      errors{ field message code }
      evento{ _id grupos_array }
    }
  }`,
  createMenu: `mutation ($eventID: ID!, $menu: JSON!) {
    creaMenu(evento_id: $eventID, menu: $menu){
      success
      errors{ field message code }
      evento{ _id menus_array }
    }
  }`,
  deleteMenu: `mutation ($eventID: ID!, $menuId: ID!) {
    borraMenu(evento_id: $eventID, menu_id: $menuId){
      success
      errors{ field message code }
      evento{ _id menus_array }
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
  getPsTemplate: `query ($uid: String, $evento_id: ID!, $development: String!) {
    getPsTemplate(uid: $uid, evento_id: $evento_id, development: $development) {
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
      success
      errors{ field message code }
      evento{ _id }
    }
  }`,
  editTable: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID, $variable: String, $valor: String) {
    editTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, tableID:$tableID, variable:$variable, valor:$valor) {
      success
      errors{ field message code }
      evento{ _id }
    }
  }`,
  deleteTable: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID) {
    deleteTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, tableID:$tableID) {
      success
      errors{ field message code }
    }
  }`,
  /* createPlanSpace EXISTE en api-mcp (verificado por SSH en el resolver): crea el
     planSpace, lo hace push a evento.planSpace, pone planSpaceSelect = nuevo._id y
     DEVUELVE el planSpace nuevo (JSON). */
  createPlanSpace: `mutation ($evento_id: ID!, $title: String) {
    createPlanSpace(evento_id: $evento_id, title: $title)
  }`,
  createElement: `mutation ($evento_id: ID!, $element: JSON!) {
    createElement(evento_id: $evento_id, element: $element) {
      success
      errors{ field message code }
      evento{ _id planSpace }
    }
  }`,
  editElement: `mutation ($evento_id: ID!, $element_id: ID!, $datos: JSON!) {
    editElement(evento_id: $evento_id, element_id: $element_id, datos: $datos) {
      success
      errors{ field message code }
      evento{ _id }
    }
  }`,
  deleteElement: `mutation ($evento_id: ID!, $element_id: ID!) {
    deleteElement(evento_id: $evento_id, element_id: $element_id) {
      success
      errors{ field message code }
    }
  }`,
  signOut: `mutation ($sessionCookie :String!){
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
  // Queries migradas a api-mcp canonical 2026-05-31: firma sessionKey:String! y type
  // WhatsAppWebSession{sessionKey, development, userId, status, qrCode, phoneNumber, connectedAt, isConnected}.
  // userId añadido por BACKEND commit 872678f — restaura detección dupplicatingConnection multi-user.
  // El call-site mapea sessionKey → id para compat con consumer.
  whatsappGetSession: `query($sessionKey: String!) {
    whatsappGetSession(sessionKey: $sessionKey) {
      sessionKey
      development
      userId
      status
      isConnected
      qrCode
      phoneNumber
      connectedAt
    }
  }`,

  whatsappCreateSession: `mutation($sessionKey: String!) {
    whatsappCreateSession(sessionKey: $sessionKey) {
      success
      session {
        sessionKey
        development
        userId
        status
        isConnected
        qrCode
        phoneNumber
        connectedAt
      }
      error
    }
  }`,

  whatsappRegenerateQR: `mutation($sessionKey: String!) {
    whatsappRegenerateQR(sessionKey: $sessionKey) {
      success
      session {
        sessionKey
        development
        userId
        status
        isConnected
        qrCode
        phoneNumber
        connectedAt
      }
      error
    }
  }`,

  whatsappDisconnectSession: `mutation($sessionKey: String!) {
    whatsappDisconnectSession(sessionKey: $sessionKey) {
      success
      error
    }
  }`,

  // ── api-mcp 2026-06-05 ── última Cat C (commit cb9b33c)
  // Reordena las tareas dentro de un itinerario del evento.
  updateTasksOrder: `mutation($evento_id:ID!,$itinerario_id:ID!,$taskIds:[ID!]!){
    updateTasksOrder(evento_id:$evento_id, itinerario_id:$itinerario_id, taskIds:$taskIds){
      success
      errors{ field message code }
      evento{ _id }
      itinerario{ _id tasks { _id } }
    }
  }`,

};

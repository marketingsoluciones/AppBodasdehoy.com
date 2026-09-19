/**
 * Coordinación de límites de plan — invitados (appEventos)
 *
 * Tras la migración a **API2** como servicio de suscripción/planes, la **fuente de verdad de datos
 * de plan y cuotas mostradas** (incl. `guests-per-event`) es **API2** vía `usePlanLimits` y facturación.
 * La mutación de eventos (API app) debe **aplicar las mismas reglas al persistir**; si no, solo habría
 * desfase entre lo que muestra la UI (API2) y lo que permite el guardado.
 *
 * Capas en el cliente:
 *
 * 1. **API2 (solo planes / límites en UI)** (`hooks/usePlanLimits.ts`, `NEXT_PUBLIC_API2_URL`, por defecto
 *    `https://api2.eventosorganizador.com/graphql`): `getSubscriptionPlans`, `getMySubscription` con **Bearer =
 *    JWT Firebase**, cabecera `X-Development` = marca. **No** es la misma ruta que la lista de eventos (`fetchApiEventos` /
 *    `queryenEvento` vía proxy **ApiApp**). Si el usuario tiene pago solo en un sistema legacy y **no** hay fila de
 *    suscripción en API2 vinculada a ese uid, `usePlanLimits` cae al plan FREE público y `hasLinkedSubscriptionInApi2 === false`.
 *
 * 2. **API app GraphQL** (vía `fetchApiEventos` en `utils/Fetching.ts`) — persistencia de invitados:
 *    - **Legacy / apiapp:** la mutación usada en este repo es `creaInvitado` → payload con `invitados_array`.
 *    - **Otro despliegue / mismo dominio eventos:** la mutación equivalente allí puede ser `agregarInvitado`
 *      con payload estilo **`{ success, errors[], evento? }`** (`errors[].field`, `errors[].message`,
 *      `errors[].code`) **dentro de `data` en el JSON GraphQL**, no como `errors` top-level con
 *      `extensions`. Suele ir con **HTTP 200**. No es “otro producto” que integremos: es solo **otra forma
 *      de devolver el fallo en el mismo tipo de respuesta HTTP**.
 *    API2 confirma (2026-04): la mutación equivalente `agregarInvitado` allí aún no aplica en servidor
 *    la cuota del plan (solo permisos y push al array). En este repo la mutación típica es
 *    `creaInvitado` (apiapp); el mismo desfase UI vs guardado aplica hasta backlog de cuota en servidor.
 *    Cuando exista, conviene `errors[].code` ∈
 *    {@link GRAPHQL_PLAN_LIMIT_EXTENSION_CODES} o mensajes de {@link PLAN_LIMIT_MESSAGE_MARKERS}.
 *
 * **Contratos que entiende el front:**
 * - **GraphQL top-level** `errors[]` con `extensions.code` o `message` (p. ej. proxy u otro servicio).
 * - **Fallo en el payload de la mutación:** bajo `data.data.<nombreMutación>` con `success === false` y
 *   `errors[]` (`code` / `message` en cada ítem). `fetchApiEventos` convierte eso a un error con
 *   `response.data.errors` para reutilizar el mismo `catch` en los formularios.
 * - Opcional: HTTP **402** (el cliente lo trata como límite de plan).
 *
 * **Cliente:** detección en `planLimitFromApiError.ts` (`isPlanLimitOrGuestQuotaError`,
 * `notifyGuestMutationPlanOrGenericError`) y modal de upgrade vía `setActionModals` en AuthContext.
 */

/** SKU en API2 / shared — mismos límites que `canAccess(..., plan)` para invitados por evento. */
export const PLAN_SKU_GUESTS_PER_EVENT = 'guests-per-event' as const;

/** Códigos de límite de plan (`extensions.code` en GraphQL o `errors[].code` en payload con success: false). */
export const GRAPHQL_PLAN_LIMIT_EXTENSION_CODES = [
  'GUEST_LIMIT',
  'PLAN_LIMIT',
  'QUOTA_EXCEEDED',
  'LIMIT_EXCEEDED',
  'SUBSCRIPTION_REQUIRED',
  'UPGRADE_REQUIRED',
] as const;

/**
 * Marcadores en `errors[].message` (y a veces en el mensaje de Error) si no hay `extensions.code`.
 * Mantener alineado con los textos que decida devolver la API app.
 */
export const PLAN_LIMIT_MESSAGE_MARKERS = [
  'guest limit',
  'guest_limit',
  'plan limit',
  'plan_limit',
  'límite de invitados',
  'limite de invitados',
  'máximo de invitados',
  'maximo de invitados',
  'límite del plan',
  'limite del plan',
  'quota exceeded',
  'cuota de invitados',
] as const;

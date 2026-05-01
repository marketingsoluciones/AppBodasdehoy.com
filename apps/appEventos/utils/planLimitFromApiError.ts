import {
  GRAPHQL_PLAN_LIMIT_EXTENSION_CODES,
  PLAN_LIMIT_MESSAGE_MARKERS,
} from './planLimitsCoordination';

const EXTENSION_CODES = new Set<string>([...GRAPHQL_PLAN_LIMIT_EXTENSION_CODES]);
const MESSAGE_MARKERS: readonly string[] = [...PLAN_LIMIT_MESSAGE_MARKERS];

function scanGraphqlErrors(errors: unknown[]): boolean {
  for (const e of errors) {
    if (!e || typeof e !== 'object') continue;
    const row = e as Record<string, unknown>;
    const ext = row.extensions as Record<string, unknown> | undefined;
    const code = String(ext?.code ?? ext?.exception ?? row.code ?? '').toUpperCase();
    if (code && EXTENSION_CODES.has(code)) return true;
    const msg = String(row.message ?? '').toLowerCase();
    if (MESSAGE_MARKERS.some((m) => msg.includes(m))) return true;
  }
  return false;
}

/** Errores cuando `data.<mutation>` trae `success: false` y `errors[]` (mismo JSON GraphQL, HTTP 200). */
function collectErrorsFromMutationPayloadInData(body: unknown): unknown[][] {
  const out: unknown[][] = [];
  if (!body || typeof body !== 'object') return out;
  const inner = (body as Record<string, unknown>).data;
  if (!inner || typeof inner !== 'object') return out;
  for (const v of Object.values(inner)) {
    if (!v || typeof v !== 'object') continue;
    const o = v as Record<string, unknown>;
    if (o.success === false && Array.isArray(o.errors) && o.errors.length) {
      out.push(o.errors);
    }
  }
  return out;
}

function collectErrorArrays(error: Record<string, unknown>): unknown[][] {
  const out: unknown[][] = [];
  const data = error.response && (error.response as Record<string, unknown>).data;
  if (data && typeof data === 'object' && Array.isArray((data as Record<string, unknown>).errors)) {
    out.push((data as { errors: unknown[] }).errors);
  }
  for (const arr of collectErrorsFromMutationPayloadInData(data)) {
    out.push(arr);
  }
  if (Array.isArray(error.errors)) out.push(error.errors);
  return out;
}

export function isPlanLimitOrGuestQuotaError(error: unknown): boolean {
  if (error == null) return false;
  const err = error as Record<string, unknown>;
  const status = (err.response as Record<string, number> | undefined)?.status;
  if (status === 402) return true;

  for (const arr of collectErrorArrays(err)) {
    if (scanGraphqlErrors(arr)) return true;
  }

  const raw = String(err.message ?? error).toLowerCase();
  if (MESSAGE_MARKERS.some((m) => raw.includes(m))) return true;

  return false;
}

type ToastFn = (type: 'success' | 'error' | 'warning', message: string) => void;

/**
 * Toast unificado para fallos al crear/editar invitados vía API.
 * Si `openPlanModal` existe, ante límite de plan se abre el modal existente (ObtenerFullAcceso).
 */
export function notifyGuestMutationPlanOrGenericError(
  error: unknown,
  options: {
    t: (key: string) => string;
    toast: ToastFn;
    openPlanModal?: (open: boolean) => void;
  }
): void {
  if (isPlanLimitOrGuestQuotaError(error)) {
    options.openPlanModal?.(true);
    options.toast('error', options.t('planGuestLimitOrQuota'));
    return;
  }
  options.toast('error', `${options.t('Ha ocurrido un error')} ${error}`);
}

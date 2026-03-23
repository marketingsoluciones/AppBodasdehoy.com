/**
 * Traduce SKUs técnicos y cuotas numéricas a lenguaje humano.
 * Ejemplo: ai-tokens 50000 → "~100 consultas IA"
 */

const UNLIMITED_THRESHOLD = 999_999;
const TOKENS_PER_QUERY = 500;
const GB_PER_PHOTO = 0.002;

// ========================================
// SKU → nombre legible
// ========================================

const SKU_LABELS: Record<string, string> = {
  'ai-tokens': 'Consultas IA',
  'image-gen': 'Imágenes IA',
  'storage-gb': 'Almacenamiento',
  'whatsapp-msg': 'Mensajes WhatsApp',
  'memories-albums': 'Álbumes',
  'memories-photos': 'Fotos',
  'events-count': 'Eventos',
  'guests-per-event': 'Invitados por evento',
  'email-campaigns': 'Emails',
  'sms-invitations': 'SMS',
};

// ========================================
// SKU → unidad (singular / plural)
// ========================================

const SKU_UNITS: Record<string, [string, string]> = {
  'ai-tokens': ['consulta IA', 'consultas IA'],
  'image-gen': ['imagen IA', 'imágenes IA'],
  'storage-gb': ['GB', 'GB'],
  'whatsapp-msg': ['mensaje', 'mensajes'],
  'memories-albums': ['álbum', 'álbumes'],
  'memories-photos': ['foto', 'fotos'],
  'events-count': ['evento', 'eventos'],
  'guests-per-event': ['invitado', 'invitados'],
  'email-campaigns': ['email', 'emails'],
  'sms-invitations': ['SMS', 'SMS'],
};

/**
 * Obtiene el nombre legible de un SKU.
 */
export function humanizeSku(sku: string): string {
  return SKU_LABELS[sku] ?? sku;
}

/**
 * Convierte una cuota numérica a unidades humanas.
 * @example humanizeQuota('ai-tokens', 50000) → "~100 consultas IA"
 * @example humanizeQuota('storage-gb', 1) → "1 GB"
 * @example humanizeQuota('memories-photos', 999999) → "Ilimitado"
 */
export function humanizeQuota(sku: string, quota: number): string {
  if (quota >= UNLIMITED_THRESHOLD) return 'Ilimitado';
  if (quota === 0) return 'No incluido';

  const units = SKU_UNITS[sku];
  if (!units) return `${quota}`;

  // ai-tokens se convierten a consultas (~500 tokens/consulta)
  if (sku === 'ai-tokens') {
    const queries = Math.round(quota / TOKENS_PER_QUERY);
    return `~${queries.toLocaleString('es-ES')} ${queries === 1 ? units[0] : units[1]}`;
  }

  // storage-gb se puede mostrar como fotos equivalentes si es útil
  const unit = quota === 1 ? units[0] : units[1];
  return `${quota.toLocaleString('es-ES')} ${unit}`;
}

/**
 * Convierte una cuota a su valor numérico en unidades humanas.
 * Para ai-tokens retorna el número de consultas equivalentes.
 */
export function humanizeQuotaValue(sku: string, quota: number): number {
  if (quota >= UNLIMITED_THRESHOLD) return Infinity;
  if (sku === 'ai-tokens') return Math.round(quota / TOKENS_PER_QUERY);
  return quota;
}

/**
 * Genera texto de uso: "42/50 fotos" o "78% usado"
 */
export function humanizeUsage(sku: string, used: number, limit: number): string {
  if (limit >= UNLIMITED_THRESHOLD) {
    const units = SKU_UNITS[sku];
    const displayUsed = sku === 'ai-tokens' ? Math.round(used / TOKENS_PER_QUERY) : used;
    const unit = units ? (displayUsed === 1 ? units[0] : units[1]) : '';
    return `${displayUsed.toLocaleString('es-ES')} ${unit}`.trim();
  }

  const displayUsed = sku === 'ai-tokens' ? Math.round(used / TOKENS_PER_QUERY) : used;
  const displayLimit = sku === 'ai-tokens' ? Math.round(limit / TOKENS_PER_QUERY) : limit;
  const units = SKU_UNITS[sku];
  const unit = units ? (displayLimit === 1 ? units[0] : units[1]) : '';

  return `${displayUsed.toLocaleString('es-ES')}/${displayLimit.toLocaleString('es-ES')} ${unit}`.trim();
}

/**
 * Calcula el porcentaje de uso.
 */
export function usagePercent(used: number, limit: number): number {
  if (limit >= UNLIMITED_THRESHOLD || limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Color del progreso según porcentaje: verde → amarillo → rojo.
 */
export function usageColor(percent: number): string {
  if (percent >= 100) return '#ef4444'; // red-500
  if (percent >= 80) return '#f59e0b';  // amber-500
  if (percent >= 50) return '#eab308';  // yellow-500
  return '#22c55e';                      // green-500
}

/**
 * Convierte storage en GB a fotos equivalentes (~2MB/foto).
 */
export function gbToPhotos(gb: number): number {
  return Math.round(gb / GB_PER_PHOTO);
}

/**
 * Token count a consultas equivalentes.
 */
export function tokensToQueries(tokens: number): number {
  return Math.round(tokens / TOKENS_PER_QUERY);
}

/**
 * Traduce SKUs técnicos y cuotas numéricas a lenguaje humano.
 * Ejemplo: ai-tokens 50000 → "~100 consultas IA"
 */

const UNLIMITED_THRESHOLD = 999_999;
const AI_UNLIMITED_THRESHOLD = 999_999_999;
const TOKENS_PER_QUERY = 500;
const GB_PER_PHOTO = 0.002;

// ========================================
// Formateadores numéricos es-ES robustos
// No dependen de Node Intl/ICU completo.
// Separador de miles: "."  |  Separador decimal: ","
// ========================================

/**
 * Añade separadores de miles (punto) a un string de dígitos enteros POSITIVOS.
 * Iteramos left-to-right y ponemos un punto cada vez que quedan múltiplos de 3 dígitos por delante.
 */
function addThousandsDot(intStr: string): string {
  if (intStr === '' || intStr === '-') return intStr;
  const negative = intStr.startsWith('-');
  const abs = negative ? intStr.slice(1) : intStr;
  let out = '';
  for (let i = 0; i < abs.length; i++) {
    out += abs[i];
    const remaining = abs.length - 1 - i;
    if (remaining > 0 && remaining % 3 === 0) out += '.';
  }
  return negative ? '-' + out : out;
}

/**
 * Entero con separador de miles es-ES.
 * @example formatEsInteger(10000) → "10.000"
 * @example formatEsInteger(42) → "42"
 */
export function formatEsInteger(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return addThousandsDot(String(Math.trunc(n)));
}

/**
 * Decimal con separador de miles es-ES + coma decimal.
 * @example formatEsDecimal(9, 2) → "9,00"
 * @example formatEsDecimal(1234.56, 2) → "1.234,56"
 * @example formatEsDecimal(0.5, 2) → "0,50"
 */
export function formatEsDecimal(n: number, decimals = 2): string {
  if (!Number.isFinite(n)) return String(n);
  const negative = n < 0;
  const factor = 10 ** decimals;
  const scaled = Math.round(Math.abs(n) * factor);
  const raw = String(scaled).padStart(decimals + 1, '0');
  const intPartRaw = decimals === 0 ? raw : raw.slice(0, raw.length - decimals);
  const fracPartRaw = decimals === 0 ? '' : raw.slice(raw.length - decimals);
  const intPart = addThousandsDot(intPartRaw);
  const fracPart = fracPartRaw ? ',' + fracPartRaw : '';
  return (negative ? '-' : '') + intPart + fracPart;
}

/**
 * Devuelve true si la cuota de un SKU debe tratarse como ilimitada.
 * ai-tokens usa un threshold más alto para distinguir planes grandes (2M, 10M) de ilimitado (999M).
 */
export function isUnlimited(sku: string, quota: number): boolean {
  if (sku === 'ai-tokens') return quota >= AI_UNLIMITED_THRESHOLD;
  return quota >= UNLIMITED_THRESHOLD;
}

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
  if (isUnlimited(sku, quota)) return 'Ilimitado';
  if (quota === 0) return 'No incluido';

  const units = SKU_UNITS[sku];
  if (!units) return `${quota}`;

  if (sku === 'ai-tokens') {
    const queries = Math.round(quota / TOKENS_PER_QUERY);
    return `~${formatEsInteger(queries)} ${queries === 1 ? units[0] : units[1]}`;
  }

  const unit = quota === 1 ? units[0] : units[1];
  return `${formatEsInteger(quota)} ${unit}`;
}

/**
 * Convierte una cuota a su valor numérico en unidades humanas.
 * Para ai-tokens retorna el número de consultas equivalentes.
 */
export function humanizeQuotaValue(sku: string, quota: number): number {
  if (isUnlimited(sku, quota)) return Infinity;
  if (sku === 'ai-tokens') return Math.round(quota / TOKENS_PER_QUERY);
  return quota;
}

/**
 * Genera texto de uso: "42/50 fotos" o "78% usado"
 */
export function humanizeUsage(sku: string, used: number, limit: number): string {
  if (isUnlimited(sku, limit)) {
    const units = SKU_UNITS[sku];
    const displayUsed = sku === 'ai-tokens' ? Math.round(used / TOKENS_PER_QUERY) : used;
    const unit = units ? (displayUsed === 1 ? units[0] : units[1]) : '';
    return `${formatEsInteger(displayUsed)} ${unit}`.trim();
  }

  const displayUsed = sku === 'ai-tokens' ? Math.round(used / TOKENS_PER_QUERY) : used;
  const displayLimit = sku === 'ai-tokens' ? Math.round(limit / TOKENS_PER_QUERY) : limit;
  const units = SKU_UNITS[sku];
  const unit = units ? (displayLimit === 1 ? units[0] : units[1]) : '';

  return `${formatEsInteger(displayUsed)}/${formatEsInteger(displayLimit)} ${unit}`.trim();
}

/**
 * Calcula el porcentaje de uso.
 */
export function usagePercent(used: number, limit: number, sku = ''): number {
  if (isUnlimited(sku, limit) || limit <= 0) return 0;
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

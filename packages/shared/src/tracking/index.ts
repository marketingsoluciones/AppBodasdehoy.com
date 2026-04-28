/**
 * @bodasdehoy/shared — Tracking & Attribution
 *
 * Módulo transversal para todas las apps del monorepo.
 * Captura UTMs, referrals y emite eventos de conversión a GTM/Meta/PostHog.
 *
 * Uso:
 *   import { captureTrackingParams, registerReferralIfPending, trackEvent } from '@bodasdehoy/shared';
 *
 * En el layout raíz (useEffect, solo cliente):
 *   captureTrackingParams();
 *
 * Tras login exitoso:
 *   await registerReferralIfPending(jwtToken, development);
 */

const DEFAULT_API2_URL = 'https://api3-mcp-graphql.eventosorganizador.com/graphql';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  ref?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  ttclid?: string;
  referrer?: string;
  landing_page?: string;
  timestamp: number;
}

export interface TrackEventProperties {
  [key: string]: unknown;
}

declare global {
  interface Window {
    dataLayer?: object[];
    fbq?: (...args: unknown[]) => void;
    posthog?: { capture: (event: string, properties?: object) => void };
  }
}

// ─── Captura de parámetros al aterrizar ──────────────────────────────────────

/**
 * Captura UTMs, ?ref= y referrer al aterrizar en cualquier página.
 * Guarda first_touch (permanente) y last_touch (actualizable) en localStorage.
 * Debe llamarse en el layout raíz del cliente (useEffect de mount).
 */
export function captureTrackingParams(): void {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);

  // Capturar ?ref= para el sistema de afiliados (no sobreescribir si ya hay uno)
  const ref = params.get('ref');
  if (ref && !localStorage.getItem('pending_referral_code')) {
    localStorage.setItem('pending_referral_code', ref.toUpperCase());
  }

  const hasTrackingParams =
    params.get('utm_source') || params.get('gclid') || params.get('fbclid') ||
    params.get('msclkid') || params.get('ttclid') || params.get('twclid') ||
    params.get('li_fat_id') || params.get('ref');

  if (!hasTrackingParams && !document.referrer) return;

  // Normalizar referrer orgánico cuando no hay UTMs
  let referrerSource = '';
  if (!params.get('utm_source') && document.referrer) {
    try {
      const host = new URL(document.referrer).hostname;
      if (host.includes('google')) referrerSource = 'google';
      else if (host.includes('bing')) referrerSource = 'bing';
      else if (host.includes('facebook') || host.includes('fb.com')) referrerSource = 'facebook';
      else if (host.includes('instagram')) referrerSource = 'instagram';
      else if (host.includes('linkedin')) referrerSource = 'linkedin';
      else if (host.includes('youtube')) referrerSource = 'youtube';
      else if (host.includes('tiktok')) referrerSource = 'tiktok';
      else if (host.includes('twitter') || host.includes('t.co')) referrerSource = 'twitter';
      else referrerSource = host;
    } catch {
      // referrer inválido — ignorar
    }
  }

  const attribution: Attribution = {
    utm_source:   params.get('utm_source') || referrerSource || undefined,
    utm_medium:   params.get('utm_medium') || (document.referrer ? 'organic' : 'direct') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content:  params.get('utm_content') || undefined,
    utm_term:     params.get('utm_term') || undefined,
    ref:          ref || undefined,
    gclid:        params.get('gclid') || undefined,
    fbclid:       params.get('fbclid') || undefined,
    msclkid:      params.get('msclkid') || undefined,
    ttclid:       params.get('ttclid') || undefined,
    referrer:     document.referrer || undefined,
    landing_page: window.location.pathname + window.location.search,
    timestamp:    Date.now(),
  };

  // First touch: NUNCA se sobreescribe
  if (!localStorage.getItem('attribution_first_touch')) {
    localStorage.setItem('attribution_first_touch', JSON.stringify(attribution));
  }

  // Last touch: siempre actualiza con la última visita con parámetros
  localStorage.setItem('attribution_last_touch', JSON.stringify(attribution));
  sessionStorage.setItem('current_session_utm', JSON.stringify(attribution));
}

export function getAttributionData(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('attribution_last_touch');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getFirstTouchData(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('attribution_first_touch');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Registro del código de referido en api2 ─────────────────────────────────

/**
 * Si existe un pending_referral_code en localStorage, lo registra en api2
 * llamando a setMyReferralCode. Debe llamarse justo después del login exitoso.
 *
 * @param jwtToken  JWT del usuario autenticado
 * @param development  Tenant ID (ej: 'bodasdehoy', 'memories', 'champagneevents')
 * @param api2Url   URL del endpoint GraphQL de api2 (por defecto producción)
 */
export async function registerReferralIfPending(
  jwtToken: string,
  development: string,
  api2Url = DEFAULT_API2_URL,
): Promise<void> {
  if (typeof window === 'undefined') return;
  const code = localStorage.getItem('pending_referral_code');
  if (!code) return;

  try {
    const response = await fetch(api2Url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
        'X-Development': development,
      },
      body: JSON.stringify({
        query: `mutation SetMyReferralCode($code: String!) {
          setMyReferralCode(code: $code) { success message }
        }`,
        variables: { code },
      }),
    });

    if (response.ok) {
      const json = await response.json();
      if (json.data?.setMyReferralCode?.success) {
        localStorage.removeItem('pending_referral_code');
      }
    }
  } catch {
    // Non-fatal — no bloquear el flujo de login
  }
}

// ─── Envío de atribución a api2 ──────────────────────────────────────────────

/**
 * Envía first_touch y last_touch a api2 para persistirlos en el perfil del usuario.
 * first_touch se guarda solo si no existe ya en la DB.
 * Llamar tras login exitoso, después de registerReferralIfPending.
 */
export async function sendAttributionToApi(
  jwtToken: string,
  development: string,
  api2Url = DEFAULT_API2_URL,
): Promise<void> {
  if (typeof window === 'undefined') return;

  const firstTouch = getFirstTouchData();
  const lastTouch = getAttributionData();
  if (!firstTouch && !lastTouch) return;

  try {
    await fetch(api2Url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
        'X-Development': development,
      },
      body: JSON.stringify({
        query: `mutation UpdateMyAttribution($first_touch: AttributionInput, $last_touch: AttributionInput) {
          updateMyAttribution(first_touch: $first_touch, last_touch: $last_touch)
        }`,
        variables: { first_touch: firstTouch, last_touch: lastTouch },
      }),
    });
  } catch {
    // Non-fatal
  }
}

// ─── Eventos de conversión ────────────────────────────────────────────────────

const META_EVENT_MAP: Record<string, string> = {
  registration_complete: 'CompleteRegistration',
  subscription_started: 'InitiateCheckout',
  subscription_complete: 'Purchase',
  plan_view: 'ViewContent',
  lead: 'Lead',
};

/**
 * Emite un evento a GTM dataLayer, Meta Pixel y PostHog simultáneamente.
 * Enriquece automáticamente con los datos de atribución (last_touch).
 */
export function trackEvent(eventName: string, properties: TrackEventProperties = {}): void {
  if (typeof window === 'undefined') return;

  const attribution = getAttributionData();
  const enriched = { ...properties, ...attribution };

  // GTM / GA4 via dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...enriched });

  // Meta Pixel
  if (window.fbq) {
    const metaEvent = META_EVENT_MAP[eventName];
    if (metaEvent) {
      window.fbq('track', metaEvent, properties);
    } else {
      window.fbq('trackCustom', eventName, enriched);
    }
  }

  // PostHog
  if (window.posthog) {
    window.posthog.capture(eventName, enriched);
  }
}

// ─── Helpers tipados por evento ───────────────────────────────────────────────

export function trackRegistrationComplete(
  method: 'google' | 'facebook' | 'email',
  development: string,
): void {
  trackEvent('registration_complete', { method, development });
}

export function trackSubscriptionStarted(
  planId: string,
  amount: number,
  currency = 'EUR',
): void {
  trackEvent('subscription_started', { plan_id: planId, value: amount, currency });
}

export function trackSubscriptionComplete(
  planId: string,
  amount: number,
  currency = 'EUR',
): void {
  trackEvent('subscription_complete', { plan_id: planId, value: amount, currency });
}

export function trackPlanView(planId: string): void {
  trackEvent('plan_view', { plan_id: planId });
}

export function trackReferralLinkShared(
  channel: 'whatsapp' | 'email' | 'copy' | 'facebook' | 'linkedin',
): void {
  trackEvent('referral_link_shared', { channel });
}

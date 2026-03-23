/**
 * Constantes de branding (alineadas con packages/const para rutas @/const/*)
 * Personalizar con variables NEXT_PUBLIC_* en el despliegue.
 */

const DEFAULT_APP_NAME = 'Bodas de Hoy';

export const BRANDING_NAME = process.env.NEXT_PUBLIC_BRANDING_NAME || DEFAULT_APP_NAME;

export const BRANDING_LOGO_URL =
  process.env.NEXT_PUBLIC_BRANDING_LOGO_URL || '/logo.png';

export const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME || DEFAULT_APP_NAME;

export const LOBE_CHAT_CLOUD =
  process.env.NEXT_PUBLIC_BRANDING_CLOUD_NAME || `${BRANDING_NAME} Cloud`;

export const OFFICIAL_SITE =
  process.env.NEXT_PUBLIC_OFFICIAL_SITE || 'https://bodasdehoy.com';

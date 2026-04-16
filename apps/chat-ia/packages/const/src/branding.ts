// Marca por defecto del producto (Eventos / Bodas de Hoy).
// Personalizar con NEXT_PUBLIC_BRANDING_NAME / NEXT_PUBLIC_ORG_NAME en despliegues.

const DEFAULT_APP_NAME = 'Bodas de Hoy';

export const BRANDING_NAME = process.env.NEXT_PUBLIC_BRANDING_NAME || DEFAULT_APP_NAME;

/** Nombre del servicio cloud en pantallas de sincronización / avisos */
export const LOBE_CHAT_CLOUD =
  process.env.NEXT_PUBLIC_BRANDING_CLOUD_NAME || `${BRANDING_NAME} Cloud`;

export const BRANDING_LOGO_URL = process.env.NEXT_PUBLIC_BRANDING_LOGO_URL || '';

export const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME || DEFAULT_APP_NAME;

export const BRANDING_URL = {
  help: process.env.NEXT_PUBLIC_BRANDING_HELP_URL || undefined,
  privacy: process.env.NEXT_PUBLIC_BRANDING_PRIVACY_URL || undefined,
  terms: process.env.NEXT_PUBLIC_BRANDING_TERMS_URL || undefined,
};

export const SOCIAL_URL = {
  discord: process.env.NEXT_PUBLIC_SOCIAL_DISCORD_URL || 'https://discord.gg/AYFPHvv2jT',
  github: process.env.NEXT_PUBLIC_SOCIAL_GITHUB_URL || 'https://github.com/marketingsoluciones',
  medium: process.env.NEXT_PUBLIC_SOCIAL_MEDIUM_URL || 'https://bodasdehoy.com',
  x: process.env.NEXT_PUBLIC_SOCIAL_X_URL || 'https://x.com/bodasdehoy',
  youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE_URL || 'https://www.youtube.com/@bodasdehoy',
};

export const BRANDING_EMAIL = {
  business: process.env.NEXT_PUBLIC_BRANDING_EMAIL_BUSINESS || 'hola@bodasdehoy.com',
  support: process.env.NEXT_PUBLIC_BRANDING_EMAIL_SUPPORT || 'soporte@bodasdehoy.com',
};

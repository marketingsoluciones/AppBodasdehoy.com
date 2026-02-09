// the code below can only be modified with commercial license
// if you want to use it in the commercial usage
// please contact us for more information: hello@lobehub.com

// BodasdeHoy custom branding - usando variables de entorno
export const LOBE_CHAT_CLOUD = process.env.NEXT_PUBLIC_BRANDING_NAME || 'LobeHub Cloud';

export const BRANDING_NAME = process.env.NEXT_PUBLIC_BRANDING_NAME || 'LobeHub';
export const BRANDING_LOGO_URL = process.env.NEXT_PUBLIC_BRANDING_LOGO_URL || '';

export const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME || 'LobeHub';

export const BRANDING_URL = {
  help: undefined,
  privacy: undefined,
  terms: undefined,
};

export const SOCIAL_URL = {
  discord: 'https://discord.gg/AYFPHvv2jT',
  github: 'https://github.com/lobehub',
  medium: 'https://medium.com/@lobehub',
  x: 'https://x.com/lobehub',
  youtube: 'https://www.youtube.com/@lobehub',
};

export const BRANDING_EMAIL = {
  business: 'hello@lobehub.com',
  support: 'support@lobehub.com',
};

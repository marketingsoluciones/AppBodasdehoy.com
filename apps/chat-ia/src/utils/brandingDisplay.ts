import { BRANDING_NAME } from '@lobechat/const';

import { getDeveloperDisplayName } from '@/utils/developmentDetector';

/** Nombres genéricos del upstream que no deben mostrarse en whitelabel. */
const UPSTREAM_GENERIC_NAMES = /^(lobehub|lobe\s*chat|lobehub\s*cloud)$/i;

/**
 * Título de marca para UI: si el API devuelve el nombre upstream, usa el developer conocido o BRANDING_NAME.
 */
export function resolveDisplayBrandName(
  apiName: string | undefined,
  developerSlug: string,
): string {
  const raw = (apiName || '').trim();
  if (raw && !UPSTREAM_GENERIC_NAMES.test(raw)) {
    return raw;
  }
  return getDeveloperDisplayName(developerSlug) || BRANDING_NAME;
}

import pkg from '@/../package.json';

import { BRANDING_NAME, ORG_NAME } from './branding';

export const CURRENT_VERSION = pkg.version;

export const isServerMode = process.env.NEXT_PUBLIC_SERVICE_MODE === 'server';
export const isUsePgliteDB = process.env.NEXT_PUBLIC_CLIENT_DB === 'pglite';

export const isDesktop = process.env.NEXT_PUBLIC_IS_DESKTOP_APP === '1';

export const isDeprecatedEdition = !isServerMode && !isUsePgliteDB;

/** Upstream sin personalizar; cualquier otro valor (p. ej. Bodas de Hoy) activa white-label. */
const UPSTREAM_DEFAULT_BRAND = 'LobeHub';

// @ts-ignore
export const isCustomBranding = BRANDING_NAME !== UPSTREAM_DEFAULT_BRAND;
// @ts-ignore
export const isCustomORG = ORG_NAME !== UPSTREAM_DEFAULT_BRAND;

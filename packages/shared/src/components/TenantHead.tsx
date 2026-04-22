/**
 * TenantHead — componente compartido que renderiza <title>, meta description,
 * favicon y CSS variables del tema para cualquier tenant.
 *
 * Presentacional puro: recibe TenantBranding por props.
 * Usa next/head si está disponible (Pages Router), o tags directos (App Router).
 */

import React from 'react';

import type { TenantBranding } from '../branding/useTenantBranding';

export interface TenantHeadProps {
  /** Branding resuelto del tenant */
  branding: TenantBranding;
  /** Override para meta description (por defecto usa branding.name) */
  description?: string;
  /** Meta tags o links adicionales */
  children?: React.ReactNode;
}

/**
 * Genera el string de CSS variables del tema.
 * Puede usarse en un `<style>` tag o como valor de dangerouslySetInnerHTML.
 */
export function tenantCSSVariables(branding: TenantBranding): string {
  return `:root {
  --color-primary: ${branding.primaryColor};
  --color-secondary: ${branding.secondaryColor};
  --color-tertiary: ${branding.tertiaryColor || branding.primaryColor};
  --color-base: ${branding.baseColor};
  --color-scroll: ${branding.colorScroll || branding.primaryColor};
}`;
}

/**
 * Componente que renderiza los tags de <head> del tenant.
 * Compatible con Pages Router (next/head) — el consumidor debe envolverlo en <Head>.
 */
export function TenantHead({ branding, description, children }: TenantHeadProps) {
  return (
    <>
      {branding.favicon && <link id="favicon" rel="icon" href={branding.favicon} />}
      <title>{branding.name}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <meta name="description" content={description || branding.name} />
      {children}
    </>
  );
}

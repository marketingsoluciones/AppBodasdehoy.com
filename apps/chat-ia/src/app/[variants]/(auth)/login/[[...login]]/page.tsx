// ─── Server Component: SSO02 redirect + login page ───────────────────────────
// Al ser Server Component, lee cookies del request HTTP ANTES de que React hidrate.
// Si hay idTokenV0.1.0 → redirigir a /api/auth/sso-auto (autenticación automática).
// Si no → renderizar el formulario de login (cliente).

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import LoginPageClient from './_page-client';

interface Props {
  searchParams: Promise<{ developer?: string, redirect?: string; }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  const ssoToken = cookieStore.get('idTokenV0.1.0');

  if (ssoToken?.value) {
    // Construir URL de sso-auto preservando parámetros de la query
    const sp = await searchParams;
    const params = new URLSearchParams();
    if (sp.redirect) params.set('redirect', sp.redirect);
    if (sp.developer) params.set('developer', sp.developer);
    const qs = params.toString();
    redirect(`/api/auth/sso-auto${qs ? `?${qs}` : ''}`);
  }

  return <LoginPageClient />;
}

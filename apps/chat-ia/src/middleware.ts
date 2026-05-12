/* eslint-disable import/first */
import { parseDefaultThemeFromCountry } from '@lobechat/utils/server';
import debug from 'debug';
import { NextRequest, NextResponse } from 'next/server';
import urlJoin from 'url-join';

import { OAUTH_AUTHORIZED } from '@/const/auth';
import { LOBE_LOCALE_COOKIE } from '@/const/locale';
import { LOBE_THEME_APPEARANCE } from '@/const/theme';
import { appEnv } from '@/envs/app';
import { authEnv } from '@/envs/auth';
import { Locales } from '@/locales/resources';

import { oidcEnv } from './envs/oidc';
import { parseBrowserLanguage } from './utils/locale';
import { RouteVariants } from './utils/server/routeVariants';

// Clerk imports - only load if Clerk auth is enabled
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clerkMiddleware: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createRouteMatcher: any;

// Lazy load Clerk only when needed
const loadClerk = async () => {
  if (!clerkMiddleware) {
    const clerk = await import('@clerk/nextjs/server');
    clerkMiddleware = clerk.clerkMiddleware;
    createRouteMatcher = clerk.createRouteMatcher;
  }
};

// Create debug logger instances
const logDefault = debug('middleware:default');
const logNextAuth = debug('middleware:next-auth');
const logClerk = debug('middleware:clerk');

// OIDC session pre-sync constant
const OIDC_SESSION_HEADER = 'x-oidc-session-sync';

export const config = {
  matcher: [
    // include any files in the api or trpc folders that might have an extension
    '/(api|trpc|webapi)(.*)',
    // include the /
    '/',
    '/discover',
    '/discover(.*)',
    '/chat',
    '/chat(.*)',
    '/changelog(.*)',
    '/settings(.*)',
    '/image',
    '/files',
    '/files(.*)',
    '/knowledge',
    '/knowledge(.*)',
    '/repos(.*)',
    '/profile(.*)',
    '/me',
    '/me(.*)',
    '/wedding-creator',
    '/wedding-creator(.*)',
    '/admin/:path*',
    // Slug de desarrollador (iframe Copilot y Prewarmer usan /bodasdehoy/chat)
    '/bodasdehoy',
    '/bodasdehoy(.*)',
    '/eventosorganizador',
    '/eventosorganizador(.*)',

    '/login(.*)',
    '/signup(.*)',
    '/dev-login(.*)',
    '/next-auth/(.*)',
    '/oauth(.*)',
    '/oidc(.*)',
    '/onboard(.*)', // ✅ Agregado para manejar redirección
    '/tasks',
    '/tasks(.*)',
    '/notifications',
    '/notifications(.*)',
    '/messages',
    '/messages(.*)',
    '/memories',
    '/memories(.*)',
    // ↓ cloud ↓
  ],
};

const backendApiEndpoints = ['/api', '/trpc', '/webapi', '/oidc'];

const DEFAULT_VARIANT_PATH = 'en-US__0__light';

const defaultMiddleware = (request: NextRequest) => {
  const url = new URL(request.url);
  let pathname = url.pathname || '/';
  const originalPathname = pathname;

  if (pathname === '/' || pathname === '') {
    pathname = '/chat';
    url.pathname = '/chat';
    logDefault('Root path: treating as /chat');
  }

  try {
    logDefault('Processing request: %s %s', request.method, request.url);

    // ✅ SSO02: Si el usuario llega a /login con idTokenV0.1.0 de otra app, redirigir al handler SSO
    // para autenticarse automáticamente sin necesidad de React/useEffect/hydration.
    if ((url.pathname === '/login' || url.pathname.startsWith('/login/')) &&
        request.cookies.has('idTokenV0.1.0')) {
      const ssoUrl = new URL('/api/auth/sso-auto', request.url);
      const redirectParam = url.searchParams.get('redirect');
      if (redirectParam) ssoUrl.searchParams.set('redirect', redirectParam);
      const devParam = url.searchParams.get('developer');
      if (devParam) ssoUrl.searchParams.set('developer', devParam);
      logDefault('SSO auto-login: idTokenV0.1.0 presente → redirigiendo a /api/auth/sso-auto');
      return NextResponse.redirect(ssoUrl, { status: 307 });
    }

    // ✅ FIX: Redirigir /onboard a /chat (onboarding deshabilitado)
    if (url.pathname === '/onboard' || url.pathname.startsWith('/onboard/')) {
      logDefault('Redirecting /onboard to /chat');
      const chatUrl = new URL('/chat', request.url);
      // Preservar parámetros de búsqueda
      chatUrl.search = url.search;
      return NextResponse.redirect(chatUrl, { status: 307 });
    }

    // skip all api requests
    if (backendApiEndpoints.some((path) => url.pathname.startsWith(path))) {
      logDefault('Skipping API request: %s', url.pathname);
      return NextResponse.next();
    }

    // ========================================
    // AUTO-DETECT DEVELOPER FROM HOSTNAME
    // ========================================
    const hostname = request.headers.get('host') || '';
    const existingDeveloperParam = url.searchParams.get('developer');

    // Si NO viene el parámetro developer, establecer por defecto según hostname
    if (!existingDeveloperParam) {
      let defaultDeveloper: string | null = null;

      if (hostname.includes('iachat') || hostname.includes('bodasdehoy')) {
        defaultDeveloper = 'bodasdehoy';
      } else if (hostname.includes('eventosorganizador')) {
        defaultDeveloper = 'eventosorganizador';
      }

      if (defaultDeveloper) {
        url.searchParams.set('developer', defaultDeveloper);
        logDefault('Auto-detected developer from hostname %s: %s', hostname, defaultDeveloper);
      }
    } else {
      logDefault('Using explicit developer parameter: %s', existingDeveloperParam);
    }
    // ========================================

    // 1. Read user preferences from cookies
    let theme: string;
    try {
      // Prioridad: cookie > parseDefaultThemeFromCountry > 'light'
      const cookieTheme = request.cookies.get(LOBE_THEME_APPEARANCE)?.value;
      if (cookieTheme && (cookieTheme === 'light' || cookieTheme === 'dark')) {
        theme = cookieTheme;
      } else {
        try {
          theme = parseDefaultThemeFromCountry(request);
        } catch {
          theme = 'light'; // Fallback explícito a 'light'
        }
      }
    } catch (themeError) {
      console.warn('⚠️ Error parsing theme, using default:', themeError);
      theme = 'light'; // ✅ Tema por defecto: 'light'
    }

    // ✅ Asegurar que theme sea válido
    if (theme !== 'light' && theme !== 'dark') {
      theme = 'light';
    }

    // locale has three levels
    // 1. search params
    // 2. cookie
    // 3. browser

    // highest priority is explicitly in search params, like ?hl=zh-CN
    const explicitlyLocale = (url.searchParams.get('hl') || undefined) as Locales | undefined;

    // if it's a new user, there's no cookie, So we need to use the fallback language parsed by accept-language
    let browserLanguage: string;
    try {
      browserLanguage = parseBrowserLanguage(request.headers);
    } catch (langError) {
      console.warn('⚠️ Error parsing browser language, using default:', langError);
      browserLanguage = 'en-US';
    }

    const locale =
      explicitlyLocale ||
      ((request.cookies.get(LOBE_LOCALE_COOKIE)?.value || browserLanguage) as Locales);

    const ua = request.headers.get('user-agent') || '';
    const isMobile = /mobi|android|iphone|ipad/i.test(ua);

    logDefault('User preferences: %O', {
      browserLanguage,
      hasCookies: {
        locale: !!request.cookies.get(LOBE_LOCALE_COOKIE)?.value,
        theme: !!request.cookies.get(LOBE_THEME_APPEARANCE)?.value,
      },
      isMobile,
      locale,
      theme,
    });

    // 2. Create normalized preference values
    let route: string;
    try {
      route = RouteVariants.serializeVariants({
        isMobile,
        locale: locale || 'en-US',
        theme: (theme as any) || 'light',
      });
    } catch (routeError) {
      console.error('❌ Error serializing route variants:', routeError);
      // Fallback a ruta por defecto
      route = RouteVariants.serializeVariants({
        isMobile: false,
        locale: 'en-US',
        theme: 'light',
      });
    }

    logDefault('Serialized route variant: %s', route);

    // Slug desarrollador (ej. /bodasdehoy/chat): reescribir a /{route}/chat (app tiene layout raíz).
    let pathnameForRewrite = url.pathname;
    const developerSlugMatch = url.pathname.match(/^\/(bodasdehoy|eventosorganizador)(\/|$)/);
    if (developerSlugMatch) {
      const slug = developerSlugMatch[1];
      const rest = url.pathname.slice(slug.length + 2);
      pathnameForRewrite = rest ? `/${rest}` : '/';
      logDefault('Developer slug rewrite: %s -> %s', url.pathname, pathnameForRewrite);
    }

    // if app is in docker, rewrite to self container
    if (appEnv.MIDDLEWARE_REWRITE_THROUGH_LOCAL) {
      logDefault('Local container rewrite enabled: %O', {
        host: '127.0.0.1',
        original: url.toString(),
        port: process.env.PORT || '3210',
        protocol: 'http',
      });
      url.protocol = 'http';
      url.host = '127.0.0.1';
      url.port = process.env.PORT || '3210';
    }

    const nextPathname = `/${route}` + (pathnameForRewrite === '/' ? '' : pathnameForRewrite);
    const nextURL = appEnv.MIDDLEWARE_REWRITE_THROUGH_LOCAL
      ? urlJoin(url.origin, nextPathname)
      : nextPathname;

    logDefault('URL rewrite: %O', { nextPathname, nextURL, originalPathname: url.pathname });
    url.pathname = nextPathname;
    return NextResponse.rewrite(url, { status: 200 });
  } catch (error) {
    console.error('❌ Error in defaultMiddleware:', error);
    const bypassPrefixes = ['/api', '/trpc', '/webapi', '/oidc', '/next-auth', '/_next'];
    const shouldBypass = bypassPrefixes.some((p) => originalPathname.startsWith(p));
    if (shouldBypass) return NextResponse.next();

    let pathnameForRewrite = originalPathname || '/';
    const developerSlugMatch = pathnameForRewrite.match(/^\/(bodasdehoy|eventosorganizador)(\/|$)/);
    if (developerSlugMatch) {
      const slug = developerSlugMatch[1];
      const rest = pathnameForRewrite.slice(slug.length + 2);
      pathnameForRewrite = rest ? `/${rest}` : '/';
    }

    const rewriteUrl = new URL(request.url);
    rewriteUrl.pathname = `/${DEFAULT_VARIANT_PATH}` + (pathnameForRewrite === '/' ? '' : pathnameForRewrite);
    logDefault('Fallback rewrite to %s after middleware error', rewriteUrl.pathname);
    return NextResponse.rewrite(rewriteUrl, { status: 200 });
  }
};

// Route patterns for matching
const PUBLIC_ROUTE_PATTERNS = [
  // raíz (redirect a variante en defaultMiddleware)
  '/',
  // backend api
  '/api/auth(.*)',
  '/api/webhooks(.*)',
  '/webapi(.*)',
  '/trpc(.*)',
  // next auth
  '/next-auth/(.*)',
  // clerk
  '/login',
  '/signup',
  // dev login (página de desarrollo)
  '/dev-login(.*)',
  // oauth
  '/oidc/handoff',
  '/oidc/token',
  // ✅ DESPROTEGER: Gestor de archivos (no requiere auth)
  '/files(.*)',
  // ✅ Panel admin (playground, tests, etc.) accesible sin auth para desarrollo
  '/admin(.*)',
];

const PROTECTED_ROUTE_PATTERNS = [
  '/settings(.*)',
  // '/files(.*)',  // ✅ MOVIDO A isPublicRoute - no requiere autenticación
  '/onboard(.*)',
  '/oauth(.*)',
  // ↓ cloud ↓
];

// Simple route matching function (fallback when Clerk is not available)
const simpleRouteMatcher = (patterns: string[]) => {
  const regexes = patterns.map((p) => new RegExp(`^${p}$`));
  return (req: NextRequest) => {
    const pathname = new URL(req.url).pathname;
    return regexes.some((regex) => regex.test(pathname));
  };
};

// Lazy-initialized route matchers
let isPublicRoute: ReturnType<typeof simpleRouteMatcher>;
let isProtectedRoute: ReturnType<typeof simpleRouteMatcher>;

// Default matchers (always available). Clerk can override these with createRouteMatcher.
isPublicRoute = simpleRouteMatcher(PUBLIC_ROUTE_PATTERNS);
isProtectedRoute = simpleRouteMatcher(PROTECTED_ROUTE_PATTERNS);

const initClerkRouteMatchers = async () => {
  await loadClerk();
  if (createRouteMatcher) {
    isPublicRoute = createRouteMatcher(PUBLIC_ROUTE_PATTERNS);
    isProtectedRoute = createRouteMatcher(PROTECTED_ROUTE_PATTERNS);
  }
};

// NextAuth middleware is created lazily to avoid crashing the whole Edge middleware
// when NextAuth/SSO env is misconfigured (common source of global 500s).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _nextAuthMiddleware: any | null = null;

const getNextAuthMiddleware = async () => {
  if (_nextAuthMiddleware) return _nextAuthMiddleware;
  try {
    const nextAuthModule = await import('@/libs/next-auth');
    const NextAuth = nextAuthModule.default as any;

    _nextAuthMiddleware = NextAuth.auth((req: any) => {
      logNextAuth('NextAuth middleware processing request: %s %s', req.method, req.url);

      const pathname = req.nextUrl.pathname || '/';
      if (pathname === '/' || pathname === '') {
        const url = req.nextUrl.clone();
        url.pathname = `/${DEFAULT_VARIANT_PATH}`;
        return NextResponse.redirect(url, 307);
      }

      const response = defaultMiddleware(req);
      if (response.status >= 301 && response.status <= 308) return response;

      // when enable auth protection, only public route is not protected, others are all protected
      const isProtected = appEnv.ENABLE_AUTH_PROTECTION ? !isPublicRoute(req) : isProtectedRoute(req);

      logNextAuth('Route protection status: %s, %s', req.url, isProtected ? 'protected' : 'public');

      // Just check if session exists
      const session = req.auth;

      // Check if next-auth throws errors
      // refs: https://github.com/lobehub/lobe-chat/pull/1323
      const isLoggedIn = !!session?.expires;

      logNextAuth('NextAuth session status: %O', {
        expires: session?.expires,
        isLoggedIn,
        userId: session?.user?.id,
      });

      // Remove & amend OAuth authorized header
      response.headers.delete(OAUTH_AUTHORIZED);
      if (isLoggedIn) {
        logNextAuth('Setting auth header: %s = %s', OAUTH_AUTHORIZED, 'true');
        response.headers.set(OAUTH_AUTHORIZED, 'true');

        // If OIDC is enabled and user is logged in, add OIDC session pre-sync header
        if (oidcEnv.ENABLE_OIDC && session?.user?.id) {
          logNextAuth('OIDC session pre-sync: Setting %s = %s', OIDC_SESSION_HEADER, session.user.id);
          response.headers.set(OIDC_SESSION_HEADER, session.user.id);
        }
      } else {
        // If request a protected route, redirect to sign-in page
        // ref: https://authjs.dev/getting-started/session-management/protecting
        if (isProtected) {
          logNextAuth('Request a protected route, redirecting to sign-in page');
          const nextLoginUrl = new URL('/next-auth/signin', req.nextUrl.origin);
          nextLoginUrl.searchParams.set('callbackUrl', req.nextUrl.href);
          return Response.redirect(nextLoginUrl);
        }
        logNextAuth('Request a free route but not login, allow visit without auth header');
      }

      return response;
    });

    return _nextAuthMiddleware;
  } catch (error) {
    console.error('❌ NextAuth middleware init failed; falling back to default middleware', error);
    _nextAuthMiddleware = null;
    return null;
  }
};

const nextAuthMiddlewareWrapper = async (req: NextRequest) => {
  const middleware = await getNextAuthMiddleware();
  if (!middleware) return defaultMiddleware(req);
  return middleware(req);
};

// Clerk middleware factory - creates the middleware only when needed
let _clerkAuthMiddleware: ReturnType<typeof clerkMiddleware> | null = null;

const getClerkAuthMiddleware = async () => {
  if (!_clerkAuthMiddleware) {
    await loadClerk();
    await initClerkRouteMatchers();
    _clerkAuthMiddleware = clerkMiddleware(
      async (auth: any, req: any) => {
        logClerk('Clerk middleware processing request: %s %s', req.method, req.url);

        const pathname = req.nextUrl?.pathname || req.url ? new URL(req.url).pathname : '/';
        if (pathname === '/' || pathname === '') {
          const url = req.nextUrl ? req.nextUrl.clone() : new URL(req.url);
          url.pathname = `/${DEFAULT_VARIANT_PATH}`;
          return NextResponse.redirect(url, 307);
        }

        const response = defaultMiddleware(req);
        if (response.status >= 301 && response.status <= 308) return response;

        // when enable auth protection, only public route is not protected, others are all protected
        const isProtected = appEnv.ENABLE_AUTH_PROTECTION ? !isPublicRoute(req) : isProtectedRoute(req);

        logClerk('Route protection status: %s, %s', req.url, isProtected ? 'protected' : 'public');

        if (isProtected) {
          logClerk('Protecting route: %s', req.url);
          await auth.protect();
        }

        const data = await auth();
        logClerk('Clerk auth status: %O', {
          isSignedIn: !!data.userId,
          userId: data.userId,
        });

        // If OIDC is enabled and Clerk user is logged in, add OIDC session pre-sync header
        if (oidcEnv.ENABLE_OIDC && data.userId) {
          logClerk('OIDC session pre-sync: Setting %s = %s', OIDC_SESSION_HEADER, data.userId);
          response.headers.set(OIDC_SESSION_HEADER, data.userId);
        } else if (oidcEnv.ENABLE_OIDC) {
          logClerk('No Clerk user detected, not setting OIDC session sync header');
        }

        return response;
      },
      {
        // https://github.com/lobehub/lobe-chat/pull/3084
        clockSkewInMs: 60 * 60 * 1000,
        signInUrl: '/login',
        signUpUrl: '/signup',
      },
    );
  }
  return _clerkAuthMiddleware;
};

// Wrapper for Clerk middleware that handles lazy initialization
const clerkAuthMiddlewareWrapper = async (req: NextRequest) => {
  const middleware = await getClerkAuthMiddleware();
  return middleware(req, {} as any);
};

logDefault('Middleware configuration: %O', {
  enableAuthProtection: appEnv.ENABLE_AUTH_PROTECTION,
  enableClerk: authEnv.NEXT_PUBLIC_ENABLE_CLERK_AUTH,
  enableNextAuth: authEnv.NEXT_PUBLIC_ENABLE_NEXT_AUTH,
  enableOIDC: oidcEnv.ENABLE_OIDC,
});

export default authEnv.NEXT_PUBLIC_ENABLE_CLERK_AUTH
  ? clerkAuthMiddlewareWrapper
  : authEnv.NEXT_PUBLIC_ENABLE_NEXT_AUTH
    ? nextAuthMiddlewareWrapper
    : defaultMiddleware;

/** @type {import('next').NextConfig} */
const path = require('path');
// QA 30-jun: inyectar commit SHA en NEXT_PUBLIC_COMMIT_SHA para que el
// footer de debug pueda mostrarlo sin depender de ninguna env var manual.
const { execSync } = require('child_process');
try {
  if (!process.env.NEXT_PUBLIC_COMMIT_SHA) {
    process.env.NEXT_PUBLIC_COMMIT_SHA = execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  }
} catch (_) { /* falla silente si no hay git */ }
const nextConfig = {
  // Habilitar React Strict Mode para mejor desarrollo
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_COMMIT_SHA: process.env.NEXT_PUBLIC_COMMIT_SHA || 'unknown',
  },

  // Ignorar errores de ESLint durante el build (son solo warnings)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Deshabilitar indicadores de desarrollo que causan errores en Next.js 15
  devIndicators: false,

  // ⚡ FASE 4 PR-4.2 (2026-05-13): packages compartidos eliminados de transpilePackages
  // tras migrar a dist build (FASE 3). Next los carga pre-compilados → ahorra recompile.
  // SOLO quedan los packages externos que aún requieren transpile.
  transpilePackages: ['@lobehub/ui', '@lobehub/editor', 'react-layout-kit', 'zustand-utils'],

  // Antipatrón 6 (auditoría 20-jun): 109 archivos tenían console.log heredados de debug.
  // El SWC compiler de Next 15 los elimina del bundle de producción —
  // mantenemos `error` y `warn` para que sigan llegando a Sentry y a logs operativos
  // (especialmente útil ahora que erradicamos los .catch silentes en commit 70ac0402).
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Redirects para URLs con caracteres especiales → ASCII equivalente
  async redirects() {
    return [
      {
        source: '/dise%C3%B1o-espacios',
        destination: '/diseno-espacios',
        permanent: true,
      },
    ];
  },

  // Headers CORS para API routes
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },

  // Configuración de imágenes - Next.js 15 usa remotePatterns en lugar de domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        pathname: '/**',
      },
    ],
  },

  // Configuración experimental para compatibilidad
  // PERF 2026-06-04: optimizePackageImports también en DEV (antes solo prod). Reduce el fan-out
  // de barrels grandes (antd, lucide, @lobehub/ui) en cada compilación on-demand de dev.
  experimental: {
    optimizePackageImports: ['react-icons', 'lucide-react', 'framer-motion', '@lobehub/ui', 'antd', '@ant-design/icons', 'date-fns', 'swiper'],
  },

  // PERF 2026-06-04: NO retener páginas compiladas inactivas en memoria (la Mac de 16GB satura
  // swap al compilar /login = 15922 módulos). Solo afecta a dev.
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : { onDemandEntries: { maxInactiveAge: 25 * 1000, pagesBufferLength: 3 } }),

  // Turbopack: equivalentes de los aliases webpack críticos
  // Evita instancias duplicadas de React (resolveDispatcher is null)
  // y hace funcionar next/navigation en Pages Router
  turbopack: {
    resolveAlias: {
      // next/navigation: compatibilidad con Pages Router (relativo a este next.config.js)
      'next/navigation': './hooks/useCompatRouter.ts',
    },
    // Permitir resolver imports `from "../api"` a `api.ts` (post migración ITEM 8 .js→.ts)
    // Sin esto, Turbopack en Next 15 busca literalmente `.js` y falla si solo existe `.ts`.
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.mts', '.cts', '.mjs', '.cjs', '.json'],
  },

  // Webpack config para resolver módulos ESM de @lobehub/ui
  webpack: (config, { isServer, dev }) => {
    const path = require('path');

    // Resolver extensiones sin .js en ESM
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };

    // IMPORTANTE: Alias para hacer que next/navigation funcione en Pages Router
    // Redirige imports de next/navigation al hook de compatibilidad
    config.resolve.alias = {
      ...config.resolve.alias,
      'next/navigation': path.resolve(__dirname, 'hooks/useCompatRouter.ts'),
      // Forzar instancia única de React — evita "resolveDispatcher() is null"
      // cuando @bodasdehoy/memories tiene su propio node_modules/react (versión distinta)
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    };

    // Suprimir warnings de ESM packages conocidos que funcionan correctamente
    if (!isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        {
          module: /debug\/src\/node\.js/,
          message: /ESM packages \(supports-color\)/,
        },
      ];
    }

    // PERF 2026-06-04: cache filesystem de webpack en DEV → compilaciones posteriores 3-5× más
    // rápidas (no recompila los 15922 módulos desde cero en cada arranque). Replicado de chat-ia.
    if (dev) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.join(__dirname, '.next/cache/webpack'),
        compression: false,
        maxMemoryGenerations: 1,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      };
    }

    return config;
  },

  allowedDevOrigins: [
    'app-dev.bodasdehoy.com',
    'app-test.bodasdehoy.com',
    '127.0.0.1',
    'localhost',
    '192.168.1.48',
  ],

  // Source maps en prod desactivados — Sentry los sube por su cuenta si está configurado.
  productionBrowserSourceMaps: false,

  // Rewrites para el proxy de Lobe-Chat. Usa NEXT_PUBLIC_CHAT del .env (chat-dev en dev, chat en prod).
  async rewrites() {
    const copilotBase = (process.env.NEXT_PUBLIC_CHAT || 'https://chat.bodasdehoy.com').replace(/\/$/, '');
    return [
      {
        source: '/locales/:path*',
        has: [
          { type: 'header', key: 'referer', value: '.*\\/copilot-chat.*' },
        ],
        destination: `${copilotBase}/locales/:path*`,
      },
      {
        source: '/cdn-cgi/:path*',
        has: [
          { type: 'header', key: 'referer', value: '.*\\/copilot-chat.*' },
        ],
        destination: `${copilotBase}/cdn-cgi/:path*`,
      },
      {
        source: '/jwe/:path*',
        has: [
          { type: 'header', key: 'referer', value: '.*\\/copilot-chat.*' },
        ],
        destination: `${copilotBase}/jwe/:path*`,
      },
      {
        source: '/trpc/:path*',
        has: [
          { type: 'header', key: 'referer', value: '.*\\/copilot-chat.*' },
        ],
        destination: `${copilotBase}/trpc/:path*`,
      },
      {
        source: '/socket.io/:path*',
        has: [
          { type: 'header', key: 'referer', value: '.*\\/copilot-chat.*' },
        ],
        destination: `${copilotBase}/socket.io/:path*`,
      },
      {
        source: '/api/graphql',
        has: [
          { type: 'header', key: 'referer', value: '.*\\/copilot-chat.*' },
        ],
        destination: `${copilotBase}/api/graphql`,
      },
      {
        source: '/_next/:path*',
        has: [
          { type: 'header', key: 'referer', value: '.*\\/copilot-chat.*' },
        ],
        destination: `${copilotBase}/_next/:path*`,
      },
      {
        source: '/favicon.ico',
        has: [
          { type: 'header', key: 'referer', value: '.*\\/copilot-chat.*' },
        ],
        destination: `${copilotBase}/favicon.ico`,
      },
      {
        source: '/copilot-chat/:path*',
        destination: `${copilotBase}/:path*`,
      },
      // NOTA: Los proxies de API ahora se manejan con API routes en /pages/api/
      // en lugar de rewrites, para evitar problemas de CORS que ocurrían porque
      // los rewrites mantienen los headers originales (incluido Origin).
      // Ver: /pages/api/proxy/graphql.ts y /pages/api/proxy-bodas/graphql.ts
    ];
  },
};

// Sentry — solo activo cuando NEXT_PUBLIC_SENTRY_DSN está definido.
// En dev se deshabilita el webpack plugin para evitar overhead de compilación.
const { withSentryConfig } = require('@sentry/nextjs');
const isProdBuild = process.env.NODE_ENV === 'production';

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: 'itel-0n',
      project: 'app-eventos',
      widenClientFileUpload: true,
      hideSourceMaps: true,
      webpack: { treeshake: { removeDebugLogging: true } },
      disableClientWebpackPlugin: !isProdBuild,
      disableServerWebpackPlugin: !isProdBuild,
    })
  : nextConfig;

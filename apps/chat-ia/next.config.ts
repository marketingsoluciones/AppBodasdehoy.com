import analyzer from '@next/bundle-analyzer';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';
import ReactComponentName from 'react-scan/react-component-name/webpack';

const isProd = process.env.NODE_ENV === 'production';
const buildWithDocker = process.env.DOCKER === 'true';
const isDesktop = process.env.NEXT_PUBLIC_IS_DESKTOP_APP === '1';
const enableReactScan = !!process.env.REACT_SCAN_MONITOR_API_KEY;
const isUsePglite = process.env.NEXT_PUBLIC_CLIENT_DB === 'pglite';
const shouldUseCSP = process.env.ENABLED_CSP === '1';

// if you need to proxy the api endpoint to remote server

const isStandaloneMode = buildWithDocker || isDesktop;

const standaloneConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '*': [
      'public/**/*',
      '.next/static/**/*',
      'locales/**/*.json'  // ✅ Incluir archivos de traducción en el build
    ]
  },
};

const nextConfig: NextConfig = {
  ...(isStandaloneMode ? standaloneConfig : {}),
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
  // ⚡ PERF 2026-06-03: en dev, NO retener páginas compiladas inactivas en memoria.
  // En esta Mac (16GB, swap saturado) cada página retenida del árbol de 40k módulos
  // come RAM y empuja a swap → recompilación lenta por I/O. Liberar rápido las inactivas
  // mantiene a Node dentro de RAM física. Solo afecta a dev (en prod se ignora).
  ...(isProd
    ? {}
    : {
        onDemandEntries: {
          // Cuánto tiempo mantener una página en memoria sin visitarla (ms).
          maxInactiveAge: 25 * 1000,
          // Cuántas páginas mantener simultáneamente compiladas en memoria.
          pagesBufferLength: 3,
        },
      }),
  // ⚡ PERF 2026-05-13: silenciar warning "multiple lockfiles" — el root pnpm-lock.yaml
  // es la fuente de verdad; apps/chat-ia/pnpm-lock.yaml es legacy pre-monorepo.
  outputFileTracingRoot: require('path').join(__dirname, '../..'),
  compiler: {
    emotion: true,
  },
  compress: isProd,
  eslint: {
    // Allow production builds to successfully complete even if
    // your project has ESLint errors (middleware lazy-loading pattern)
    ignoreDuringBuilds: true,
  },
  // ✅ PERF: Ignorar typecheck en build (manejado en CI paralelo)
  typescript: {
    ignoreBuildErrors: true,
  },
  // ✅ PERF: modularizeImports — más agresivo que optimizePackageImports
  // Convierte `import { X, Y } from 'lucide-react'` → imports individuales
  // Reduce drásticamente tiempo compile y bundle size
  modularizeImports: {
    // lucide-react eliminado 2026-05-18: rompía con sufijo Icon (ArrowBigUpIcon →
    // arrow-big-up-icon.js inexistente). optimizePackageImports nativo abajo lo
    // maneja correctamente desde @lobehub/ui (que ahora está en transpilePackages).
    'lodash-es': {
      transform: 'lodash-es/{{member}}',
    },
    '@ant-design/icons': {
      transform: '@ant-design/icons/lib/icons/{{member}}',
      skipDefaultConversion: true,
    },
  },
  experimental: {
    // ⚡ PERF 2026-05-13: eliminado cpus:2 — Turborepo gestiona paralelismo a nivel monorepo.
    // Limitar a 2 cores en máquinas con 10+ cores ralentizaba builds hasta 5×.
    optimizePackageImports: [
      'emoji-mart',
      '@emoji-mart/react',
      '@emoji-mart/data',
      '@icons-pack/react-simple-icons',
      '@lobehub/ui',
      '@lobehub/icons',
      'gpt-tokenizer',
      // ✅ Agregados para reducir bundle size
      'antd',
      '@ant-design/icons',
      '@ant-design/icons-svg',
      'lucide-react',
      'react-icons',
      'lodash-es',
      'date-fns',
      // ✅ Agregar más paquetes grandes para optimizar
      '@apollo/client',
      'framer-motion',
      '@tanstack/react-query',
      'zustand',
      // SPRINT-B 2026-05-19: tree-shaking electron-client-ipc en builds web.
      // 39 imports detrás de guard isDesktop — solo carga lo invocado en runtime.
      '@lobechat/electron-client-ipc',
      // SPRINT-C 2026-05-19: tree-shaking model-runtime (14 imports residuales
      // tras migración chat-ia → api-ia). El package pesa 284 archivos con SDKs
      // OpenAI/Anthropic/Bedrock/Google/etc — tree-shaking carga solo invokes.
      '@lobechat/model-runtime',
      // SPRINT-D 2026-05-19: tree-shaking model-bank (35 imports tras SPRINT-A.1-3).
      // 75 archivos con catálogo modelos + types — tree-shaking carga solo lo usado.
      'model-bank',
      // Packages internos chat-ia con muchos archivos — tree-shaking individual.
      '@lobechat/types',
      '@lobechat/const',
      '@lobechat/utils',
      '@lobechat/database',
      '@lobechat/prompts',
      '@lobechat/context-engine',
      // External UI helpers — pesados sin tree-shaking nativo.
      '@lobehub/chat-plugin-sdk',
      '@lobehub/market-sdk',
      '@lobehub/editor',
      // SPRINT-U 2026-05-20: paquetes pesados con barrel exports que aún no estaban.
      // antd-style: 547 archivos importan from 'antd-style' — barrel masivo.
      'antd-style',
      '@lobehub/charts',           // 5 archivos (profile/stats + ConsumptionChart)
      '@lobehub/analytics',        // 4 archivos analytics
      '@cyntler/react-doc-viewer', // 5 archivos FileViewer renderers
      'recharts',                  // 3 archivos billing + artifacts + ConsumptionChart
      'langfuse',                  // 2 archivos libs/traces server-side
      'langfuse-core',
      // SPRINT-AC 2026-05-20: packages workspace @bodasdehoy/* compilados a dist.
      // Tree-shake exports inferidos del barrel index.js → ahorra bundle inicial cliente.
      '@bodasdehoy/shared',
      '@bodasdehoy/memories',
      '@bodasdehoy/wedding-creator',
      '@bodasdehoy/auth-ui',
      '@bodasdehoy/copilot-shared',
      // SPRINT-AE 2026-05-20: top npm packages con barrel exports descubiertos via grep.
      'react-layout-kit',   // 728 archivos (Flexbox, Center, etc)
      'react-router-dom',   // 36 archivos /discover/* (legacy LobeChat — tech debt: migrar a next/navigation)
      'swr',                // 49 archivos
      // SPRINT-AO 2026-05-20: más packages npm con barrel + uso significativo.
      'ahooks',             // 13 archivos (hooks library ~1MB barrel)
      'use-merge-value',    // 10 archivos
      'react-hotkeys-hook', // 7 archivos
      '@formkit/auto-animate', // 3 archivos
      'react-responsive',   // 2 archivos
      'modern-screenshot',  // 2 archivos
      // SPRINT-AP 2026-05-20: top imports library con barrel.
      'react-i18next',      // 579 archivos — useTranslation principalmente
      'zod',                // 63 archivos
      // 2026-06-03: medido en bundle server real de /chat (.next/server/app).
      // Barrels grandes que NO estaban en la lista. @emotion/react=397 módulos (#2
      // tras @lobehub/ui=427), dayjs=177. Tree-shaking nativo reduce su fan-out.
      '@emotion/react',     // 397 módulos en bundle /chat (styled/css/keyframes)
      'dayjs',              // 177 módulos (locales + plugins barrel)
      '@next/third-parties', // 36 módulos (Google tag/Analytics — barrel)
    ],

    // ✅ Limitar CPUs para reducir memoria paralela
    // ✅ OPTIMIZACIÓN: Deshabilitar features que consumen memoria
    serverActions: {
      bodySizeLimit: '2mb', // ✅ Limitar tamaño para reducir memoria
    },

    // oidc provider depend on constructor.name
    // but swc minification will remove the name
    // so we need to disable it
    // refs: https://github.com/lobehub/lobe-chat/pull/7430
    serverMinification: false,

    webVitalsAttribution: ['CLS', 'LCP'],

    webpackMemoryOptimizations: true,
  },

  async headers() {
    const securityHeaders = [
      {
        key: 'x-robots-tag',
        value: 'all',
      },
    ];

    if (shouldUseCSP) {
      securityHeaders.push(
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Content-Security-Policy',
          value: "frame-ancestors 'none';",
        },
      );
    }

    return [
      {
        headers: securityHeaders,
        source: '/:path*',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/icons/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/images/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/videos/(.*).(mp4|webm|ogg|avi|mov|wmv|flv|mkv)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/screenshots/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/og/(.*).(png|jpe?g|gif|svg|ico|webp)',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/favicon.ico',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/favicon-32x32.ico',
      },
      {
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
        source: '/apple-touch-icon.png',
      },
    ];
  },

  // Desactivar optimización de imágenes con sharp para evitar errores en Vercel ARM64
  // Ver: https://nextjs.org/docs/messages/sharp-missing-in-production
  images: {
    unoptimized: true,
  },

  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },

  // ✅ Desactivar source maps en producción para reducir memoria
  productionBrowserSourceMaps: false,

  allowedDevOrigins: [
    'chat.bodasdehoy.com', 'app.bodasdehoy.com',
    'chat-test.bodasdehoy.com', 'app-test.bodasdehoy.com',
    'memories-test.bodasdehoy.com', 'editor-test.bodasdehoy.com',
    'chat-dev.bodasdehoy.com', 'app-dev.bodasdehoy.com',
    'memories-dev.bodasdehoy.com', 'editor-dev.bodasdehoy.com',
    'wedding-creator.bodasdehoy.com',
    '127.0.0.1', 'localhost',
    '192.168.1.48',
  ],

  reactStrictMode: true,

  redirects: async () => [
    {
      destination: '/iatext/api2',
      permanent: false,
      source: '/go/api2',
    },
    {
      destination: '/sitemap-index.xml',
      permanent: true,
      source: '/sitemap.xml',
    },
    {
      destination: '/sitemap-index.xml',
      permanent: true,
      source: '/sitemap-0.xml',
    },
    {
      destination: '/sitemap/plugins-1.xml',
      permanent: true,
      source: '/sitemap/plugins.xml',
    },
    {
      destination: '/sitemap/assistants-1.xml',
      permanent: true,
      source: '/sitemap/assistants.xml',
    },
    {
      destination: '/manifest.webmanifest',
      permanent: true,
      source: '/manifest.json',
    },
    {
      destination: '/discover/assistant',
      permanent: true,
      source: '/discover/assistants',
    },
    {
      destination: '/discover/plugin',
      permanent: true,
      source: '/discover/plugins',
    },
    {
      destination: '/discover/model',
      permanent: true,
      source: '/discover/models',
    },
    {
      destination: '/discover/provider',
      permanent: true,
      source: '/discover/providers',
    },
    // {
    //   destination: '/settings/common',
    //   permanent: true,
    //   source: '/settings',
    // },
    {
      destination: '/chat',
      permanent: true,
      source: '/welcome',
    },
    // TODO: 等 V2 做强制跳转吧
    // {
    //   destination: '/settings/provider/volcengine',
    //   permanent: true,
    //   source: '/settings/provider/doubao',
    // },
    // we need back /repos url in the further
    {
      destination: '/files',
      permanent: false,
      source: '/repos',
    },
  ],

  // ✅ PROXY para backend Python (evita CORS)
  // Usa BACKEND_INTERNAL_URL para servidor separado o localhost para desarrollo
  async rewrites() {
    const backendUrl = process.env.API_IA_URL || process.env.API_IA_URL || process.env.API_IA_URL || 'http://localhost:8030';

    console.log('[next.config] Proxying API requests to:', backendUrl);

    return {
      // fallback: se aplica DESPUÉS de todos los routes (incluyendo dinámicos).
      // Esto permite que src/app/(backend)/api/memories/[...path]/route.ts
      // maneje /api/memories/* antes que el catch-all /api/:path*.
      // El catch-all solo actúa cuando NO existe un route handler que coincida.
      fallback: [
        // Proxy original para /api/backend/*
        {
          destination: `${backendUrl}/:path*`,
          source: '/api/backend/:path*',
        },
        // Proxy para debug logs (evita CORS)
        {
          destination: `${backendUrl}/api/debug-logs/:path*`,
          source: '/api/debug-logs/:path*',
        },
        // Proxy para developers API (evita CORS)
        {
          destination: `${backendUrl}/api/developers/:path*`,
          source: '/api/developers/:path*',
        },
        // Proxy para config API (evita CORS)
        {
          destination: `${backendUrl}/api/config/:path*`,
          source: '/api/config/:path*',
        },
        // Catch-all: rutas /api/* sin handler propio van al backend Python.
        // /api/memories/* tiene su route handler y nunca llega aquí.
        {
          destination: `${backendUrl}/api/:path*`,
          source: '/api/:path*',
        },
        // Proxy para edición de imágenes (/webapi/image/edit/{operation} → api-ia)
        {
          destination: `${backendUrl}/webapi/image/edit/:operation`,
          source: '/webapi/image/edit/:operation',
        },
      ],
    };
  },

  // when external packages in dev mode with turbopack, this config will lead to bundle error
  // También excluimos sharp para evitar errores de compatibilidad ARM64 en Vercel
  serverExternalPackages: isProd ? ['@electric-sql/pglite', 'sharp'] : undefined,

  // ⚡ FASE 4 PR-4.3 (2026-05-13): packages compartidos eliminados de transpilePackages
  // tras FASE 3 (dist build). Next los carga pre-compilados → ahorra recompile en cada build.
  // SOLO quedan los packages externos que aún requieren transpile (no tienen dist propio).
  // SPRINT-AG 2026-05-20: eliminado @lobehub/ui del array (estaba como workaround Next 15.5.9
  // RSC bug del 2026-05-18). Si Modal/Drawer/Markdown rompen, revertir esta línea.
  // SPRINT-AH 2026-05-20: eliminado pdfjs-dist — dep removida en SPRINT-J, transpile sin efecto.
  // 🧪 2026-06-02: eliminado 'mermaid' de transpilePackages. @lobehub/ui ya lo carga LAZY
  // (es/hooks/useMermaid.js → `import('mermaid')`), así que transpilarlo eager (65MB + cytoscape
  // + d3) solo inflaba el grafo de compilación de /chat sin necesidad. Si los diagramas mermaid
  // dejan de renderizar en el chat, revertir esta línea a ['mermaid'].
  transpilePackages: [],

  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
      // ⚡ Skip rebuild de módulos no afectados por cambios (Next 15+ / webpack 5)
      cacheUnaffected: true,
    };

    // ⚡ PERF 2026-05-13: eliminado parallelism:2 — webpack usa todos los cores disponibles.
    // En máquinas con 10+ cores, limitar a 2 era 5× más lento.

    // ✅ Cache filesystem en dev: evita recompilar 44k módulos en cada restart
    if (!isProd) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: require('path').join(__dirname, '.next/cache/webpack'),
        compression: false,
        maxMemoryGenerations: 1,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días — entradas frecuentes se mantienen, antiguas se purgan
      };
    }

    // ✅ Optimizaciones de memoria para build
    if (isProd) {
      // ✅ Deshabilitar source maps para reducir memoria y tamaño
      config.devtool = false;

      // ✅ Filesystem cache: builds posteriores 3-5× más rápidos
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: require('path').join(__dirname, '.next/cache/webpack'),
        compression: 'gzip',
        maxMemoryGenerations: 1,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días — TTL explícito (sin esto cache crecía 9GB+)
      };

      // ✅ Optimizaciones de output para código más liviano
      config.optimization = {
        ...config.optimization,
        chunkIds: 'deterministic',
        minimize: true,
        minimizer: config.optimization?.minimizer,
        moduleIds: 'deterministic',
        // Evitar chunks muy pequeños (reduce cantidad de archivos)
        mergeDuplicateChunks: true,
        removeEmptyChunks: true,
        // Tree-shaking más agresivo
        innerGraph: true,
        sideEffects: true,
      };

      // Reducir logging
      config.infrastructureLogging = {
        level: 'error',
      };

      // Deshabilitar hints de performance
      config.performance = {
        hints: false,
      };
    }

    // 开启该插件会导致 pglite 的 fs bundler 被改表
    if (enableReactScan && !isUsePglite) {
      config.plugins.push(ReactComponentName({}));
    }

    // to fix shikiji compile error
    // refs: https://github.com/antfu/shikiji/issues/23
    config.module.rules.push({
      resolve: {
        fullySpecified: false,
      },
      test: /\.m?js$/,
      type: 'javascript/auto',
    });

    // https://github.com/pinojs/pino/issues/688#issuecomment-637763276
    config.externals.push('pino-pretty');

    config.resolve.alias.canvas = false;

    // to ignore epub2 compile error
    // refs: https://github.com/lobehub/lobe-chat/discussions/6769
    config.resolve.fallback = {
      ...config.resolve.fallback,
      zipfile: false,
    };

    return config;
  },
};

const noWrapper = (config: NextConfig) => config;

const withBundleAnalyzer = process.env.ANALYZE === 'true' ? analyzer() : noWrapper;

const withPWA =
  isProd && !isDesktop
    ? withSerwistInit({
        register: false,
        swDest: 'public/sw.js',
        swSrc: 'src/app/sw.ts',
      })
    : noWrapper;

// Sentry — solo en producción Y solo cuando hay DSN configurado.
// ⚡ PERF 2026-05-13: condicionado a isProd para evitar overhead webpack-plugin en dev.
import { withSentryConfig } from '@sentry/nextjs';
const sentryOptions = {
  silent: true,
  org: 'itel-0n',
  project: 'chat-ia',
  widenClientFileUpload: true,
  hideSourceMaps: true,
  webpack: { treeshake: { removeDebugLogging: true } },
  disableClientWebpackPlugin: !isProd,
  disableServerWebpackPlugin: !isProd,
};
const withSentry = (cfg: NextConfig) =>
  isProd && process.env.NEXT_PUBLIC_SENTRY_DSN
    ? withSentryConfig(cfg, sentryOptions)
    : cfg;

export default withBundleAnalyzer(withPWA(withSentry(nextConfig) as NextConfig));

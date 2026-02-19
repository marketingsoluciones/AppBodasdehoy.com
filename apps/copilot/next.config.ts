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
  compiler: {
    emotion: true,
  },
  compress: isProd,
  eslint: {
    // Allow production builds to successfully complete even if
    // your project has ESLint errors (middleware lazy-loading pattern)
    ignoreDuringBuilds: true,
  },
  experimental: {
    // ✅ Solo limitar CPUs en producción (build), no en desarrollo
    // 2 CPUs: seguro con 8GB — 1 CPU era demasiado conservador
    ...(isProd && { cpus: 2 }),

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
      'graphql',
      'framer-motion',
      '@tanstack/react-query',
      'zustand',
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
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL || process.env.PYTHON_BACKEND_URL || 'http://localhost:8030';

    console.log('[next.config] Proxying API requests to:', backendUrl);

    return [
      // Proxy original para /api/backend/*
      {
        destination: `${backendUrl}/:path*`,
        source: '/api/backend/:path*',
      },
      // ✅ NUEVO: Proxy para debug logs (evita CORS)
      {
        destination: `${backendUrl}/api/debug-logs/:path*`,
        source: '/api/debug-logs/:path*',
      },
      // ✅ NUEVO: Proxy para developers API (evita CORS)
      {
        destination: `${backendUrl}/api/developers/:path*`,
        source: '/api/developers/:path*',
      },
      // ✅ NUEVO: Proxy para config API (evita CORS)
      {
        destination: `${backendUrl}/api/config/:path*`,
        source: '/api/config/:path*',
      },
      // ✅ NUEVO: Proxy genérico para cualquier otra llamada /api/* no cubierta arriba
      // IMPORTANTE: Este debe ir al final para no sobrescribir los específicos
      {
        destination: `${backendUrl}/api/:path*`,
        source: '/api/:path*',
      },
    ];
  },

  // when external packages in dev mode with turbopack, this config will lead to bundle error
  // También excluimos sharp para evitar errores de compatibilidad ARM64 en Vercel
  serverExternalPackages: isProd ? ['@electric-sql/pglite', 'sharp'] : undefined,

  transpilePackages: ['pdfjs-dist', 'mermaid'],

  typescript: {
    ignoreBuildErrors: true,
  },

  webpack(config) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // ✅ Optimizaciones de memoria para dev (evitar OOM con webpack ~6GB)
    if (!isProd) {
      config.parallelism = 2; // Reducir de 10 (CPU cores) a 2 para ahorrar memoria

      // ✅ Cache filesystem en dev: evita recompilar 44k módulos en cada restart
      // Sin esto, cada crash/restart → 400s+ de recompilación completa
      config.cache = {
        type: 'filesystem',
        cacheDirectory: require('path').join(__dirname, '.next/cache/webpack'),
        compression: false, // Sin compresión en dev → más rápido escribir/leer cache
        maxMemoryGenerations: 1, // Limitar generaciones en memoria
      };
    }

    // ✅ Optimizaciones de memoria para build
    if (isProd) {
      // 2 CPUs: equilibrio entre velocidad y memoria (seguro con 8GB)
      config.parallelism = 2;

      // ✅ Deshabilitar source maps para reducir memoria y tamaño
      config.devtool = false;

      // ✅ Filesystem cache: builds posteriores 3-5× más rápidos
      // Solo recompila módulos que cambiaron — sin cache = compilar todo desde 0
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename], // Invalida cache si cambia next.config.ts
        },
        // Guardar en .next/cache/webpack (ya ignorado por git)
        cacheDirectory: require('path').join(__dirname, '.next/cache/webpack'),
        compression: 'gzip',
        // Máximo 500MB de cache en disco
        maxMemoryGenerations: 1,
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

export default withBundleAnalyzer(withPWA(nextConfig as NextConfig));

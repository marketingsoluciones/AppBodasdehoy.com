/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar React Strict Mode para mejor desarrollo
  reactStrictMode: true,

  // Deshabilitar indicadores de desarrollo que causan errores en Next.js 15
  devIndicators: false,

  // Transpile packages del monorepo y @lobehub/ui
  // Agregado 'debug' y 'supports-color' para solucionar error ESM con dependencies de @lobehub/editor
  transpilePackages: ['@bodasdehoy/shared', '@lobehub/ui', '@lobehub/editor', 'react-layout-kit', 'debug', 'supports-color'],

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
  experimental: {
    // Optimizar imports de paquetes grandes
    optimizePackageImports: ['react-icons', 'lucide-react', 'framer-motion', '@lobehub/ui'],
  },

  // Webpack config para resolver módulos ESM de @lobehub/ui
  webpack: (config, { isServer }) => {
    // Resolver extensiones sin .js en ESM
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
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

    return config;
  },

  // Rewrites para el proxy de Lobe-Chat. Este proyecto no usa localhost; siempre chat-test.
  async rewrites() {
    const copilotBase = (process.env.NEXT_PUBLIC_CHAT || 'https://chat-test.bodasdehoy.com').replace(/\/$/, '');
    return [
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
      // Proxy para API GraphQL (evitar CORS en desarrollo)
      {
        source: '/api/graphql/:path*',
        destination: 'https://apiapp.bodasdehoy.com/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

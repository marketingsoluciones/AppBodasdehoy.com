/** @type {import('next').NextConfig} */
const nextConfig = {
  // Habilitar React Strict Mode para mejor desarrollo
  reactStrictMode: true,

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
    optimizePackageImports: ['react-icons', 'lucide-react', 'framer-motion'],
  },
};

module.exports = nextConfig;

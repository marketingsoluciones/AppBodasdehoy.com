/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bodasdehoy/wedding-creator'],
  allowedDevOrigins: [
    'editor-dev.bodasdehoy.com',
    'editor-test.bodasdehoy.com',
    '127.0.0.1',
    'localhost',
  ],
  // El paquete wedding-creator se type-checka en Copilot; aquí solo compilamos.
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
};

// Sentry — solo activo cuando NEXT_PUBLIC_SENTRY_DSN está definido.
// En dev se deshabilita el webpack plugin para evitar overhead de compilación.
const { withSentryConfig } = require('@sentry/nextjs');
const isProdBuild = process.env.NODE_ENV === 'production';

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: 'itel-0n',
      project: 'editor-web',
      widenClientFileUpload: true,
      hideSourceMaps: true,
      webpack: { treeshake: { removeDebugLogging: true } },
      disableClientWebpackPlugin: !isProdBuild,
      disableServerWebpackPlugin: !isProdBuild,
    })
  : nextConfig;

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
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bodasdehoy/wedding-creator'],
  // El paquete wedding-creator se type-checka en Copilot; aquí solo compilamos.
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;

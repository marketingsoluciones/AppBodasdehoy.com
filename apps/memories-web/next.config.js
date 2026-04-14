/** @type {import('next').NextConfig} */
const path = require('path');
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bodasdehoy/memories', '@bodasdehoy/shared'],
  i18n,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.bodasdehoy.com' },
      { protocol: 'https', hostname: '*.eventosorganizador.com' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  allowedDevOrigins: [
    'memories-dev.bodasdehoy.com',
    'memories-test.bodasdehoy.com',
    '127.0.0.1',
    'localhost',
  ],
  headers: async () => [{
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
    ],
  }],
  // Proxy para evitar CORS en desarrollo local
  rewrites: async () => [
    {
      source: '/api/graphql',
      destination: process.env.API2_GRAPHQL_URL || 'https://api2.eventosorganizador.com/graphql',
    },
    {
      source: '/api/memories/:path*',
      destination: `${process.env.API_IA_URL || 'https://api-ia.bodasdehoy.com'}/api/memories/:path*`,
    },
  ],
  webpack: (config) => {
    // Deduplicate React — prevents "Invalid hook call" in monorepo when packages
    // resolve their own React from nested node_modules instead of app's copy.
    config.resolve.alias = {
      ...config.resolve.alias,
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    };
    return config;
  },
};

const { withSentryConfig } = require('@sentry/nextjs');

module.exports = process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: true,
      org: 'itel-0n',
      project: 'memories-web',
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    })
  : nextConfig;

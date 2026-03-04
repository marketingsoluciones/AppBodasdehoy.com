/** @type {import('next').NextConfig} */
const path = require('path');
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@bodasdehoy/memories'],
  i18n,
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

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@alip/shared-types'],
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

module.exports = nextConfig;

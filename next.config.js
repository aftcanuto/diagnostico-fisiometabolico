/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverComponentsExternalPackages: ['puppeteer'] },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] }
};
module.exports = nextConfig;

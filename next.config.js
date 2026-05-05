/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium'] },
  outputFileTracingIncludes: {
    '/api/pdf': ['./node_modules/@sparticuz/chromium/bin/**/*'],
    '/api/pdf/publico': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] }
};
module.exports = nextConfig;

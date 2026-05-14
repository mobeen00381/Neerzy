import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/gmb-checker',
        destination: '/gmb-audit-tool',
        permanent: true,
      },
      {
        source: '/dashboard/gmb-checker',
        destination: '/gmb-audit-tool',
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' 
                https://js.paddle.com 
                https://cdn.paddle.com 
                https://www.googletagmanager.com 
                https://apis.google.com 
                https://accounts.google.com 
                https://vercel.live 
                https://*.vercel.app;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' https: data:;
              connect-src 'self' 
                https://api.paddle.com 
                https://www.neerzy.com 
                https://*.supabase.co 
                https://*.googleapis.com 
                https://vercel.live 
                https://*.vercel.app 
                https://analytics.vercel.com;
              frame-src 'self' https://js.paddle.com https://vercel.live;
              child-src 'self';
              form-action 'self';
              frame-ancestors 'none';
              base-uri 'self';
              upgrade-insecure-requests;
            `.replace(/\s+/g, ' ').trim()
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ];
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'www.neerzy.com' },
      { protocol: 'https', hostname: '*.googleapis.com' },
      { protocol: 'https', hostname: '*.gstatic.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  compress: true,
};

export default nextConfig;

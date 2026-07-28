import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Permanent (301) redirects for retired public routes. The public site is
  // management-only: /arbitrage and /management fold into the homepage, and
  // /stays is replaced by the owner-facing /portfolio.
  // `statusCode: 301` is used instead of `permanent: true` (which emits 308)
  // so previously indexed URLs get the classic permanent redirect.
  async redirects() {
    return [
      { source: '/arbitrage', destination: '/', statusCode: 301 },
      { source: '/management', destination: '/', statusCode: 301 },
      { source: '/stays', destination: '/portfolio', statusCode: 301 },
    ];
  },
};

export default nextConfig;

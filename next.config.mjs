const isPreviewDeployment = process.env.VERCEL_ENV === 'preview';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_PREVIEW_NOINDEX: String(isPreviewDeployment),
  },
  async redirects() {
    return [
      { source: "/", destination: "/articles", permanent: true },
      { source: '/article', destination: '/articles', permanent: true },
      // Single segment only: /article/<folder>/<image> remains a public asset.
      { source: '/article/:slug', destination: '/articles/:slug', permanent: true },
      { source: '/tags/:tag', destination: '/tag/:tag', permanent: true },
    ];
  },
  async headers() {
    return isPreviewDeployment ? [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ] : [];
  },
};

export default nextConfig;

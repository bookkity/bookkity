const isPreviewDeployment = process.env.VERCEL_ENV === 'preview';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_PREVIEW_NOINDEX: String(isPreviewDeployment),
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

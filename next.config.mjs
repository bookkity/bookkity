import {PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD} from 'next/constants.js';

const isPreviewDeployment = process.env.VERCEL_ENV === 'preview';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_PREVIEW_NOINDEX: String(isPreviewDeployment),
  },
  async redirects() {
    return [
      { source: '/articles/0-10', destination: '/articles', permanent: true },
      { source: '/tag/:tag/0-10', destination: '/tag/:tag', permanent: true },
      { source: "/", destination: "/articles", permanent: true },
      { source: '/article', destination: '/articles', permanent: true },
      // Single segment only: /article/<folder>/<image> remains a public asset.
      { source: '/article/:slug', destination: '/articles/:slug', permanent: true },
      { source: '/tags/:tag', destination: '/tag/:tag', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/search-assets/:path*',
        headers: [{key: 'Cache-Control', value: 'public, max-age=31536000, immutable'}],
      },
      ...(isPreviewDeployment ? [{
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      }] : []),
    ];
  },
};

const configureNext = async phase => {
  if ([PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD].includes(phase)) {
    const {buildSearchIndex} = await import('./scripts/build-search-index.mjs');
    const {buildImageSizes} = await import('./scripts/build-image-sizes.mjs');
    await Promise.all([buildSearchIndex(), buildImageSizes()]);
  }
  return nextConfig;
};

export default configureNext;

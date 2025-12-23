import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

const NEXT_PUBLIC_SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL
  ? process.env.NEXT_PUBLIC_SERVER_URL
  : 'https://smartvisioncm.com'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here

  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL, 'https://smartvisioncm.com'].map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
          pathname: '/api/media/file/**',
        }
      }),
    ],
    // Add this to handle dynamic query parameters
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  reactStrictMode: true,
  redirects,
  output: 'standalone',
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

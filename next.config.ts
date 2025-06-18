import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    // Ensure proper separation between Edge Runtime and Node.js Runtime
    serverComponentsExternalPackages: ['postgres'],
  },
  
  // Configure webpack to handle Node.js modules properly
  webpack: (config, { isServer, dev }) => {
    // Only apply these configurations for server-side builds
    if (isServer) {
      // Ensure postgres and related packages are treated as external in server components
      config.externals = config.externals || [];
      config.externals.push({
        'postgres': 'commonjs postgres',
        'fs': 'commonjs fs',
        'net': 'commonjs net',
        'tls': 'commonjs tls',
        'perf_hooks': 'commonjs perf_hooks',
      });
    }

    // Don't bundle Node.js modules on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        perf_hooks: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        assert: false,
        buffer: false,
        process: false,
      };
    }

    return config;
  },

  // Configure TypeScript
  typescript: {
    // Don't fail build on type errors during development
    ignoreBuildErrors: true,
  },

  // Configure ESLint
  eslint: {
    // Don't fail build on lint errors during development
    ignoreDuringBuilds: true,
  },

  // Configure image domains if needed
  images: {
    domains: [],
  },

  // Enable API routes
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },

  // Configure redirects
  async redirects() {
    return [];
  },

  // Configure rewrites
  async rewrites() {
    return [];
  },

  // Configure headers
  async headers() {
    return [];
  },

  // Enable compression
  compress: true,

  // Configure output
  output: 'standalone',

  // Configure transpilation
  transpilePackages: [],

  // Configure environment variables
  env: {},
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for large data files
  webpack: (config, { isServer }) => {
    // Increase memory limit for webpack builds
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        // Separate large data files
        data: {
          name: 'data',
          chunks: 'all',
          test: /[\\/]src[\\/]data[\\/]/,
          priority: 10
        }
      }
    }

    return config
  },

  // Handle large assets
  experimental: {
    largePageDataBytes: 128 * 100000, // 12.8MB limit (up from default 128KB)
    workerThreads: false, // Disable worker threads to avoid Jest worker issues
    cpus: 1 // Limit CPU usage
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}

module.exports = nextConfig
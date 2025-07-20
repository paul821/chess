//next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    experimental: {
      appDir: false
    },
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          path: false,
          crypto: false
        };
      }
      
      // Handle WASM files
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true
      };
      
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'webassembly/async'
      });
      
      return config;
    }
  };
  
  module.exports = nextConfig;
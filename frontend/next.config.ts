import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Provide Buffer polyfill for browser environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve("buffer"),
      };

      config.plugins.push(
        new (require("webpack").ProvidePlugin)({
          Buffer: ["buffer", "Buffer"],
        })
      );
    }
    return config;
  },
};

export default nextConfig;

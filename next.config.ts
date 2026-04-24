import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("swisseph");
    }
    return config;
  },
  serverExternalPackages: ["swisseph"],
};

export default nextConfig;

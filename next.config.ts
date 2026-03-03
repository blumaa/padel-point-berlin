import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["whatsapp-web.js"],
  experimental: {
    turbo: {
      watchOptions: {
        ignored: ["**/.wwebjs_auth/**", "**/.wwebjs_cache/**"],
      },
    },
  },
};

export default nextConfig;

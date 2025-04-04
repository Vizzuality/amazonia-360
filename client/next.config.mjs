import "./src/env.mjs";

import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "js.arcgis.com",
      },
    ],
  },
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
  experimental: {
    // optimizePackageImports: ["react-icons/*"], If you add this your dev server will last forever trying to start
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/custom-api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);

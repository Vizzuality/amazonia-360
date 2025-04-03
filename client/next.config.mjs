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
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "Authorization",
            value: "Hidden",
          },
        ],
        headers: [
          {
            key: "Authorization",
            value: "Hidden",
          },
        ],
      },
    ];
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);

import { withPayload } from "@payloadcms/next/withPayload";
import createBundleAnalizer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

import "./src/env.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Uncomment to allow production builds to successfully complete even if
    // your project has ESLint errors.
    //   ignoreDuringBuilds: true,
  },
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
  // serverExternalPackages: ["@arcgis/core/*"],
  experimental: {
    optimizePackageImports: ["@arcgis/core/*"],
  },
};

const withBundleAnalyzer = createBundleAnalizer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

export default withPayload(withBundleAnalyzer(withNextIntl(nextConfig)));

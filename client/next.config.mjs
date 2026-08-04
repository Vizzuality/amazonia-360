import { withPayload } from "@payloadcms/next/withPayload";
import createBundleAnalizer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

import "./src/env.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only client/Dockerfile consumes .next/standalone. On Vercel this collides
  // with their build adapter: the adapter-driven Turbopack build never writes
  // .next/next-server.js.nft.json, which copyTracedFiles then reads.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  turbopack: {
    root: import.meta.dirname,
  },
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
};

const withBundleAnalyzer = createBundleAnalizer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

export default withPayload(withBundleAnalyzer(withNextIntl(nextConfig)));

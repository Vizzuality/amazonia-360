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
  experimental: {
    // optimizePackageImports: ["react-icons/*"], If you add this your dev server will last forever trying to start
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);

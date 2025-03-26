import "./src/env.mjs";

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
    optimizePackageImports: ["react-icons/*"],
  },
};

export default nextConfig;

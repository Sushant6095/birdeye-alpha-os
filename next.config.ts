import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // typedRoutes disabled until dynamic routes (/token/[chain]/[address] etc.)
  // land in a later part — we link to them speculatively from the search palette.
  typedRoutes: false,
};

export default nextConfig;

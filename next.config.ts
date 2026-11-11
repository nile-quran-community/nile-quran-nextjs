import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Loaded from node_modules at runtime instead of bundled: resvg is a native binary, and
  // satori carries wasm files (HarfBuzz, Yoga). Used by the link-preview image route.
  serverExternalPackages: ["@resvg/resvg-js", "satori"],
};

export default nextConfig;

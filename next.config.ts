import type { NextConfig } from "next";

// AssetSentinel AI — fully static export so the production build can be
// hosted on any static file server (nginx, S3, Netlify, GitHub Pages…).
// NEXT_PUBLIC_BASE_PATH lets the same build be deployed under a subpath
// (e.g. GitHub Pages /<repo>/) without touching app code.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;

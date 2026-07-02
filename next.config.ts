import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Deployed to https://hsiangnianian.github.io/cortex/ — override via env for other deployments.
const BASE_PATH = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH || undefined,
  // trailingSlash helps GitHub Pages resolve directory-style URLs
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);

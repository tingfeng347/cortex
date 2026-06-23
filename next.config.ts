import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const withNextIntl = createNextIntlPlugin();

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Prevent Turbopack from bundling wrangler; it's loaded dynamically by
  // OpenNext's `getCloudflareContext({ async: true })` at runtime.
  serverExternalPackages: ["wrangler"],
};

export default withNextIntl(nextConfig);

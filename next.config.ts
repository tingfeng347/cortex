import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

const withNextIntl = createNextIntlPlugin()

initOpenNextCloudflareForDev()

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
}

export default withNextIntl(nextConfig)

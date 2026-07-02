import { NextResponse } from "next/server";
import { BASE_PATH } from "@/lib/site-config";

export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ locale: "zh-CN" }, { locale: "en" }, { locale: "ja" }];
}

const manifest = {
  name: "认知防锈 · Cognitive Anti-Rust",
  short_name: "认知防锈",
  description: "20 道题给你的认知能力拍一张快照。定期测量，看清趋势——认知能力就像肌肉，用进废退。",
  start_url: `${BASE_PATH}/`,
  display: "standalone",
  background_color: "#fafafa",
  theme_color: "#1a1a1a",
  icons: [
    {
      src: `${BASE_PATH}/favicon.svg`,
      sizes: "any",
      type: "image/svg+xml",
      purpose: "any maskable",
    },
  ],
};

export async function GET() {
  return NextResponse.json(manifest);
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ビルド時に生成された SQLite DB をサーバーレス関数バンドルに含める
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
  },
};

export default nextConfig;

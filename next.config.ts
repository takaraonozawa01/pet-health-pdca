import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 はネイティブモジュールのため Next.js バンドルから外す
  serverExternalPackages: ["better-sqlite3"],

  // ビルド時に生成した SQLite DB をサーバーレス関数バンドルに含める
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
  },
};

export default nextConfig;

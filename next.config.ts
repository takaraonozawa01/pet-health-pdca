import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 はネイティブモジュールのため Next.js バンドルから外す
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;

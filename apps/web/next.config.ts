import type { NextConfig } from "next";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

// 讀取 repo 根目錄的 .env，三個服務共用同一份設定
loadEnvConfig(path.resolve(__dirname, "../.."), process.env.NODE_ENV !== "production", console, true);

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;

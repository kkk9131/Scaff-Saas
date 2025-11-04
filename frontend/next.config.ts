import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Next.js が依存関係解析を行う際のルートディレクトリを明示する。
   * リポジトリ直下に存在する別 lockfile の影響で推測がずれる警告を抑制するため。
   */
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;

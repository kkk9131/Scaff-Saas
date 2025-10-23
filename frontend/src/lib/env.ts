/**
 * 環境変数の型定義とバリデーション
 *
 * このファイルは環境変数を型安全に扱うためのユーティリティを提供します。
 * Next.jsの環境変数システムに完全対応しています。
 */

// 環境変数の型定義
interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

/**
 * 環境変数を取得する関数
 * Next.jsの環境変数は process.env から直接取得します
 * NEXT_PUBLIC_ プレフィックスのある変数はクライアントサイドでも利用可能です
 */
function getEnvVar(key: keyof Env): string {
  const value = process.env[key];

  // 環境変数が見つからない場合はエラーをスロー
  if (!value) {
    throw new Error(
      `環境変数 ${key} が設定されていません。.env.local ファイルを確認してください。`
    );
  }

  return value;
}

/**
 * 環境変数をエクスポート（型安全）
 * Next.jsビルド時にprocess.envから値が注入されます
 */
export const env: Env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
};

// 個別にアクセスする場合のヘルパー
export const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

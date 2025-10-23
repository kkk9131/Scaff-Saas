/**
 * 環境変数の型定義とバリデーション
 *
 * このファイルは環境変数を型安全に扱うためのユーティリティを提供します。
 * アプリケーション起動時に必須の環境変数が設定されているかチェックします。
 */

// 環境変数の型定義
interface Env {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

/**
 * 環境変数を検証して取得する関数
 *
 * @param key - 環境変数のキー
 * @returns 環境変数の値
 * @throws 環境変数が設定されていない場合はエラー
 */
function getEnvVar(key: keyof Env): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `環境変数 ${key} が設定されていません。` +
      `.env.local ファイルを確認してください。`
    );
  }

  return value;
}

/**
 * すべての必須環境変数を検証
 *
 * アプリケーション起動時にこの関数を呼び出すことで、
 * 必要な環境変数がすべて設定されているか確認できます。
 */
function validateEnv(): Env {
  return {
    NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

// 環境変数をエクスポート（型安全）
export const env = validateEnv();

// 個別にアクセスする場合のヘルパー
export const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

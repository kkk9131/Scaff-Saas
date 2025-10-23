import { createBrowserClient } from '@supabase/ssr';
import { env } from './env';

/**
 * Supabaseクライアントの作成（プライベート関数）
 * ブラウザ環境用のクライアント設定
 */
function createSupabaseClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Supabaseクライアントのシングルトンインスタンス
 * アプリケーション全体でこのインスタンスを使用すること
 */
export const supabase = createSupabaseClient();

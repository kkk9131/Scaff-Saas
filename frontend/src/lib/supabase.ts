import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabaseクライアントの作成
 * ブラウザ環境用のクライアント設定
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Supabaseクライアントのシングルトンインスタンス
 */
export const supabase = createClient();

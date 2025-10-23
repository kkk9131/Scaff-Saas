/**
 * Supabaseクライアントの設定
 *
 * このファイルはクライアント側とサーバー側の両方で使用できる
 * Supabaseクライアントを提供します。
 */

import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

/**
 * ブラウザ用Supabaseクライアントを作成
 *
 * クライアントサイドのコンポーネントやフックから使用します。
 * シングルトンパターンで実装し、複数のインスタンスが作成されないようにします。
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * デフォルトエクスポート用のクライアントインスタンス
 *
 * 簡単にインポートできるようにデフォルトエクスポートも提供します。
 * 使用例: import supabase from '@/lib/supabase'
 */
const supabase = createClient();
export default supabase;

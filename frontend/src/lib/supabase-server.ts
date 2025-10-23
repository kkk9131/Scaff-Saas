/**
 * サーバーサイド用Supabaseクライアント
 *
 * このファイルはNext.jsのServer ComponentsやMiddlewareで使用する
 * Supabaseクライアントを提供します。
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

/**
 * サーバーサイド用Supabaseクライアントを作成
 *
 * Server ComponentsやRoute Handlersから使用します。
 * Cookieを使用してセッション管理を行います。
 *
 * @returns Supabaseクライアントインスタンス
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Cookieの取得
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Cookieの設定
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Componentではset/removeは呼び出せないため、
            // エラーが発生しても無視します
          }
        },
        // Cookieの削除
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server Componentではset/removeは呼び出せないため、
            // エラーが発生しても無視します
          }
        },
      },
    }
  );
}

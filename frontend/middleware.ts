/**
 * Next.jsミドルウェア - 認証チェック
 *
 * このミドルウェアはすべてのリクエストで実行され、
 * 保護されたルートへのアクセス時に認証状態をチェックします。
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { env } from '@/lib/env';

/**
 * ミドルウェア関数
 *
 * リクエストごとに実行され、認証が必要なページへのアクセスを制御します。
 * Supabase Authのセッションをチェックし、未認証の場合はログインページにリダイレクトします。
 */
export async function middleware(request: NextRequest) {
  // レスポンスオブジェクトを作成
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ミドルウェア用のSupabaseクライアントを作成
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // Cookieの取得
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        // Cookieの設定（レスポンスに反映）
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        // Cookieの削除（レスポンスに反映）
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // セッションを取得（認証状態をチェック）
  // レビュー指摘: Supabase Authは例外をthrowしないため、try-catchは不要
  const { data: { user } } = await supabase.auth.getUser();

  // 認証が必要なパスのリスト
  const protectedPaths = ['/dashboard', '/draw', '/chat', '/project', '/upload'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // 保護されたパスで未認証の場合、ログインページにリダイレクト
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ログインページに認証済みユーザーがアクセスした場合、ダッシュボードにリダイレクト
  if (request.nextUrl.pathname === '/login' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

/**
 * ミドルウェアを適用するパスの設定
 *
 * すべてのパスに適用しますが、静的ファイルやAPIルートは除外します。
 */
export const config = {
  matcher: [
    /*
     * 以下を除くすべてのパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - 画像ファイル (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

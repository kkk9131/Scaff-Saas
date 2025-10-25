/**
 * Next.jsミドルウェア - 認証チェック
 *
 * このミドルウェアはすべてのリクエストで実行され、
 * 保護されたルートへのアクセス時に認証状態をチェックします。
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

/**
 * ミドルウェア関数
 *
 * リクエストごとに実行され、認証が必要なページへのアクセスを制御します。
 * Supabase Authのセッションをチェックし、未認証の場合はログインページにリダイレクトします。
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // E2Eテスト用の認証バイパス（Playwright実行時に利用）
  // 環境変数が有効な場合はSupabaseチェックをスキップし、そのまま処理を続行
  if (process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === 'true') {
    return response
  }

  // Supabaseサーバークライアントを作成
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // リクエストからCookieを取得
        getAll() {
          return request.cookies.getAll()
        },
        // レスポンスにCookieを設定
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 現在のユーザーを取得
  // レビュー指摘: Supabase Authは例外をthrowしないため、try-catchは不要
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 認証が必要なパスかどうかをチェック
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/projects') ||
    request.nextUrl.pathname.startsWith('/draw') ||
    request.nextUrl.pathname.startsWith('/estimates') ||
    request.nextUrl.pathname.startsWith('/chat') ||
    request.nextUrl.pathname.startsWith('/upload')

  // 認証ページかどうかをチェック
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')

  // 未認証ユーザーが保護されたルートにアクセスしようとした場合
  if (isProtectedRoute && !user) {
    // ログインページにリダイレクト
    const redirectUrl = new URL('/login', request.url)
    // リダイレクト後に元のページに戻れるように、リダイレクト元のURLをクエリパラメータに追加
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 認証済みユーザーが認証ページにアクセスしようとした場合
  if (isAuthRoute && user) {
    // ダッシュボードにリダイレクト
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
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
}

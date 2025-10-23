/**
 * Next.js ミドルウェア
 * 認証が必要なページへのアクセスを制御
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

/**
 * ミドルウェア関数
 * 各リクエストの前に実行され、認証状態をチェック
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  // 現在のセッションを取得
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 認証が必要なパスかどうかをチェック
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/projects') ||
    request.nextUrl.pathname.startsWith('/draw') ||
    request.nextUrl.pathname.startsWith('/estimates') ||
    request.nextUrl.pathname.startsWith('/chat')

  // 認証ページかどうかをチェック
  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup')

  // 未認証ユーザーが保護されたルートにアクセスしようとした場合
  if (isProtectedRoute && !session) {
    // ログインページにリダイレクト
    const redirectUrl = new URL('/login', request.url)
    // リダイレクト後に元のページに戻れるように、リダイレクト元のURLをクエリパラメータに追加
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 認証済みユーザーが認証ページにアクセスしようとした場合
  if (isAuthRoute && session) {
    // ダッシュボードにリダイレクト
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

/**
 * ミドルウェアを適用するパスの設定
 * /_next/static, /_next/image, /favicon.ico などの静的ファイルには適用しない
 */
export const config = {
  matcher: [
    /*
     * 以下のパス以外の全てのリクエストにミドルウェアを適用:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - public フォルダ内のファイル
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

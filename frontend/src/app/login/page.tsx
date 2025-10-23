/**
 * ログイン画面
 * 水色×白×グレー + オレンジアクセント（ライトモード）
 * 青×赤紫 + ブラッドオレンジ（ダークモード）
 */

'use client'

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Checkbox } from '@/components/ui/Checkbox'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Mail, LogIn } from 'lucide-react'

// Google Identity Servicesの最小限の型定義（公式タイプパッケージ未導入のため）
type GoogleAccountsInitializeConfig = {
  client_id: string
  callback?: (response: unknown) => void
}

type GoogleAccountsButtonOptions = {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  size?: 'large' | 'medium' | 'small'
  logo_alignment?: 'left' | 'center'
  width?: string | number
}

type GoogleAccountsId = {
  initialize: (config: GoogleAccountsInitializeConfig) => void
  renderButton: (element: HTMLElement, options: GoogleAccountsButtonOptions) => void
  prompt: (momentListener?: () => void) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId
      }
    }
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()

  // フォームの状態管理
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const [isGoogleScriptLoaded, setGoogleScriptLoaded] = useState(false)
  const [isGoogleButtonRendered, setGoogleButtonRendered] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  // 本番環境ではGoogle OAuth用クライアントIDの指定を必須化
  if (!googleClientId && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID must be set in production')
  }

  // テーマに応じた背景グラデーションと装飾色を計算
  const backgroundGradientClass =
    themeMode === 'dark'
      ? 'bg-gradient-to-br from-sky-950 via-purple-900 to-slate-950'
      : 'bg-gradient-to-br from-white via-sky-100 to-slate-100'

  const topGlowClass =
    themeMode === 'dark' ? 'bg-sky-500/40' : 'bg-sky-300/40'

  const bottomGlowClass =
    themeMode === 'dark' ? 'bg-fuchsia-600/40' : 'bg-rose-200/40'

  const accentGlowClass =
    themeMode === 'dark' ? 'bg-indigo-700/40' : 'bg-cyan-200/40'

  /**
   * ログインフォーム送信処理
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // ログイン実行（rememberMe設定はSupabase側へ委譲）
      const { error } = await signIn(email, password, {
        persistSession: rememberMe,
      })

      if (error) {
        // エラーメッセージを日本語で表示
        if (error.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません')
        } else {
          setError('ログインに失敗しました。もう一度お試しください。')
        }
        setLoading(false)
        return
      }

      // ログイン成功: ダッシュボードにリダイレクト
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('予期しないエラーが発生しました')
      setLoading(false)
    }
  }

  /**
   * Googleログイン処理
   */
  const handleGoogleLogin = useCallback(() => {
    setError('Googleログインは現在準備中です')
    setLoading(false)
  }, [setError, setLoading])

  // HTML要素のクラス変更を監視し、ライト/ダークテーマを検知
  useEffect(() => {
    const updateThemeMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark')
      setThemeMode(isDarkMode ? 'dark' : 'light')
    }

    updateThemeMode()

    const observer = new MutationObserver(updateThemeMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  // Google公式ボタンの描画処理
  useEffect(() => {
    if (!isGoogleScriptLoaded) {
      setGoogleButtonRendered(false)
      return
    }

    if (!googleClientId) {
      setGoogleButtonRendered(false)
      return
    }

    const buttonContainer = googleButtonRef.current
    const googleAccounts = window.google?.accounts?.id

    if (!buttonContainer || !googleAccounts) {
      setGoogleButtonRendered(false)
      return
    }

    // テーマ切り替え時に再描画するため、既存要素を初期化
    buttonContainer.innerHTML = ''
    buttonContainer.dataset.theme = themeMode
    buttonContainer.dataset.variant =
      themeMode === 'dark' ? 'filled_black' : 'filled_blue'

    try {
      googleAccounts.initialize({
        client_id: googleClientId,
        callback: () => {
          // TODO: Supabase OAuth 組み込み時に差し替える
          handleGoogleLogin()
        },
      })

      googleAccounts.renderButton(buttonContainer, {
        type: 'standard',
        shape: 'pill',
        theme: themeMode === 'dark' ? 'filled_black' : 'filled_blue',
        text: 'signin_with',
        size: 'large',
        logo_alignment: 'left',
        width: 320,
      })

      setGoogleButtonRendered(true)
    } catch (err) {
      console.error('Google button render error:', err)
      setGoogleButtonRendered(false)
    }
  }, [googleClientId, handleGoogleLogin, isGoogleScriptLoaded, themeMode])

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${backgroundGradientClass} py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden`}
    >
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        async
        defer
        onLoad={() => setGoogleScriptLoaded(true)}
        onError={() => {
          setGoogleScriptLoaded(false)
          setGoogleButtonRendered(false)
        }}
      />
      {/* ダークテーマ切り替えボタン（右上） */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-48 -right-40 w-[32rem] h-[32rem] ${topGlowClass} rounded-full blur-3xl`}></div>
        <div className={`absolute -bottom-48 -left-40 w-[36rem] h-[36rem] ${bottomGlowClass} rounded-full blur-[120px]`}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] ${accentGlowClass} rounded-full blur-[90px] opacity-70`}></div>
        {themeMode === 'dark' ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.25),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.15),transparent_40%),radial-gradient(circle_at_60%_80%,rgba(255,255,255,0.1),transparent_45%)]" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(255,255,255,0.65),transparent_50%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.45),transparent_45%),radial-gradient(circle_at_50%_75%,rgba(255,255,255,0.55),transparent_50%)]" />
        )}
      </div>

      {/* ログインカード */}
      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* カード */}
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8 sm:p-10 animate-fade-in-up">
          {/* ヘッダー */}
          <div className="text-center space-y-4">
            {/* ロゴ */}
            <div className="flex justify-center">
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent p-1 shadow-lg">
                <div className="w-full h-full bg-background rounded-xl flex items-center justify-center">
                  <Image
                    src="/icon-192.png"
                    alt="ScaffAI Logo"
                    width={64}
                    height={64}
                    className="rounded-lg"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* タイトル */}
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                ScaffAI にログイン
              </h2>
              <p className="text-sm text-muted-foreground">
                足場業務支援SaaSプラットフォーム
              </p>
            </div>
          </div>

          {/* エラーメッセージ表示 */}
          {error && (
            <div className="mt-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 animate-scale-in">
              <p className="text-sm font-medium text-destructive text-center">
                {error}
              </p>
            </div>
          )}

          {/* ログインフォーム */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* メールアドレス入力 */}
              <div>
                <label
                  htmlFor="email-address"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  メールアドレス
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="your@email.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* パスワード入力 */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  パスワード
                </label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {/* ログイン状態を保持 & パスワードを忘れた */}
            <div className="flex items-center justify-between">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                label="ログイン状態を保持"
                disabled={loading}
              />

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                パスワードを忘れた?
              </Link>
            </div>

            {/* ログインボタン */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>ログイン中...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  <span>ログイン</span>
                </div>
              )}
            </Button>

            {/* 区切り線 */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">
                  または
                </span>
              </div>
            </div>

            {/* Googleログインボタン */}
            {googleClientId &&
              (isGoogleButtonRendered ? (
                <div
                  className={`flex justify-center ${loading ? 'pointer-events-none opacity-60' : ''}`}
                  data-theme={themeMode}
                  data-variant={themeMode === 'dark' ? 'filled_black' : 'filled_blue'}
                >
                  <div ref={googleButtonRef} className="g_id_signin" />
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full border-2 transition-all duration-200 text-gray-900 dark:text-white"
                  size="lg"
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-gray-900 dark:text-white" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-gray-900 dark:text-white">Googleでログイン</span>
                  </div>
                </Button>
              ))}
          </form>

          {/* 新規登録リンク */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              アカウントをお持ちでない方は{' '}
              <Link
                href="/signup"
                className="font-medium text-accent hover:text-accent/80 transition-colors"
              >
                新規登録
              </Link>
            </p>
          </div>
        </div>

        {/* フッター */}
        <p className="text-center text-xs text-muted-foreground">
          © 2025 ScaffAI. All rights reserved.
        </p>
      </div>
    </div>
  )
}

/**
 * 新規登録画面
 * メールアドレスとパスワードで新規アカウント作成
 */

'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()

  // フォームの状態管理
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')

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
   * 新規登録フォーム送信処理
   * - 入力値のバリデーションを実施し、Supabase経由でユーザー登録を行う
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // パスワード確認チェック
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    // パスワード長チェック
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    try {
      // 新規登録実行
      const { error } = await signUp(email, password)

      if (error) {
        // エラーメッセージを日本語で表示
        if (error.message.includes('already registered')) {
          setError('このメールアドレスは既に登録されています')
        } else if (error.message.includes('Invalid email')) {
          setError('有効なメールアドレスを入力してください')
        } else {
          setError('登録に失敗しました。もう一度お試しください。')
        }
        setLoading(false)
        return
      }

      // 登録成功
      setSuccess(true)
      setLoading(false)

      // 3秒後にログイン画面にリダイレクト
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Signup error:', err)
      }
      setError('予期しないエラーが発生しました')
      setLoading(false)
    }
  }

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

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${backgroundGradientClass} py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden`}
    >
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

      {/* 登録カード */}
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="bg-card/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8 sm:p-10 animate-fade-in-up">
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
                ScaffAI 新規登録
              </h2>
              <p className="text-sm text-muted-foreground">
                足場業務支援SaaSプラットフォーム
              </p>
            </div>
          </div>

          {/* 成功メッセージ */}
          {success ? (
            <div className="mt-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-emerald-500">
                    登録が完了しました！
                  </h3>
                  <p className="text-sm text-emerald-500/80 leading-relaxed">
                    確認メールを送信しました。メールを確認してアカウントを有効化してください。
                    <br />3秒後にログイン画面へ移動します。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* 新規登録フォーム */
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {/* エラーメッセージ表示 */}
              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 animate-scale-in">
                  <p className="text-sm font-medium text-destructive text-center">{error}</p>
                </div>
              )}

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
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="パスワード（6文字以上）"
                    disabled={loading}
                  />
                </div>

                {/* パスワード確認入力 */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    パスワード（確認用）
                  </label>
                  <PasswordInput
                    id="confirm-password"
                    name="confirm-password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="もう一度同じパスワードを入力してください"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* 登録ボタン */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>登録中...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>新規登録</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                )}
              </Button>

              {/* ログインリンク */}
              <div className="text-center text-sm text-muted-foreground">
                既にアカウントをお持ちの方は{' '}
                <Link
                  href="/login"
                  className="font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  ログイン
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* フッター */}
        <p className="text-center text-xs text-muted-foreground">
          © 2025 ScaffAI. All rights reserved.
        </p>
      </div>
    </div>
  )
}

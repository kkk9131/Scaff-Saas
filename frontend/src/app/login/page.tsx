/**
 * ログイン画面
 * メールアドレスとパスワードでログイン
 */

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()

  // フォームの状態管理
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * ログインフォーム送信処理
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // ログイン実行
      const { error } = await signIn(email, password)

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* ヘッダー */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ScaffAI ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            足場業務支援SaaSプラットフォーム
          </p>
        </div>

        {/* ログインフォーム */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* エラーメッセージ表示 */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            {/* メールアドレス入力 */}
            <div>
              <label htmlFor="email-address" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
                disabled={loading}
              />
            </div>

            {/* パスワード入力 */}
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="パスワード"
                disabled={loading}
              />
            </div>
          </div>

          {/* ログインボタン */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </div>

          {/* 新規登録リンク */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              アカウントをお持ちでない方は{' '}
              <Link
                href="/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                新規登録
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

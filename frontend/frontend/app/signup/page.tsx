/**
 * 新規登録画面
 * メールアドレスとパスワードで新規アカウント作成
 */

'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

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

  /**
   * 新規登録フォーム送信処理
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
      console.error('Signup error:', err)
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
            ScaffAI 新規登録
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            足場業務支援SaaSプラットフォーム
          </p>
        </div>

        {/* 成功メッセージ */}
        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  登録が完了しました！
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>確認メールを送信しました。メールを確認してアカウントを有効化してください。</p>
                  <p className="mt-2">3秒後にログイン画面に移動します...</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* 新規登録フォーム */
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

            <div className="rounded-md shadow-sm space-y-3">
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
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="パスワード（6文字以上）"
                  disabled={loading}
                />
              </div>

              {/* パスワード確認入力 */}
              <div>
                <label htmlFor="confirm-password" className="sr-only">
                  パスワード確認
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="パスワード確認"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 登録ボタン */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '登録中...' : '新規登録'}
              </button>
            </div>

            {/* ログインリンク */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                既にアカウントをお持ちの方は{' '}
                <Link
                  href="/login"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  ログイン
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

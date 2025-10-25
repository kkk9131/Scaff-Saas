/**
 * 認証コンテキスト
 *
 * アプリケーション全体で認証状態を管理するためのReact Contextです。
 * Supabase Authを使用してユーザーのログイン状態を追跡します。
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  Session,
  AuthError,
  SignInWithPasswordCredentials,
} from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

/**
 * PlaywrightなどのE2Eテストで利用するモックユーザー情報
 * 本番では使用されず、NEXT_PUBLIC_E2E_AUTH_BYPASS 環境変数が true の場合のみ有効
 */
const E2E_TEST_USER: User = {
  id: '00000000-0000-4000-8000-0000e2e00001',
  email: 'e2e-user@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: { name: 'E2Eテストユーザー' },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  confirmed_at: '2024-01-01T00:00:00Z',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  last_sign_in_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  role: 'authenticated',
  factor_ids: [],
  identities: [],
} as unknown as User

// ログインオプション: CAPTCHAなどSupabaseが提供する標準オプションに、persistSession制御を追加
type SignInOptions = SignInWithPasswordCredentials['options'] & {
  persistSession?: boolean
}

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null // 現在ログイン中のユーザー情報
  session: Session | null // 現在のセッション情報
  loading: boolean // 認証状態を読み込み中かどうか
  signIn: (
    email: string,
    password: string,
    options?: SignInOptions
  ) => Promise<{ error: AuthError | null }> // ログイン関数
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: AuthError | null }> // 新規登録関数
  signOut: () => Promise<void> // ログアウト関数
}

// 認証コンテキストを作成
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 認証コンテキストプロバイダー
 * 子コンポーネントに認証状態を提供する
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isAuthBypassEnabled =
    process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === 'true'
  const [user, setUser] = useState<User | null>(
    isAuthBypassEnabled ? E2E_TEST_USER : null
  )
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!isAuthBypassEnabled)

  useEffect(() => {
    if (isAuthBypassEnabled) {
      return
    }

    // 初期認証状態を取得
    // レビュー指摘: Supabase Authは例外をthrowしないため、try-catchは不要
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 認証状態の変更をリッスン
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // クリーンアップ: コンポーネントがアンマウントされたらリスナーを解除
    return () => subscription.unsubscribe()
  }, [isAuthBypassEnabled])

  /**
   * ログイン関数
   * メールアドレスとパスワードでログイン
   *
   * @param email ユーザーのメールアドレス
   * @param password ユーザーのパスワード
   * @param options persistSessionやCAPTCHAトークンなどの追加オプション
   *
   * レビュー指摘: Supabase Authは例外をthrowしないため、try-catchは不要
   */
  const signIn = async (
    email: string,
    password: string,
    options?: SignInOptions
  ) => {
    if (isAuthBypassEnabled) {
      // テストモードではログイン処理を即座に成功扱いとし、モックユーザーをセット
      setUser(E2E_TEST_USER)
      setSession(null)
      setLoading(false)
      return { error: null }
    }

    const shouldPersist = options?.persistSession ?? true
    const captchaToken = options?.captchaToken

    // Supabaseクライアント内部のセッション永続化設定を動的に切り替え
    ;(supabase.auth as unknown as { persistSession?: boolean }).persistSession =
      shouldPersist

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    })
    return { error }
  }

  /**
   * 新規登録関数
   * メールアドレスとパスワードで新規アカウント作成
   *
   * レビュー指摘: Supabase Authは例外をthrowしないため、try-catchは不要
   */
  const signUp = async (email: string, password: string) => {
    if (isAuthBypassEnabled) {
      // テストモードではサインアップも即時成功扱いとする
      setUser(E2E_TEST_USER)
      setSession(null)
      setLoading(false)
      return { error: null }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  /**
   * ログアウト関数
   * 現在のセッションを終了
   *
   * レビュー指摘: Supabase Authは例外をthrowしないため、try-catchは不要
   */
  const signOut = async () => {
    if (isAuthBypassEnabled) {
      // テストモードではステートをクリアするだけで完了
      setUser(null)
      setSession(null)
      return
    }

    await supabase.auth.signOut()
  }

  // コンテキストの値を定義
  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * 認証コンテキストを使用するためのカスタムフック
 *
 * 使用例:
 * const { user, session, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

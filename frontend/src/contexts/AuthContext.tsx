/**
 * 認証コンテキスト
 * アプリ全体で認証状態を共有するためのReact Context
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null // 現在ログイン中のユーザー情報
  session: Session | null // 現在のセッション情報
  loading: boolean // 認証状態を読み込み中かどうか
  signIn: (email: string, password: string) => Promise<{ error: Error | null }> // ログイン関数
  signUp: (email: string, password: string) => Promise<{ error: Error | null }> // 新規登録関数
  signOut: () => Promise<void> // ログアウト関数
}

// 認証コンテキストを作成
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * 認証コンテキストプロバイダー
 * 子コンポーネントに認証状態を提供する
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Supabaseクライアントを作成
  const supabase = createClient()

  useEffect(() => {
    // 初期認証状態を取得
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 認証状態の変更をリッスン
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // クリーンアップ: コンポーネントがアンマウントされたらリスナーを解除
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  /**
   * ログイン関数
   * メールアドレスとパスワードでログイン
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  /**
   * 新規登録関数
   * メールアドレスとパスワードで新規アカウント作成
   */
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  /**
   * ログアウト関数
   * 現在のセッションを終了
   */
  const signOut = async () => {
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
 * 認証コンテキストを使用するカスタムフック
 * コンポーネント内で認証状態にアクセスするために使用
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

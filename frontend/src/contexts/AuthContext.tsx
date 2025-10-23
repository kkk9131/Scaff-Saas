/**
 * 認証コンテキスト
 *
 * アプリケーション全体で認証状態を管理するためのReact Contextです。
 * Supabase Authを使用してユーザーのログイン状態を追跡します。
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

// コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 認証プロバイダーコンポーネント
 *
 * アプリケーションのルートレベルでこのコンポーネントをラップすることで、
 * すべての子コンポーネントで認証状態にアクセスできるようになります。
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッションの取得
    // レビュー指摘: Supabase Authは例外をthrowしないため、try-catchは不要
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    initializeAuth();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // クリーンアップ関数
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * メールアドレスとパスワードでログイン
   */
  const signIn = async (email: string, password: string) => {
    // レビュー指摘: Supabase Authは例外をthrowしないため、try-catchは不要
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  /**
   * 新規ユーザー登録
   */
  const signUp = async (email: string, password: string) => {
    // レビュー指摘: Supabase Authは例外をthrowしないため、try-catchは不要
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { error };
  };

  /**
   * ログアウト
   */
  const signOut = async () => {
    // レビュー指摘: Supabase Authは例外をthrowしないため、try-catchは不要
    await supabase.auth.signOut();
  };

  // コンテキストの値
  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 認証コンテキストを使用するためのカスタムフック
 *
 * 使用例:
 * const { user, signIn, signOut } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

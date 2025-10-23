/**
 * 認証状態管理ストア
 * ユーザーの認証情報とログイン状態を管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ユーザー情報の型定義
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
}

// 認証ストアの状態型定義
interface AuthState {
  // 状態
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // アクション
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User) => void;
  logout: () => void;
}

/**
 * 認証ストア
 * localStorageに永続化されるため、ページリロード後も状態が保持される
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 初期状態
      user: null,
      isAuthenticated: false,
      isLoading: true,

      // ユーザー情報をセット
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      // ローディング状態を更新
      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      // ログイン処理
      login: (user) =>
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        }),

      // ログアウト処理
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'auth-storage', // localStorageのキー名
      partialize: (state) => ({
        // 永続化する状態を選択（isLoadingは除外）
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

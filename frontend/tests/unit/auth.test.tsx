/**
 * AuthContext ユニットテスト
 *
 * このテストファイルでは、認証コンテキストの以下の機能をテストします：
 * - AuthProviderの初期化
 * - useAuthフックの動作
 * - signIn, signUp, signOut関数の動作
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// Supabaseクライアントをモック化
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

// モックユーザーとセッション
const mockUser: Partial<User> = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
}

const mockSession: Partial<Session> = {
  user: mockUser as User,
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
}

describe('AuthContext', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks()

    // デフォルトのモック実装を設定
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          id: 'test-subscription-id',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    } as any)
  })

  /**
   * テスト1: AuthProviderの初期化
   */
  it('AuthProviderが正しく初期化される', async () => {
    const TestComponent = () => {
      const { user, loading } = useAuth()
      return (
        <div>
          <div data-testid="user">{user ? user.email : 'null'}</div>
          <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // 初期状態ではloadingがtrueであることを確認
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')

    // セッション取得が完了するまで待機
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    // ユーザーがnullであることを確認
    expect(screen.getByTestId('user')).toHaveTextContent('null')
  })

  /**
   * テスト2: useAuthフックがAuthProvider外で使用されたときにエラー
   */
  it('useAuthフックがAuthProvider外で使用されるとエラーをスロー', () => {
    const TestComponent = () => {
      useAuth()
      return <div>test</div>
    }

    // コンソールエラーを抑制
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => render(<TestComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    )

    consoleSpy.mockRestore()
  })

  /**
   * テスト3: signIn関数の成功
   */
  it('signIn関数が正常に動作する', async () => {
    // signInWithPasswordのモックを設定（成功）
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: mockUser as User,
        session: mockSession as Session,
      },
      error: null,
    } as any)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    // loadingが完了するまで待機
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // signInを実行
    let signInResult: any
    await act(async () => {
      signInResult = await result.current.signIn(
        'test@example.com',
        'password123'
      )
    })

    // エラーがnullであることを確認
    expect(signInResult.error).toBeNull()

    // signInWithPasswordが正しい引数で呼ばれたことを確認
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  /**
   * テスト4: signIn関数の失敗
   */
  it('signIn関数がエラーを返す', async () => {
    const mockError = {
      message: 'Invalid login credentials',
      status: 400,
    }

    // signInWithPasswordのモックを設定（失敗）
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: mockError as any,
    } as any)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // signInを実行
    let signInResult: any
    await act(async () => {
      signInResult = await result.current.signIn(
        'test@example.com',
        'wrongpassword'
      )
    })

    // エラーが返されることを確認
    expect(signInResult.error).toEqual(mockError)
  })

  /**
   * テスト5: signUp関数の動作
   */
  it('signUp関数が正常に動作する', async () => {
    // signUpのモックを設定（成功）
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: mockUser as User,
        session: mockSession as Session,
      },
      error: null,
    } as any)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // signUpを実行
    let signUpResult: any
    await act(async () => {
      signUpResult = await result.current.signUp(
        'newuser@example.com',
        'password123'
      )
    })

    // エラーがnullであることを確認
    expect(signUpResult.error).toBeNull()

    // signUpが正しい引数で呼ばれたことを確認
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'newuser@example.com',
      password: 'password123',
    })
  })

  /**
   * テスト6: signOut関数の動作
   */
  it('signOut関数が正常に動作する', async () => {
    // signOutのモックを設定
    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    } as any)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // signOutを実行
    await act(async () => {
      await result.current.signOut()
    })

    // signOutが呼ばれたことを確認
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  /**
   * テスト7: 認証状態の変更をリッスン
   */
  it('認証状態の変更が正しくリッスンされる', async () => {
    let authStateCallback: any

    // onAuthStateChangeのモックを設定
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(
      (callback) => {
        authStateCallback = callback
        return {
          data: {
            subscription: {
              id: 'test-subscription-id',
              callback,
              unsubscribe: vi.fn(),
            },
          },
        } as any
      }
    )

    const TestComponent = () => {
      const { user } = useAuth()
      return <div data-testid="user-email">{user?.email || 'no user'}</div>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // 初期状態を確認
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('no user')
    })

    // 認証状態の変更をシミュレート
    act(() => {
      authStateCallback('SIGNED_IN', mockSession)
    })

    // ユーザー情報が更新されることを確認
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'test@example.com'
      )
    })
  })
})

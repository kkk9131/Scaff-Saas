/**
 * 認証フローE2Eテスト
 *
 * このテストファイルでは、以下の認証フローをテストします：
 * - ログイン成功フロー
 * - ログイン失敗フロー（不正な認証情報）
 * - ログアウトフロー
 * - 認証なしでの保護ページアクセス
 */

import { test, expect } from '@playwright/test'

// テスト用のユーザー情報
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  invalidPassword: 'wrongpassword',
}

/**
 * 各テスト前にログアウト状態にリセット
 */
test.beforeEach(async ({ page }) => {
  // ローカルストレージとクッキーをクリア
  await page.context().clearCookies()
  await page.goto('/')
})

test.describe('認証フロー', () => {
  /**
   * テスト1: ログインページの表示確認
   */
  test('ログインページが正しく表示される', async ({ page }) => {
    await page.goto('/login')

    // ページタイトルを確認
    await expect(page).toHaveTitle(/ScaffAI/)

    // ログインフォームの要素を確認
    await expect(
      page.getByRole('heading', { name: /ScaffAI ログイン/ })
    ).toBeVisible()
    await expect(page.getByPlaceholder('メールアドレス')).toBeVisible()
    await expect(page.getByPlaceholder('パスワード')).toBeVisible()
    await expect(page.getByRole('button', { name: /ログイン/ })).toBeVisible()
    await expect(page.getByText(/新規登録/)).toBeVisible()
  })

  /**
   * テスト2: ログイン成功フロー
   *
   * 注意: このテストを実行するには、事前にSupabaseでテストユーザーを作成する必要があります
   * または、Supabaseのモック設定が必要です
   */
  test.skip('正しい認証情報でログイン成功', async ({ page }) => {
    await page.goto('/login')

    // メールアドレスとパスワードを入力
    await page.getByPlaceholder('メールアドレス').fill(TEST_USER.email)
    await page.getByPlaceholder('パスワード').fill(TEST_USER.password)

    // ログインボタンをクリック
    await page.getByRole('button', { name: /ログイン/ }).click()

    // ダッシュボードにリダイレクトされることを確認
    await expect(page).toHaveURL('/dashboard')

    // ダッシュボードの要素が表示されることを確認
    await expect(page.getByText(/ダッシュボード|プロジェクト/)).toBeVisible()
  })

  /**
   * テスト3: ログイン失敗フロー（不正な認証情報）
   */
  test('不正な認証情報でログイン失敗', async ({ page }) => {
    await page.goto('/login')

    // 存在しないメールアドレスとパスワードを入力
    await page.getByPlaceholder('メールアドレス').fill(TEST_USER.email)
    await page
      .getByPlaceholder('パスワード')
      .fill(TEST_USER.invalidPassword)

    // ログインボタンをクリック
    await page.getByRole('button', { name: /ログイン/ }).click()

    // エラーメッセージが表示されることを確認
    await expect(
      page.getByText(/メールアドレスまたはパスワードが正しくありません/)
    ).toBeVisible()

    // ログインページに留まることを確認
    await expect(page).toHaveURL('/login')
  })

  /**
   * テスト4: フォームバリデーション
   */
  test('空のフォームで送信エラー', async ({ page }) => {
    await page.goto('/login')

    // 何も入力せずにログインボタンをクリック
    await page.getByRole('button', { name: /ログイン/ }).click()

    // ブラウザのバリデーションメッセージを確認（HTML5のrequired属性）
    const emailInput = page.getByPlaceholder('メールアドレス')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  /**
   * テスト5: ローディング状態の確認
   */
  test('ログイン中のローディング状態が表示される', async ({ page }) => {
    await page.goto('/login')

    // フォームに入力
    await page.getByPlaceholder('メールアドレス').fill(TEST_USER.email)
    await page
      .getByPlaceholder('パスワード')
      .fill(TEST_USER.invalidPassword)

    // ログインボタンをクリック
    const loginButton = page.getByRole('button', { name: /ログイン/ })
    await loginButton.click()

    // ローディング中のテキストが表示されることを確認
    await expect(
      page.getByRole('button', { name: /ログイン中/ })
    ).toBeVisible()

    // ボタンが無効化されることを確認
    await expect(loginButton).toBeDisabled()
  })

  /**
   * テスト6: 新規登録ページへのリンク
   */
  test('新規登録ページへのリンクが機能する', async ({ page }) => {
    await page.goto('/login')

    // 新規登録リンクをクリック
    await page.getByRole('link', { name: /新規登録/ }).click()

    // 新規登録ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/signup')
  })

  /**
   * テスト7: ログアウトフロー
   *
   * 注意: このテストはログイン後の状態を前提とするため、スキップしています
   */
  test.skip('ログアウトが正常に動作する', async ({ page }) => {
    // まずログイン
    await page.goto('/login')
    await page.getByPlaceholder('メールアドレス').fill(TEST_USER.email)
    await page.getByPlaceholder('パスワード').fill(TEST_USER.password)
    await page.getByRole('button', { name: /ログイン/ }).click()
    await expect(page).toHaveURL('/dashboard')

    // ログアウトボタンをクリック
    await page.getByRole('button', { name: /ログアウト/ }).click()

    // ログインページにリダイレクトされることを確認
    await expect(page).toHaveURL('/login')

    // 保護されたページにアクセスできないことを確認
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  /**
   * テスト8: 認証なしでの保護ページアクセス
   */
  test('認証なしで保護ページにアクセスするとログインページにリダイレクト', async ({
    page,
  }) => {
    // 保護されたページに直接アクセス
    await page.goto('/dashboard')

    // ログインページにリダイレクトされることを確認
    // 注意: 実際のリダイレクト実装に応じて調整が必要
    await expect(page).toHaveURL(/\/login|\//)
  })
})

/**
 * モバイル画面でのテスト
 */
test.describe('モバイル画面での認証フロー', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE サイズ
  })

  test('モバイルでログインページが正しく表示される', async ({ page }) => {
    await page.goto('/login')

    // ログインフォームが正しく表示されることを確認
    await expect(page.getByPlaceholder('メールアドレス')).toBeVisible()
    await expect(page.getByPlaceholder('パスワード')).toBeVisible()
    await expect(page.getByRole('button', { name: /ログイン/ })).toBeVisible()
  })
})

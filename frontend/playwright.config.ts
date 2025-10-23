/**
 * Playwright設定ファイル
 * E2Eテストの実行設定を定義
 */

import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright設定
 * - ローカル開発サーバーを自動起動
 * - Chrome, Firefox, Safariでクロスブラウザテスト
 * - テスト失敗時のスクリーンショット・動画を保存
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './tests/e2e',

  // 各テストのタイムアウト（30秒）
  timeout: 30 * 1000,

  // 並列実行の設定
  fullyParallel: true,

  // CI環境では再試行しない
  forbidOnly: !!process.env.CI,

  // ローカルでは1回、CI環境では2回まで再試行
  retries: process.env.CI ? 2 : 0,

  // 並列実行のワーカー数
  workers: process.env.CI ? 1 : undefined,

  // レポート設定
  reporter: 'html',

  // すべてのテストで共通の設定
  use: {
    // ベースURL（Next.jsの開発サーバー）
    baseURL: 'http://localhost:3000',

    // トレース設定（失敗時のみ記録）
    trace: 'on-first-retry',

    // スクリーンショット設定（失敗時のみ）
    screenshot: 'only-on-failure',

    // 動画設定（失敗時のみ）
    video: 'retain-on-failure',
  },

  // 各ブラウザでのテスト設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // モバイルブラウザテスト（オプション）
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // 開発サーバーの自動起動設定
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // サーバー起動タイムアウト（2分）
  },
})

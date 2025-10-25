/**
 * Vitest設定ファイル
 * ユニットテストの実行設定を定義
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Vitest設定
 * - React Testing Libraryでコンポーネントテスト
 * - happy-domでブラウザ環境をシミュレート
 * - TypeScriptパスエイリアス(@/)を解決
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // ブラウザ環境のシミュレーション（happy-domを使用）
    environment: 'happy-dom',

    // グローバルにテスト関数を利用可能にする
    globals: true,

    // セットアップファイル（Testing Libraryの初期化）
    setupFiles: ['./tests/setup.ts'],

    // テストファイルのパターン（E2Eテストを除外）
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/api/**/*.test.{ts,tsx}',
    ],
    exclude: ['node_modules', 'tests/e2e/**'],

    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/*.d.ts',
        '**/types/**',
      ],
    },
  },
  resolve: {
    // TypeScriptパスエイリアスの解決
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

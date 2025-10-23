/**
 * Vitestセットアップファイル
 * Testing Libraryの初期化とグローバル設定
 */

import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// 各テスト後にReactコンポーネントをクリーンアップ
afterEach(() => {
  cleanup()
})

// カスタムマッチャーをVitestに追加
// @testing-library/jest-domのマッチャー（toBeInTheDocument等）が使用可能になる
declare module 'vitest' {
  interface Assertion {
    toBeInTheDocument(): void
    toHaveTextContent(text: string): void
    toHaveAttribute(attr: string, value?: string): void
    toBeDisabled(): void
    toBeEnabled(): void
    toHaveClass(className: string): void
  }
}

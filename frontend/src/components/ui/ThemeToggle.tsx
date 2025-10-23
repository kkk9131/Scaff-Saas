/**
 * ダークテーマ切り替えボタンコンポーネント
 * ライトモード ⇄ ダークモード切り替え
 */

'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from './Button'

export const ThemeToggle = () => {
  // テーマ状態 ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // マウント時にlocalStorageから設定を読み込み
  useEffect(() => {
    setMounted(true)

    // localStorageから保存された設定を取得
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null

    // システムの設定を取得
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light'

    // 保存された設定 > システム設定の優先順位
    const initialTheme = savedTheme || systemTheme
    setTheme(initialTheme)

    // HTMLにクラスを適用
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // テーマ切り替えハンドラー
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)

    // HTMLのクラスを更新
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // localStorageに保存
    localStorage.setItem('theme', newTheme)
  }

  // マウント前はボタンを非表示（ちらつき防止）
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        disabled
        aria-label="テーマ切り替え"
      >
        <div className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-10 w-10 rounded-full hover:bg-secondary/80 transition-all duration-200"
      aria-label={
        theme === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'
      }
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      ) : (
        <Sun className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      )}
    </Button>
  )
}

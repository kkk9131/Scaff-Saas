/**
 * ダークテーマ切り替えボタンコンポーネント
 * ライトモード ⇄ ダークモード切り替え
 */

'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from './Button'

export const ThemeToggle = () => {
  // テーマ状態 ('light' | 'dark')
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

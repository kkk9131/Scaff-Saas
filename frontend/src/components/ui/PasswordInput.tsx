/**
 * パスワード入力コンポーネント
 * 表示/非表示の切り替え機能付き
 */

'use client'

import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from './Input'

// 親コンポーネントから引き継ぐ入力属性をそのまま利用するための型
export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * パスワード入力フィールドコンポーネント
 * 目のアイコンをクリックしてパスワードの表示/非表示を切り替えられる
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    // パスワードの表示/非表示状態
    const [showPassword, setShowPassword] = useState(false)

    // 表示切り替えハンドラー
    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev)
    }

    return (
      <div className="relative">
        {/* パスワード入力フィールド */}
        <Input
          type={showPassword ? 'text' : 'password'}
          className={className}
          ref={ref}
          {...props}
        />

        {/* 表示/非表示切り替えボタン */}
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
          aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
          tabIndex={-1} // Tabキーでのフォーカスを無効化
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

/**
 * チェックボックスコンポーネント
 * アクセシビリティ対応済み
 */

'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

// チェックボックスのスタイルバリアント
const checkboxVariants = cva(
  'peer h-5 w-5 shrink-0 rounded border-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
  {
    variants: {
      variant: {
        default:
          'border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground',
        accent:
          'border-input data-[state=checked]:bg-accent data-[state=checked]:border-accent data-[state=checked]:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof checkboxVariants> {
  // チェック状態
  checked?: boolean
  // チェック状態変更ハンドラー
  onCheckedChange?: (checked: boolean) => void
  // ラベルテキスト
  label?: string
}

/**
 * チェックボックスコンポーネント
 * Radix UIのCheckboxと同等の機能を実装
 * 完全制御型として親コンポーネントから状態を受け取る
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      variant,
      checked = false,
      onCheckedChange,
      label,
      id,
      ...props
    },
    ref
  ) => {
    // ユニークなIDを生成（ラベルとの紐付け用）
    const generatedId = React.useId()
    const checkboxId = id ?? generatedId

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          {/* 実際のinput要素（非表示） */}
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            checked={checked}
            onChange={(e) => {
              onCheckedChange?.(e.target.checked)
              props.onChange?.(e)
            }}
            className="peer absolute opacity-0 h-5 w-5 cursor-pointer"
            {...props}
          />

          {/* カスタムチェックボックス表示 */}
          <div
            className={clsx(checkboxVariants({ variant }), className)}
            data-state={checked ? 'checked' : 'unchecked'}
          >
            {/* チェックマーク */}
            {checked && (
              <Check className="h-4 w-4 text-current animate-scale-in" />
            )}
          </div>
        </div>

        {/* ラベル */}
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

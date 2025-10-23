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
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, variant, checked, onCheckedChange, label, id, ...props },
    ref
  ) => {
    // 内部状態管理
    const [internalChecked, setInternalChecked] = React.useState(
      checked || false
    )

    // 外部からのchecked変更を反映
    React.useEffect(() => {
      if (checked !== undefined) {
        setInternalChecked(checked)
      }
    }, [checked])

    // チェック状態変更ハンドラー
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      setInternalChecked(newChecked)
      onCheckedChange?.(newChecked)
      props.onChange?.(e)
    }

    // ユニークなIDを生成（ラベルとの紐付け用）
    const checkboxId = id || React.useId()

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          {/* 実際のinput要素（非表示） */}
          <input
            type="checkbox"
            id={checkboxId}
            ref={ref}
            checked={internalChecked}
            onChange={handleChange}
            className="peer absolute opacity-0 h-5 w-5 cursor-pointer"
            {...props}
          />

          {/* カスタムチェックボックス表示 */}
          <div
            className={clsx(checkboxVariants({ variant }), className)}
            data-state={internalChecked ? 'checked' : 'unchecked'}
          >
            {/* チェックマーク */}
            {internalChecked && (
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

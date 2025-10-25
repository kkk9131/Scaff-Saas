import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Textareaコンポーネントのプロパティ型定義
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * ラベルテキスト
   */
  label?: string

  /**
   * エラーメッセージ
   */
  error?: string

  /**
   * 全幅表示
   */
  fullWidth?: boolean
}

/**
 * Textareaコンポーネント
 *
 * 複数行テキスト入力フィールド
 * - Inputコンポーネントと統一されたスタイル
 * - エラー表示機能内蔵
 * - リサイズ可能
 *
 * 使用例:
 * ```tsx
 * <Textarea
 *   label="プロジェクト説明"
 *   placeholder="プロジェクトの詳細を入力してください"
 *   rows={4}
 * />
 * <Textarea
 *   label="備考"
 *   error="100文字以内で入力してください"
 * />
 * ```
 *
 * @param label - ラベルテキスト
 * @param error - エラーメッセージ
 * @param fullWidth - 全幅表示フラグ
 * @param className - 追加のCSSクラス
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, fullWidth, disabled, ...props }, ref) => {
    // IDの生成（ラベルとの関連付け用）
    const textareaId = React.useId()

    return (
      <div className={cn('flex flex-col gap-2', fullWidth && 'w-full')}>
        {/* ラベル */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'text-sm font-medium text-foreground',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        {/* テキストエリア本体 */}
        {/* 入力コンポーネントと統一したアウトラインで視認性を揃える */}
        <textarea
          id={textareaId}
          className={cn(
            // 基本スタイル（ライトモード基準）
            'flex min-h-[120px] w-full rounded-xl border border-slate-300 bg-white/95 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400',
            'shadow-[0_8px_26px_-18px_rgba(14,165,233,0.45)] transition-all duration-200 resize-y',
            // フォーカス時のアウトライン
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:border-sky-400',
            // ホバー時
            'hover:border-sky-300 hover:shadow-[0_10px_30px_-18px_rgba(14,165,233,0.5)]',
            // 無効状態
            'disabled:cursor-not-allowed disabled:opacity-60',
            // ダークモード
            'dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-400',
            'dark:shadow-[0_12px_32px_-22px_rgba(15,23,42,0.8)] dark:hover:border-slate-500 dark:hover:shadow-[0_12px_36px_-22px_rgba(15,23,42,0.85)]',
            'dark:focus-visible:ring-slate-500 dark:focus-visible:ring-offset-slate-900 dark:focus-visible:border-slate-400',
            // エラー時
            error &&
              'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-200 hover:border-red-400 dark:border-red-500 dark:focus-visible:ring-red-400/60',
            className
          )}
          ref={ref}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />

        {/* エラーメッセージ */}
        {error && (
          <p
            id={`${textareaId}-error`}
            className="flex items-center gap-1.5 text-sm font-medium text-destructive animate-fade-in-up"
            role="alert"
          >
            {/* エラーアイコン */}
            <svg
              className="h-4 w-4 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }

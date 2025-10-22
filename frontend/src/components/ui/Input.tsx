import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Inputコンポーネントのプロパティ型定義
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * ラベルテキスト
   */
  label?: string;

  /**
   * エラーメッセージ
   */
  error?: string;

  /**
   * 左側に表示するアイコンや要素
   */
  leftElement?: React.ReactNode;

  /**
   * 右側に表示するアイコンや要素
   */
  rightElement?: React.ReactNode;

  /**
   * 全幅表示
   */
  fullWidth?: boolean;
}

/**
 * Inputコンポーネント
 *
 * 職人が使いやすい入力フィールド
 * - 大きめのフォントサイズで視認性向上
 * - 明確なフォーカス状態
 * - エラー表示機能内蔵
 * - アイコン表示対応
 *
 * 使用例:
 * ```tsx
 * <Input placeholder="プロジェクト名を入力" />
 * <Input label="メール" type="email" error="有効なメールアドレスを入力してください" />
 * <Input leftElement={<SearchIcon />} placeholder="検索..." />
 * ```
 *
 * @param label - ラベルテキスト
 * @param error - エラーメッセージ
 * @param leftElement - 左側に表示する要素
 * @param rightElement - 右側に表示する要素
 * @param fullWidth - 全幅表示フラグ
 * @param className - 追加のCSSクラス
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      leftElement,
      rightElement,
      fullWidth,
      disabled,
      ...props
    },
    ref
  ) => {
    // IDの生成（ラベルとの関連付け用）
    const inputId = React.useId();

    return (
      <div className={cn('flex flex-col gap-2', fullWidth && 'w-full')}>
        {/* ラベル */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-foreground',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        {/* 入力フィールドのラッパー */}
        <div className="relative flex items-center">
          {/* 左側要素 */}
          {leftElement && (
            <div className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
              {leftElement}
            </div>
          )}

          {/* 入力フィールド本体 */}
          <input
            id={inputId}
            type={type}
            className={cn(
              // 基本スタイル
              'flex h-12 w-full rounded-lg border-2 border-input',
              'bg-background px-4 py-3 text-base text-foreground',
              'ring-offset-background',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-muted-foreground',
              // トランジション
              'transition-all duration-200',
              // フォーカス状態
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-ring focus-visible:ring-offset-2',
              'focus-visible:border-primary',
              // ホバー状態
              'hover:border-accent/50',
              // 無効状態
              'disabled:cursor-not-allowed disabled:opacity-50',
              // エラー状態
              error &&
                'border-destructive focus-visible:ring-destructive/50',
              // 左要素がある場合はパディング調整
              leftElement && 'pl-10',
              // 右要素がある場合はパディング調整
              rightElement && 'pr-10',
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />

          {/* 右側要素 */}
          {rightElement && (
            <div className="pointer-events-none absolute right-3 flex items-center text-muted-foreground">
              {rightElement}
            </div>
          )}
        </div>

        {/* エラーメッセージ */}
        {error && (
          <p
            id={`${inputId}-error`}
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
    );
  }
);

Input.displayName = 'Input';

export { Input };

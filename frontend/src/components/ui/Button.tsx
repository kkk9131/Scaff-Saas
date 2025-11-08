import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Buttonコンポーネントのバリアントスタイル定義
 *
 * デザインコンセプト:
 * - 職人が手袋をつけていても押しやすい大きなサイズ
 * - 視認性が高く、操作フィードバックが明確
 * - 建設現場のダイナミックさを表現
 */
const buttonVariants = cva(
  // 共通の基本スタイル（全バリアントに適用）
  cn(
    // レイアウト
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap',
    'rounded-lg',
    'font-semibold',
    'transition-all duration-200 ease-out',
    // アクセシビリティ
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    // 無効状態
    'disabled:pointer-events-none disabled:opacity-50',
    // ホバー効果
    'active:scale-95'
  ),
  {
    variants: {
      // バリアント（色とスタイルの種類）
      variant: {
        // デフォルト: シアングラデーション（主要アクション）
        default: cn(
          'bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-600 text-white',
          'shadow-md shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40',
          'hover:scale-105 hover:from-cyan-600 hover:via-cyan-500 hover:to-cyan-700',
          'dark:bg-gradient-to-r dark:from-cyan-600 dark:via-cyan-500 dark:to-cyan-700 dark:hover:from-cyan-700 dark:hover:via-cyan-600 dark:hover:to-cyan-800'
        ),

        // 破壊的アクション: レッド（削除など）
        destructive: cn(
          'bg-[#EF4444] text-white',
          'shadow-md shadow-[#EF4444]/20 hover:shadow-lg hover:shadow-[#EF4444]/30',
          'hover:scale-105 hover:bg-[#DC2626]',
          'dark:bg-[#DC2626] dark:hover:bg-[#B91C1C]'
        ),

        // アウトライン: 枠線のみ（副次アクション）
        outline: cn(
          'border-2 border-gray-300 bg-transparent !text-gray-900',
          'hover:bg-[#06B6D4]/10 hover:border-[#06B6D4] hover:!text-[#06B6D4]',
          'hover:scale-105',
          'dark:border-gray-600 dark:!text-gray-100 dark:hover:bg-[#06B6D4]/20'
        ),

        // セカンダリ: パープル（補助アクション）
        secondary: cn(
          'bg-emerald-600 text-white',
          'shadow-md shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/40',
          'hover:scale-105 hover:bg-emerald-700',
          'dark:bg-emerald-700 dark:hover:bg-emerald-800'
        ),

        // ゴースト: 背景なし（テキストリンク風）
        ghost: cn(
          'hover:bg-[#06B6D4]/10 hover:text-[#06B6D4]',
          'hover:scale-105',
          'dark:hover:bg-[#06B6D4]/20'
        ),

        // リンク: テキストリンク
        link: 'text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400',

        // 成功: シアングラデーション（完了・確定）
        success: cn(
          'bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-600 text-white',
          'shadow-md shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40',
          'hover:scale-105 hover:from-cyan-600 hover:via-cyan-500 hover:to-cyan-700',
          'dark:bg-gradient-to-r dark:from-cyan-600 dark:via-cyan-500 dark:to-cyan-700 dark:hover:from-cyan-700 dark:hover:via-cyan-600 dark:hover:to-cyan-800'
        ),

        // 警告: アンバー（注意喚起）
        warning: cn(
          'bg-[#F59E0B] text-white',
          'shadow-md shadow-[#F59E0B]/20 hover:shadow-xl hover:shadow-[#F59E0B]/40',
          'hover:scale-105 hover:bg-[#D97706]',
          'dark:bg-[#D97706] dark:hover:bg-[#B45309]'
        ),
      },

      // サイズバリアント（職人向けに大きめ設定）
      size: {
        // デフォルト: 標準サイズ
        default: 'h-12 px-6 py-3 text-base',

        // 小: コンパクトなUI用
        sm: 'h-10 px-4 py-2 text-sm',

        // 大: 重要なアクション用（現場での操作を想定）
        lg: 'h-14 px-8 py-4 text-lg',

        // 特大: 最重要アクション用（親指でも押しやすい）
        xl: 'h-18 px-10 py-5 text-xl',

        // アイコンのみ: 正方形ボタン
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Buttonコンポーネントのプロパティ型定義
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * アイコンを左側に表示（lucide-reactなどのアイコンを想定）
   */
  iconLeft?: React.ReactNode;

  /**
   * アイコンを右側に表示
   */
  iconRight?: React.ReactNode;

  /**
   * ローディング状態の表示
   */
  isLoading?: boolean;
}

/**
 * Buttonコンポーネント
 *
 * 使用例:
 * ```tsx
 * <Button>クリック</Button>
 * <Button variant="destructive" size="lg">削除</Button>
 * <Button iconLeft={<Plus />}>新規作成</Button>
 * <Button isLoading>送信中...</Button>
 * ```
 *
 * @param variant - ボタンの種類（default, destructive, outline, secondary, ghost, link, success, warning）
 * @param size - ボタンのサイズ（default, sm, lg, xl, icon）
 * @param iconLeft - 左側に表示するアイコン
 * @param iconRight - 右側に表示するアイコン
 * @param isLoading - ローディング状態
 * @param className - 追加のCSSクラス
 * @param children - ボタン内のテキストや要素
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      iconLeft,
      iconRight,
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* ローディングスピナー */}
        {isLoading && (
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="読み込み中"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {/* 左アイコン */}
        {!isLoading && iconLeft && (
          <span className="flex-shrink-0">{iconLeft}</span>
        )}

        {/* ボタンテキスト */}
        {children}

        {/* 右アイコン */}
        {!isLoading && iconRight && (
          <span className="flex-shrink-0">{iconRight}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };

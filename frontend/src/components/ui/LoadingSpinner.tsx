import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * LoadingSpinnerコンポーネントのプロパティ型定義
 */
export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * スピナーのサイズ
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * 色のバリアント
   */
  variant?: 'primary' | 'secondary' | 'accent' | 'white';

  /**
   * 全画面表示（オーバーレイ付き）
   */
  fullScreen?: boolean;

  /**
   * ローディングテキスト
   */
  text?: string;
}

/**
 * LoadingSpinnerコンポーネント
 *
 * 読み込み中の状態を表示するスピナー
 * - 複数のサイズバリエーション
 * - 色のカスタマイズ
 * - 全画面オーバーレイ対応
 * - アクセシビリティ考慮（aria-label）
 *
 * デザインコンセプト:
 * - 建設現場の回転する足場をイメージした動的なデザイン
 * - 視認性の高いアニメーション
 * - 職人が待ち時間を認識しやすい明確なフィードバック
 *
 * 使用例:
 * ```tsx
 * <LoadingSpinner />
 * <LoadingSpinner size="lg" variant="primary" />
 * <LoadingSpinner fullScreen text="データを読み込んでいます..." />
 * ```
 */
const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  (
    {
      className,
      size = 'md',
      variant = 'primary',
      fullScreen = false,
      text,
      ...props
    },
    ref
  ) => {
    // サイズのマッピング
    const sizeClasses = {
      sm: 'h-6 w-6',
      md: 'h-10 w-10',
      lg: 'h-16 w-16',
      xl: 'h-24 w-24',
    };

    // 色のマッピング
    const variantClasses = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
      white: 'text-white',
    };

    const spinner = (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center gap-4',
          className
        )}
        role="status"
        aria-label="読み込み中"
        {...props}
      >
        {/* スピナー（二重円） */}
        <div className="relative">
          {/* 外側の円 */}
          <svg
            className={cn(
              'animate-spin',
              sizeClasses[size],
              variantClasses[variant]
            )}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>

          {/* 内側の円（逆回転） */}
          <svg
            className={cn(
              'absolute inset-0 animate-spin',
              sizeClasses[size],
              variantClasses[variant]
            )}
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </div>

        {/* ローディングテキスト */}
        {text && (
          <p
            className={cn(
              'animate-pulse text-center font-medium',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-base',
              size === 'lg' && 'text-lg',
              size === 'xl' && 'text-xl',
              variantClasses[variant]
            )}
          >
            {text}
          </p>
        )}

        {/* スクリーンリーダー用テキスト */}
        <span className="sr-only">読み込み中...</span>
      </div>
    );

    // 全画面表示の場合
    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          {spinner}
        </div>
      );
    }

    return spinner;
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * インラインスピナー
 * テキストと一緒に表示できる小さなスピナー
 *
 * 使用例:
 * ```tsx
 * <button>
 *   <InlineSpinner />
 *   保存中...
 * </button>
 * ```
 */
export const InlineSpinner: React.FC<{
  className?: string;
  size?: number;
}> = ({ className, size = 16 }) => {
  return (
    <svg
      className={cn('inline-block animate-spin', className)}
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
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
  );
};

/**
 * ドットスピナー
 * 3つのドットが順番にバウンスするアニメーション
 *
 * 使用例:
 * ```tsx
 * <DotSpinner />
 * ```
 */
export const DotSpinner: React.FC<{
  className?: string;
  dotSize?: 'sm' | 'md' | 'lg';
}> = ({ className, dotSize = 'md' }) => {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      role="status"
      aria-label="読み込み中"
    >
      <span
        className={cn(
          'animate-bounce rounded-full bg-current',
          sizeClasses[dotSize]
        )}
        style={{ animationDelay: '0ms' }}
      />
      <span
        className={cn(
          'animate-bounce rounded-full bg-current',
          sizeClasses[dotSize]
        )}
        style={{ animationDelay: '150ms' }}
      />
      <span
        className={cn(
          'animate-bounce rounded-full bg-current',
          sizeClasses[dotSize]
        )}
        style={{ animationDelay: '300ms' }}
      />
      <span className="sr-only">読み込み中...</span>
    </div>
  );
};

export { LoadingSpinner };
